   // Add to the very top of student_login.js, dashboard.js, exam.js, and staphy.js
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
            window.stop(); // Stop any other scripts from running
        }
    } catch (e) {
        console.log("Security check failed, but proceeding with caution.");
    }
}

// Run immediately
securityCheck();