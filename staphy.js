// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
function safeErr(err) {
    const msg = (err && err.message) ? String(err.message) : 'An unexpected error occurred.';
    return msg.substring(0, 200);
}
// ─────────────────────────────────────────────────────────────────────

(async function securityCheck() {
    const EXEMPT = ['maintenance', 'index'];
    if (EXEMPT.some(p => window.location.pathname.toLowerCase().includes(p))) return;
    try {
        const r = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check-system-status' })
            }
        );
        const d = await r.json();
        if (r.status === 503 || d.error === 'MAINTENANCE_MODE') {
            document.documentElement.innerHTML = `
                <html><body style="margin:0;background:#0a0f0d;display:flex;
                align-items:center;justify-content:center;min-height:100vh;
                font-family:sans-serif;text-align:center;color:white;">
                <div style="padding:40px;">
                    <div style="font-size:4rem;">🔒</div>
                    <h1 style="color:#ff4444;margin:16px 0;">SYSTEM LOCKED</h1>
                    <p style="color:rgba(255,255,255,0.6);line-height:1.7;">
                        Administrative lockdown is active.<br>
                        Contact the BRAINS AI ICT department.
                    </p>
                    <button onclick="location.reload()"
                        style="margin-top:24px;padding:10px 24px;background:none;
                        border:1px solid #555;color:#aaa;border-radius:8px;cursor:pointer;">
                        ↻ Check Again
                    </button>
                </div></body></html>`;
        }
    } catch(e) { console.warn('Security check skipped:', e.message); }
}());


// ── CONFIG ──────────────────────────────────────────────────────────
const PROXY_URL         = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy';
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION  = 30 * 60 * 1000; // 30 minutes in ms

let lockoutInterval   = null;

// ════════════════════════════════════════
// CLIENT‑SIDE LOCKOUT HELPERS (localStorage)
// ════════════════════════════════════════
function getFailedAttempts() {
    return parseInt(localStorage.getItem('admin_failed_count') || '0');
}
function setFailedAttempts(count) {
    localStorage.setItem('admin_failed_count', count);
}
function clearFailedAttempts() {
    localStorage.removeItem('admin_failed_count');
    localStorage.removeItem('admin_lockout_until');
}

function isLockedOut() {
    const until = localStorage.getItem('admin_lockout_until');
    if (!until) return false;
    if (Date.now() < parseInt(until)) return true;
    // Expired — clean up
    clearFailedAttempts();
    return false;
}

function applyLockout() {
    if (!localStorage.getItem('admin_lockout_until')) {
        localStorage.setItem('admin_lockout_until', Date.now() + LOCKOUT_DURATION);
    }
    updateLockoutUI();
}

function updateLockoutUI() {
    const loginBtn   = document.getElementById('loginButton');
    const nameField  = document.getElementById('name');
    const emailField = document.getElementById('email');
    const passField  = document.getElementById('password');
    const msg        = document.getElementById('msg');

    if (!isLockedOut()) {
        if (loginBtn)   { loginBtn.disabled  = false; loginBtn.innerText = 'LOGIN TO PANEL'; }
        if (nameField)  nameField.disabled  = false;
        if (emailField) emailField.disabled = false;
        if (passField)  passField.disabled  = false;
        if (msg)        msg.innerText = '';
        if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
        return;
    }

    // Disable inputs and button
    if (loginBtn)   { loginBtn.disabled  = true; loginBtn.innerText = 'LOCKED'; }
    if (nameField)  nameField.disabled  = true;
    if (emailField) emailField.disabled = true;
    if (passField)  passField.disabled  = true;

    // Live countdown in the #msg div
    if (msg) {
        const tick = () => {
            const until = parseInt(localStorage.getItem('admin_lockout_until'));
            if (!until || Date.now() >= until) {
                clearFailedAttempts();
                updateLockoutUI();
                return;
            }
            const remaining = Math.ceil((until - Date.now()) / 1000);
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            msg.innerText = `🔒 Too many failed attempts. Try again in ${mins}:${secs.toString().padStart(2, '0')}`;
            msg.style.color = '#ff6b6b';
        };
        tick();
        if (lockoutInterval) clearInterval(lockoutInterval);
        lockoutInterval = setInterval(tick, 1000);
    }
}

// ════════════════════════════════════════
// ADMIN LOGIN (OTP flow)
// ════════════════════════════════════════
async function adminLogin() {
    if (isLockedOut()) { updateLockoutUI(); return; }

    const nameField  = document.getElementById('name');
    const emailField = document.getElementById('email');
    const passField  = document.getElementById('password');
    const loginBtn   = document.getElementById('loginButton');
    const msg        = document.getElementById('msg');

    const name  = nameField.value.trim();
    const email = emailField.value.trim();
    const pwd   = passField.value.trim();

    if (!name || !email || !pwd) {
        msg.innerText = "❌ Fill all fields";
        msg.style.color = "#ff4444";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.innerText = "Verifying Identity...";
    msg.innerText = "";
    msg.style.color = "white";

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "admin-login", name, email, password: pwd })
        });

        const result = await response.json();

        if (!response.ok) {
            const errText = result.error || 'Login Failed';

            if (errText.toLowerCase().includes('too many') ||
                errText.toLowerCase().includes('locked') ||
                errText.toLowerCase().includes('minute')) {
                setFailedAttempts(MAX_FAILED_LOGINS);
                applyLockout();
            } else {
                const newCount = getFailedAttempts() + 1;
                setFailedAttempts(newCount);
                if (newCount >= MAX_FAILED_LOGINS) {
                    applyLockout();
                } else {
                    const attemptsLeft = MAX_FAILED_LOGINS - newCount;
                    msg.innerText = `${safeErr({message: errText})} — ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`;
                    msg.style.color = '#ff6b6b';
                }
            }

            if (!isLockedOut()) {
                loginBtn.disabled = false;
                loginBtn.innerText = 'LOGIN TO PANEL';
            }
            return;
        }

        // Success
        clearFailedAttempts();
        updateLockoutUI();

        msg.innerText = "✅ OTP Sent Successfully!";
        msg.style.color = "#00ff88";

        sessionStorage.setItem('pending_admin_id', result.adminId);
        setTimeout(() => { window.showOtpModal(result.adminId); }, 800);

    } catch (err) {
        msg.innerText = safeErr(err);
        msg.style.color = "#ff4444";
        if (!isLockedOut()) {
            loginBtn.disabled = false;
            loginBtn.innerText = 'LOGIN TO PANEL';
        }
    }
}

// ── OTP MODAL LOGIC ──
window.showOtpModal = function(adminId) {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('modalOtpInput').focus();
    }
};

async function submitModalOTP() {
    const userOTP = document.getElementById("modalOtpInput").value.trim();
    const adminId = sessionStorage.getItem('pending_admin_id');
    const msg = document.getElementById("msg");

    if (!userOTP) return alert("Please enter the code.");

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "admin-verify-otp", otp: userOTP, adminId: adminId })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Invalid Code");

        sessionStorage.setItem("adminLoggedIn", "true");
        sessionStorage.setItem("adminToken", result.sessionToken);

        msg.innerText = "✅ Access Granted. Redirecting...";
        window.location.href = "admin.html";

    } catch (err) {
        alert(safeErr(err));
    }
}

// ── EVENT LISTENERS ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) loginBtn.addEventListener('click', adminLogin);

    const verifyBtn = document.getElementById('verifyOtpButton');
    if (verifyBtn) verifyBtn.addEventListener('click', submitModalOTP);

    const cancelBtn = document.getElementById('cancelOtp');
    if (cancelBtn) cancelBtn.addEventListener('click', function() { location.reload(); });

    const otpInput = document.getElementById('modalOtpInput');
    if (otpInput) {
        otpInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') submitModalOTP();
        });
    }

    // Restore lockout UI on page load
    if (isLockedOut()) applyLockout();
});