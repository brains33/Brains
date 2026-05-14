

const PROXY_URL    = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;

const matrixInput = document.getElementById('matrixNo');
const tokenInput  = document.getElementById('token');
const activateBtn = document.getElementById('activateBtn');
const msgBox      = document.getElementById('msgBox');

function getClearAttempts() { return parseInt(sessionStorage.getItem('clear_attempts') || '0'); }
function setClearAttempts(n) { sessionStorage.setItem('clear_attempts', String(n)); }
function getClearLockout()   { return parseInt(sessionStorage.getItem('clear_lockout') || '0'); }
function setClearLockout(t)  { sessionStorage.setItem('clear_lockout', String(t)); }

function isClearLockedOut() {
    const until = getClearLockout();
    if (!until) return false;
    if (Date.now() < until) return true;
    sessionStorage.removeItem('clear_attempts');
    sessionStorage.removeItem('clear_lockout');
    return false;
}

function showMsg(type, text) {
    msgBox.className = type ? 'msg ' + type : 'msg';
    msgBox.innerText = text;
}

async function verifyClearance() {
    if (isClearLockedOut()) {
        const remaining = Math.ceil((getClearLockout() - Date.now()) / 60000);
        showMsg('error', 'Too many attempts. Try again in ' + remaining + ' minute(s).');
        return;
    }

    const matrixNo = matrixInput.value.trim().toUpperCase();
    const token    = tokenInput.value.trim().toUpperCase();

    if (!matrixNo || !token) {
        showMsg('error', 'Please fill both fields.');
        return;
    }

    if (!/^[A-Z0-9\/\-\.]+$/.test(matrixNo)) {
        showMsg('error', 'Invalid characters in Matrix Number.');
        return;
    }
    if (!/^[A-Z0-9]+$/.test(token)) {
        showMsg('error', 'Invalid characters in Token.');
        return;
    }

    activateBtn.disabled  = true;
    activateBtn.innerText = 'Verifying...';
    showMsg('', '');

    try {
        const resp = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action:   'verify-clearance-by-matrix',
                matrixNo: matrixNo,
                code:     token
            })
        });

        const result = await resp.json();

        if (!resp.ok) {
            const newCount = getClearAttempts() + 1;
            setClearAttempts(newCount);
            if (newCount >= MAX_ATTEMPTS) {
                setClearLockout(Date.now() + LOCKOUT_MS);
                showMsg('error', 'Too many failed attempts. Locked for 15 minutes.');
            } else {
                const left = MAX_ATTEMPTS - newCount;
                showMsg('error',
                    (result.error || 'Verification failed.') +
                    ' (' + left + ' attempt' + (left !== 1 ? 's' : '') + ' left)'
                );
            }
        } else {
            sessionStorage.removeItem('clear_attempts');
            sessionStorage.removeItem('clear_lockout');
            showMsg('success', result.message || 'Account approved! Redirecting...');
            setTimeout(function() {
                window.location.href = 'student_login.html';
            }, 2000);
        }

    } catch (err) {
        showMsg('error', 'Network error. Please check your connection and try again.');
    } finally {
        activateBtn.disabled  = false;
        activateBtn.innerText = 'ACTIVATE ACCOUNT';
    }
}

// Wire up all events
activateBtn.addEventListener('click', verifyClearance);

matrixInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') verifyClearance();
});

tokenInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') verifyClearance();
});

// Auto uppercase as user types
tokenInput.addEventListener('input', function() {
    var pos = this.selectionStart;
    this.value = this.value.toUpperCase();
    this.setSelectionRange(pos, pos);
});

matrixInput.addEventListener('input', function() {
    var pos = this.selectionStart;
    this.value = this.value.toUpperCase();
    this.setSelectionRange(pos, pos);
});
