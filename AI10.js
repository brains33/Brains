
   // ── CSP-COMPLIANT AI10 (Student AI Tutor) ──────────────────────────

// --- XSS PROTECTION ---
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// --- SECURITY CHECK ---
async function securityCheck() {
    try {
        const response = await fetch('https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy', {
            method: 'POST',
            body: JSON.stringify({ action: 'check-system-status' })
        });
        const result = await response.json();
        if (response.status === 503 || result.error === "MAINTENANCE_MODE") {
            document.body.textContent = '';
            const container = document.createElement('div');
            container.style.cssText = 'background:#1a1a1a; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;';
            const h1 = document.createElement('h1');
            h1.style.color = '#ff4444';
            h1.textContent = '⚠️ SYSTEM LOCKED';
            const p = document.createElement('p');
            p.textContent = 'Administrative lockdown is active. Please contact the BRAINS ICT department.';
            container.appendChild(h1);
            container.appendChild(p);
            document.body.appendChild(container);
            window.stop();
        }
    } catch (e) {
        console.log("Security check failed, but proceeding with caution.");
    }
}
securityCheck();

// --- AUTH GUARD (admin check – this is the admin's student-facing AI panel) ---
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: { headers: { 'x-admin-token': sessionStorage.getItem('adminToken') || '' } }
});

(async function() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") { window.location.replace("index.html"); return; }
    const token = sessionStorage.getItem("adminToken");
    if (!token) { window.location.replace("index.html"); return; }
    const { data: isValid, error } = await sb.rpc('verify_admin_token', { submitted_token: token });
    if (error || !isValid) { sessionStorage.clear(); window.location.replace("index.html"); }
})();

// --- EVENT LISTENERS (CSP‑compliant) ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auto‑prompt from admin panel
    const pendingPrompt = sessionStorage.getItem("autoPrompt");
    if (pendingPrompt) {
        document.getElementById("userInput").value = pendingPrompt;
        sessionStorage.removeItem("autoPrompt");
        setTimeout(() => { askAI(); }, 1000);
    }

    // Attach Send button
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', askAI);

    // Attach Enter key
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') askAI();
        });
    }
});

// --- AI CHAT FUNCTIONS ──────────────────────────────────────────────
async function askAI() {
    const input = document.getElementById("userInput");
    const chat = document.getElementById("chatBox");
    const text = input.value.trim();
    
    const student = JSON.parse(sessionStorage.getItem('student_data')) || {};
    
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = text;
    chat.appendChild(userMsg);
    
    input.value = "";
    chat.scrollTop = chat.scrollHeight;

    const loading = document.createElement("div");
    loading.className = "message ai";
    loading.textContent = "⏳ Thinking...";
    chat.appendChild(loading);

    try {
        const { data, error } = await sb.functions.invoke("hyper-api", {
            body: { 
                prompt: text,
                courseCode: student.course || "GENERAL",
                isLecturer: student.role === "admin"
            }
        });

        if (error) throw error;

        if (data?.answer) {
            let rawAnswer = data.answer;
            let sanitisedAnswer = sanitise(rawAnswer);
            
            let formattedReply = sanitisedAnswer
                .replace(/\n/g, "<br>")
                .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

            loading.innerHTML = formattedReply;

            const isCSVRequest = text.toLowerCase().includes("csv") || text.toLowerCase().includes("bulk");
            if (rawAnswer.includes(",") && isCSVRequest) {
                loading.appendChild(document.createElement("br"));
                
                const btn = document.createElement("button");
                btn.className = "download-btn";
                btn.textContent = "📥 Download Bulk Upload CSV";
                btn.addEventListener('click', () => downloadCSV(rawAnswer.replace(/<br>/g, '\n'), "Bulk_Questions.csv"));
                loading.appendChild(btn);
            }
        } else {
            loading.textContent = "❌ Error: " + sanitise(data?.error || "The AI returned an empty response.");
        }

    } catch (err) {
        loading.textContent = "❌ Connection Error. Ensure your internet is active and the Edge Function is deployed.";
        console.error("Supabase Function Error:", err);
    }

    chat.scrollTop = chat.scrollHeight;
}

function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}