// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
function safeErr(err) {
    const msg = (err && err.message) ? String(err.message) : 'Unknown error';
    return '❌ ' + msg.substring(0, 120);
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
                    <p>Administrative lockdown is active. Please contact the BRAINS ICT department.</p>
                </div>`;
            window.stop();
        }
    } catch (e) {
        console.log("Security check failed, but proceeding with caution.");
    }
}
securityCheck();

// ─── CONFIGURATION ───
const PROXY_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy';

// Clear session when login page loads
sessionStorage.removeItem("adminLoggedIn");
sessionStorage.removeItem("adminToken");

// Prevent caching / Back button issues (moved from inline script)
window.addEventListener('pageshow', function(e) {
    if (e.persisted) window.location.reload();
});

// ─── LOGIN FUNCTION ───
window.login = async function() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("msg");

    if (!name || !email || !password) {
        msg.innerText = "❌ Fill all fields";
        msg.style.color = "#ff4444";
        return;
    }

    try {
        msg.innerText = "⏳ Verifying Identity...";
        msg.style.color = "white";

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: "admin-login", 
                name, 
                email, 
                password 
            })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Login Failed");

        msg.innerText = "✅ OTP Sent Successfully!";
        msg.style.color = "#00ff88";

        sessionStorage.setItem('pending_admin_id', result.adminId);
        setTimeout(() => { window.showOtpModal(result.adminId); }, 800);

    } catch (err) {
        msg.innerText = safeErr(err);
        msg.style.color = "#ff4444";
    }
};

// ─── OTP MODAL LOGIC ───
window.showOtpModal = function(adminId) {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('modalOtpInput').focus();
    }
};

window.submitModalOTP = async function() {
    const userOTP = document.getElementById("modalOtpInput").value.trim();
    const adminId = sessionStorage.getItem('pending_admin_id');
    const msg = document.getElementById("msg");

    if (!userOTP) return alert("Please enter the code.");

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: "admin-verify-otp", 
                otp: userOTP, 
                adminId: adminId 
            })
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
};

// ─── EVENT LISTENERS (CSP‑compliant, replaces inline onclick) ──────
document.addEventListener('DOMContentLoaded', function() {
    // Login button
    const loginBtn = document.getElementById('loginButton');
    if (loginBtn) loginBtn.addEventListener('click', login);

    // OTP verify button
    const verifyBtn = document.getElementById('verifyOtpButton');
    if (verifyBtn) verifyBtn.addEventListener('click', submitModalOTP);

    // Cancel OTP modal
    const cancelBtn = document.getElementById('cancelOtp');
    if (cancelBtn) cancelBtn.addEventListener('click', function() { location.reload(); });

    // Enter key on OTP input triggers verify
    const otpInput = document.getElementById('modalOtpInput');
    if (otpInput) {
        otpInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') submitModalOTP();
        });
    }
});