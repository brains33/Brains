// ✅ Clear any stale student session on bursary login page load
// Prevents student localStorage from interfering with bursary portal
(function isolateBursaryContext() {
    // Only clear student-specific keys — not busa lockout keys
    ['student_data', 'loginUser', 'activeSubject',
     'saved_exam_progress', 'finished_subjects',
     'muujiza_device_token'].forEach(k => sessionStorage.removeItem(k));
})();

// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
function safeErr(err) {
    const msg = (err && err.message) ? String(err.message) : 'An unexpected error occurred.';
    return msg.substring(0, 120);
}

// ── CONFIG ───────────────────────────────────────────────────────────
const PROXY_URL         = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy';
const SUPABASE_ANON_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION  = 30 * 60 * 1000; // 30 minutes

// ✅ FIX 1: Shared headers — required by Supabase Edge Functions
// Without apikey + Authorization every request returns 401 immediately
const PROXY_HEADERS = {
    'Content-Type':  'application/json',
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

let lockoutInterval = null;

// ── SECURITY CHECK ───────────────────────────────────────────────────
async function securityCheck() {
    try {
        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: PROXY_HEADERS, // ✅ FIX 1 applied
            body:    JSON.stringify({ action: 'check-system-status' })
        });
        const result = await response.json();
        if (response.status === 503 || result.error === 'MAINTENANCE_MODE') {
            document.body.innerHTML = `
                <div style="background:#1a1a1a;color:white;height:100vh;
                            display:flex;flex-direction:column;align-items:center;
                            justify-content:center;font-family:sans-serif;">
                    <h1 style="color:#ff4444;">⚠️ SYSTEM LOCKED</h1>
                    <p>Administrative lockdown is active. Contact the BRAINS ICT department.</p>
                </div>`;
            window.stop();
        }
    } catch (e) {
        console.log('Security check failed — proceeding with caution.');
    }
}
securityCheck();

// ── CLIENT-SIDE LOCKOUT HELPERS ──────────────────────────────────────
function getFailedAttempts() {
    return parseInt(localStorage.getItem('busa_failed_count') || '0');
}
function setFailedAttempts(count) {
    localStorage.setItem('busa_failed_count', String(count));
}
function clearFailedAttempts() {
    localStorage.removeItem('busa_failed_count');
    localStorage.removeItem('busa_lockout_until');
}

function isLockedOut() {
    const until = localStorage.getItem('busa_lockout_until');
    if (!until) return false;
    if (Date.now() < parseInt(until)) return true;
    clearFailedAttempts(); // expired — clean up
    return false;
}

function applyLockout() {
    if (!localStorage.getItem('busa_lockout_until')) {
        localStorage.setItem('busa_lockout_until', String(Date.now() + LOCKOUT_DURATION));
    }
    updateLockoutUI();
}

function updateLockoutUI() {
    const loginBtn   = document.getElementById('loginBtn');
    const emailField = document.getElementById('email');
    const passField  = document.getElementById('password');
    const lockoutMsg = document.getElementById('lockoutMsg');

    if (!isLockedOut()) {
        if (loginBtn)   { loginBtn.disabled = false; loginBtn.innerText = 'LOGIN'; }
        if (emailField) emailField.disabled = false;
        if (passField)  passField.disabled  = false;
        if (lockoutMsg) lockoutMsg.style.display = 'none';
        if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
        return;
    }

    if (loginBtn)   { loginBtn.disabled = true; loginBtn.innerText = 'LOCKED'; }
    if (emailField) emailField.disabled = true;
    if (passField)  passField.disabled  = true;

    if (lockoutMsg) {
        lockoutMsg.style.display = 'block';
        const tick = () => {
            const until = parseInt(localStorage.getItem('busa_lockout_until') || '0');
            if (!until || Date.now() >= until) {
                clearFailedAttempts();
                updateLockoutUI();
                return;
            }
            const remaining = Math.ceil((until - Date.now()) / 1000);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            lockoutMsg.innerText = `🔒 Too many failed attempts. Try again in ${mins}:${secs.toString().padStart(2, '0')}`;
        };
        tick();
        if (lockoutInterval) clearInterval(lockoutInterval);
        lockoutInterval = setInterval(tick, 1000);
    }
}

// ── BURSARY LOGIN ────────────────────────────────────────────────────
async function busaLogin() {
    if (isLockedOut()) { updateLockoutUI(); return; }

    const emailField = document.getElementById('email');
    const passField  = document.getElementById('password');
    const loginBtn   = document.getElementById('loginBtn');

    const inputEmail = emailField.value.trim();
    const inputPass  = passField.value.trim();

    if (!inputEmail || !inputPass) return alert('Please enter Email and Password');

    loginBtn.disabled  = true;
    loginBtn.innerText = 'Authenticating...';

    try {
        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: PROXY_HEADERS, // ✅ FIX 1 applied
            body:    JSON.stringify({ action: 'busa-login', email: inputEmail, password: inputPass })
        });

        const result = await response.json();

        if (!response.ok) {
            const errMsg = (result.error || '').toLowerCase();

            // ✅ FIX 2: Only trigger lockout on status 429 OR explicit lockout/too-many message
            // Previously matched "minute" in "X attempts remaining before 30-minute lockout"
            // which caused premature lockout on attempt 2
            const isRateLimited = response.status === 429 ||
                errMsg.includes('too many') ||
                errMsg.includes('account locked') ||
                errMsg.includes('locked after');   // ← specific phrase, not just "locked"

            if (isRateLimited) {
                // Server confirmed lockout — sync client immediately
                setFailedAttempts(MAX_FAILED_LOGINS);
                applyLockout();
            } else {
                // Wrong password — increment counter, show attempts left
                const newCount = getFailedAttempts() + 1;
                setFailedAttempts(newCount);

                if (newCount >= MAX_FAILED_LOGINS) {
                    applyLockout();
                } else {
                    const attemptsLeft = MAX_FAILED_LOGINS - newCount;
                    alert(
                        `${safeErr({ message: result.error })}` +
                        `\n\n${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before 30-minute lockout.`
                    );
                    loginBtn.disabled  = false;
                    loginBtn.innerText = 'LOGIN';
                }
            }
            return;
        }

        // ── SUCCESS ──────────────────────────────────────────────────
        clearFailedAttempts();
        updateLockoutUI();

        sessionStorage.setItem('busaLoggedIn', 'true');
        sessionStorage.setItem('busaToken',    result.token);
        sessionStorage.setItem('busaData',     JSON.stringify(result.bursarData));

        window.location.href = 'busa_dashboard.html';

    } catch (err) {
        console.error('Login Error:', err);
        alert(safeErr(err));
        if (!isLockedOut()) {
            loginBtn.disabled  = false;
            loginBtn.innerText = 'LOGIN';
        }
    }
}

// ── EVENT BINDING ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn')
        ?.addEventListener('click', busaLogin);

    // Enter key submits from password field
    document.getElementById('password')
        ?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') busaLogin();
        });

    // Restore lockout state on page reload
    if (isLockedOut()) applyLockout();
});
