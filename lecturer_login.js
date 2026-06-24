// ✅ Clear any stale student/bursary session on lecturer login page load
(function isolateLecturerContext() {
    ['student_data', 'loginUser', 'activeSubject',
     'saved_exam_progress', 'finished_subjects',
     'muujiza_device_token', 'busaLoggedIn', 'busaToken', 'busaData'
    ].forEach(k => sessionStorage.removeItem(k));
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
const PROXY_URL         = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/lecturer-proxy';
const SUPABASE_ANON_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION  = 30 * 60 * 1000; // 30 minutes

// ✅ Shared headers — required by Supabase Edge Functions
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
            headers: PROXY_HEADERS,
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
    return parseInt(localStorage.getItem('lec_failed_count') || '0');
}
function setFailedAttempts(count) {
    localStorage.setItem('lec_failed_count', String(count));
}
function clearFailedAttempts() {
    localStorage.removeItem('lec_failed_count');
    localStorage.removeItem('lec_lockout_until');
}

function isLockedOut() {
    const until = localStorage.getItem('lec_lockout_until');
    if (!until) return false;
    if (Date.now() < parseInt(until)) return true;
    clearFailedAttempts(); // expired — clean up
    return false;
}

function applyLockout() {
    if (!localStorage.getItem('lec_lockout_until')) {
        localStorage.setItem('lec_lockout_until', String(Date.now() + LOCKOUT_DURATION));
    }
    updateLockoutUI();
}

function updateLockoutUI() {
    const loginBtn   = document.getElementById('loginBtn');
    const phoneField = document.getElementById('lecPhone');
    const passField  = document.getElementById('lecPassword');
    const lockoutMsg = document.getElementById('lockCountdown');

    if (!isLockedOut()) {
        if (loginBtn)   { loginBtn.disabled = false; loginBtn.innerText = 'LOGIN'; }
        if (phoneField) phoneField.disabled = false;
        if (passField)  passField.disabled  = false;
        if (lockoutMsg) lockoutMsg.style.display = 'none';
        if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
        return;
    }

    if (loginBtn)   { loginBtn.disabled = true; loginBtn.innerText = 'LOCKED'; }
    if (phoneField) phoneField.disabled = true;
    if (passField)  passField.disabled  = true;

    if (lockoutMsg) {
        lockoutMsg.style.display = 'block';
        const tick = () => {
            const until = parseInt(localStorage.getItem('lec_lockout_until') || '0');
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

// ── LECTURER LOGIN ────────────────────────────────────────────────────
async function lecturerLogin() {
    if (isLockedOut()) { updateLockoutUI(); return; }

    const phoneField = document.getElementById('lecPhone');
    const passField  = document.getElementById('lecPassword');
    const loginBtn   = document.getElementById('loginBtn');

    const inputPhone = phoneField.value.trim();
    const inputPass  = passField.value.trim();

    if (!inputPhone || !inputPass) return alert('Please enter Phone Number and Password');

    loginBtn.disabled  = true;
    loginBtn.innerText = 'Authenticating...';

    try {
        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: PROXY_HEADERS,
            body:    JSON.stringify({ action: 'lecturer-login', phone: inputPhone, password: inputPass })
        });

        const result = await response.json();

        if (!response.ok) {
            const errMsg = (result.error || '').toLowerCase();

            // Only trigger lockout on status 429 OR explicit lockout/too-many message
            const isRateLimited = response.status === 429 ||
                errMsg.includes('too many') ||
                errMsg.includes('account locked') ||
                errMsg.includes('locked after');

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

        sessionStorage.setItem('lecturerLoggedIn', 'true');
        sessionStorage.setItem('lecturerToken',    result.token);
        sessionStorage.setItem('lecturerData',     JSON.stringify(result.lecturer));

        window.location.href = 'lecturer.html';

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
        ?.addEventListener('click', lecturerLogin);

    // Enter key submits from password field
    document.getElementById('lecPassword')
        ?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') lecturerLogin();
        });

    // Restore lockout state on page reload
    if (isLockedOut()) applyLockout();
});
