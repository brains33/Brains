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
// ─────────────────────────────────────────────────────────────────────

async function securityCheck() {
    try {
        const response = await fetch('https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy', {
            method: 'POST',
            body: JSON.stringify({ action: 'check-system-status' })
        });
        const result = await response.json();
        if (response.status === 503 || result.error === "MAINTENANCE_MODE") {
            document.body.innerHTML = `
                <div style="background:#1a1a1a; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
                    <h1 style="color:#ff4444;">⚠️ SYSTEM LOCKED</h1>
                    <p>Administrative lockdown is active. Please contact the BRAINS AI ICT department.</p>
                </div>`;
            window.stop();
        }
    } catch (e) {
        console.log("Security check failed, but proceeding with caution.");
    }
}
securityCheck();

// ── CONFIG ──
const PROXY_URL         = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy';
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_DURATION  = 30 * 60 * 1000; // 30 minutes in ms

let verifiedStudentId = null;
let otpExpiresAt      = null;
let otpTimerInterval  = null;
let lockoutInterval   = null;

// ════════════════════════════════════════
// CLIENT-SIDE LOCKOUT HELPERS
// ════════════════════════════════════════
function getFailedAttempts() {
    return parseInt(localStorage.getItem('login_failed_count') || '0');
}
function setFailedAttempts(count) {
    localStorage.setItem('login_failed_count', count);
}
function clearFailedAttempts() {
    localStorage.removeItem('login_failed_count');
    localStorage.removeItem('login_lockout_until');
}

function isLockedOut() {
    const until = localStorage.getItem('login_lockout_until');
    if (!until) return false;
    if (Date.now() < parseInt(until)) return true;
    clearFailedAttempts();
    return false;
}

function applyLockout() {
    if (!localStorage.getItem('login_lockout_until')) {
        localStorage.setItem('login_lockout_until', Date.now() + LOCKOUT_DURATION);
    }
    updateLockoutUI();
}

function updateLockoutUI() {
    const loginBtn   = document.getElementById('loginBtn');
    const matrixField = document.getElementById('uMatrix');   // changed from uName
    const passField  = document.getElementById('uPass');
    const lockoutMsg = document.getElementById('lockoutMsg');

    if (!isLockedOut()) {
        if (loginBtn)   { loginBtn.disabled  = false; loginBtn.innerText = 'LOGIN'; }
        if (matrixField) matrixField.disabled  = false;
        if (passField)  passField.disabled  = false;
        if (lockoutMsg) lockoutMsg.style.display = 'none';
        if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
        return;
    }

    if (loginBtn)  { loginBtn.disabled  = true; loginBtn.innerText = 'LOCKED'; }
    if (matrixField) matrixField.disabled  = true;
    if (passField)  passField.disabled  = true;

    if (lockoutMsg) {
        lockoutMsg.style.display = 'block';
        const tick = () => {
            const until = parseInt(localStorage.getItem('login_lockout_until'));
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

function showLoginError(text) {
    const el = document.getElementById('loginErrorMsg');
    if (!el) return;
    el.innerText = text || '';
    el.style.display = text ? 'block' : 'none';
}

// ════════════════════════════════════════
// SECTION 1 — LOGIN (UPDATED: uses Matrix)
// ════════════════════════════════════════
async function loginUser() {
    if (isLockedOut()) { updateLockoutUI(); return; }

    const matrixField = document.getElementById('uMatrix');   // ✅ changed input id
    const passField   = document.getElementById('uPass');
    const loginBtn    = document.getElementById('loginBtn');

    const inputMatrix = matrixField.value.trim().toUpperCase();   // ✅ matrix number
    const inputPass   = passField.value.trim();

    showLoginError('');

    if (!inputMatrix || !inputPass) {
        showLoginError('Please enter Matrix Number and Password');
        return;
    }

    loginBtn.disabled  = true;
    loginBtn.innerText = "Authenticating...";

    try {
        const keysToClear = ['activeSubject','exam_questions','student_answers','current_index',
                             'saved_exam_progress','saved_questions_order'];
        keysToClear.forEach(k => localStorage.removeItem(k));

        let myDeviceId = localStorage.getItem('muujiza_device_token');
        if (!myDeviceId) {
            myDeviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('muujiza_device_token', myDeviceId);
        }

        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                action:   "login",
                matrix:   inputMatrix,     // ✅ send matrix, not name
                password: inputPass,
                deviceId: myDeviceId
            })
        });

        const result = await response.json();

        if (!response.ok) {
            const errMsg = result.error || 'Login failed';

            if (errMsg.toLowerCase().includes('account pending approval')) {
                window.location.href = 'payment.html';
                return;
            }

            if (errMsg.toLowerCase().includes('too many')) {
                setFailedAttempts(MAX_FAILED_LOGINS);
                applyLockout();
                return;
            }

            const newCount = getFailedAttempts() + 1;
            setFailedAttempts(newCount);

            if (newCount >= MAX_FAILED_LOGINS) {
                applyLockout();
            } else {
                const attemptsLeft = MAX_FAILED_LOGINS - newCount;
                showLoginError(`${errMsg} — ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`);
                loginBtn.disabled  = false;
                loginBtn.innerText = "LOGIN";
            }
            return;
        }

        // ── SUCCESS ──────────────────────────────────────────────
        clearFailedAttempts();
        updateLockoutUI();
        showLoginError('');

        const studentUser = result.studentData;
        sessionStorage.setItem('student_data', JSON.stringify({
            id:       studentUser.id,
            name:     studentUser.name,
            matrix:   studentUser.matrix_no,
            faculty:  studentUser.faculty   || "Not Specified",
            dept:     studentUser.department ? studentUser.department.toUpperCase().trim() : "N/A",
            level:    studentUser.level,
            semester: studentUser.semester,
            deviceId: myDeviceId
        }));

        sessionStorage.setItem("loginUser",    "true");
        sessionStorage.setItem("studentToken", result.studentToken);

        window.location.href = "dashboard.html";

    } catch (err) {
        console.error("Login Error:", err);
        showLoginError('Network error. Please try again.');
        if (!isLockedOut()) {
            loginBtn.disabled  = false;
            loginBtn.innerText = "LOGIN";
        }
    }
}
// ════════════════════════════════════════
// SECTION 2 — FORGOT PASSWORD (unchanged)
// ════════════════════════════════════════
function openForgot() {
    document.getElementById('forgotModal').classList.add('open');
}

function maskEmail(email) {
    if (!email) return "N/A";
    const [local, domain] = email.split('@');
    const masked = local[0] + "***" + local.slice(-1);
    return `${masked}@${domain}`;
}

function closeForgot() {
    document.getElementById('forgotModal').classList.remove('open');
    clearInterval(otpTimerInterval);
    resetForgotModal();
}

function resetForgotModal() {
    ['fpStep1','fpStep2','fpStep3','fpStep4'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById('fpStep1').classList.add('active');
    document.getElementById('fpMatric').value   = '';
    document.getElementById('fpName').value     = '';
    document.getElementById('fpMsg1').innerText = '';
    verifiedStudentId = null;
    otpExpiresAt      = null;
    clearInterval(otpTimerInterval);
}

function goToStep(n) {
    ['fpStep1','fpStep2','fpStep3','fpStep4'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById(`fpStep${n}`).classList.add('active');
}

function goBackStep1() {
    clearInterval(otpTimerInterval);
    goToStep(1);
}

document.getElementById('forgotModal').addEventListener('click', function(e) {
    if (e.target === this) closeForgot();
});

async function sendOTP() {
    const matric = document.getElementById('fpMatric').value.trim().toUpperCase();
    const name   = document.getElementById('fpName').value.trim();
    const btn    = document.getElementById('fpSendBtn');

    if (!matric || !name) { setMsg('fpMsg1', 'err', 'Please fill in both fields.'); return; }

    btn.disabled  = true;
    btn.innerText = 'Verifying...';
    setMsg('fpMsg1', '', '');

    otpExpiresAt = Date.now() + 10 * 60 * 1000;

    try {
        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action: "send-otp", name, matrix: matric })
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        verifiedStudentId = result.studentId;
        if (result.email) document.getElementById('fpEmailMask').innerText = maskEmail(result.email);

        goToStep(2);
        startOTPTimer();
        document.getElementById('fpOtpInput').value = '';

    } catch (err) {
        setMsg('fpMsg1', 'err', safeErr(err));
        btn.disabled  = false;
        btn.innerText = '📧 SEND VERIFICATION CODE';
    }
}

function startOTPTimer() {
    clearInterval(otpTimerInterval);
    const countdown = document.getElementById('otpCountdown');
    otpTimerInterval = setInterval(() => {
        const remaining = otpExpiresAt - Date.now();
        if (remaining <= 0) {
            clearInterval(otpTimerInterval);
            countdown.innerText      = 'EXPIRED';
            countdown.style.color    = '#ff6b6b';
            setMsg('fpMsg2', 'err', '⏰ Code expired. Go back and request a new one.');
            document.getElementById('fpVerifyBtn').disabled = true;
            return;
        }
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        countdown.innerText = `${m}:${s < 10 ? '0'+s : s}`;
        if (remaining < 120000) countdown.style.color = '#ff6b6b';
    }, 1000);
}

async function verifyOTP() {
    const entered = document.getElementById('fpOtpInput').value.trim();
    const btn     = document.getElementById('fpVerifyBtn');

    if (entered.length !== 6) { setMsg('fpMsg2', 'err', 'Enter the full 6-digit code.'); return; }

    btn.disabled  = true;
    btn.innerText = 'Verifying...';

    try {
        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action: "verify-otp", studentId: verifiedStudentId, otp: entered })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Verification failed');

        clearInterval(otpTimerInterval);
        goToStep(3);

    } catch (err) {
        setMsg('fpMsg2', 'err', safeErr(err));
    } finally {
        btn.disabled  = false;
        btn.innerText = 'VERIFY CODE';
    }
}

async function saveNewPassword() {
    const newPass = document.getElementById('fpNewPass').value;
    const confirm = document.getElementById('fpConfirm').value;
    const btn     = document.getElementById('fpSaveBtn');

    if (newPass.length < 6) { setMsg('fpMsg3', 'err', 'Password must be at least 6 characters.'); return; }
    if (newPass !== confirm) { setMsg('fpMsg3', 'err', 'Passwords do not match.'); return; }

    btn.disabled  = true;
    btn.innerText = 'Saving...';

    try {
        const response = await fetch(PROXY_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ action: "reset-password", studentId: verifiedStudentId, newPassword: newPass })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update password');

        verifiedStudentId = null;
        goToStep(4);

    } catch (err) {
        setMsg('fpMsg3', 'err', safeErr(err));
    } finally {
        btn.disabled  = false;
        btn.innerText = 'SAVE NEW PASSWORD';
    }
}

function setMsg(id, type, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className  = `m-msg ${type}`;
    el.innerText  = text;
}

// ── EVENT LISTENERS (CSP-compliant) ────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('loginBtn')?.addEventListener('click', loginUser);
    document.getElementById('forgotPasswordBtn')?.addEventListener('click', openForgot);
    document.getElementById('fpSendBtn')?.addEventListener('click', sendOTP);
    document.getElementById('cancelForgotBtn')?.addEventListener('click', closeForgot);
    document.getElementById('fpVerifyBtn')?.addEventListener('click', verifyOTP);
    document.getElementById('goBackBtn')?.addEventListener('click', goBackStep1);
    document.getElementById('fpSaveBtn')?.addEventListener('click', saveNewPassword);
    document.getElementById('closeForgotStep4Btn')?.addEventListener('click', closeForgot);

    if (isLockedOut()) applyLockout();
});