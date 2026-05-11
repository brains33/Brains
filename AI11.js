// ── SECURITY CHECK ──────────────────────────────────────────────────
async function securityCheck() {
    try {
        const response = await fetch('https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check-system-status' })
        });
        const result = await response.json();
        if (response.status === 503 || result.error === "MAINTENANCE_MODE") {
            document.body.innerHTML = `
                <div style="background:#0f172a; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif; text-align:center;">
                    <h1 style="color:#ef4444; font-size: 2.5rem;">⚠️ SYSTEM LOCKED</h1>
                    <p style="color:#94a3b8;">Administrative lockdown active. Contact BRAINS ICT.</p>
                </div>`;
            window.stop();
        }
    } catch (e) {
        console.warn("Security check failed (Offline mode or Network Error).");
    }
}
securityCheck();

// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ── SUPABASE CLIENT ────────────────────────────────────────────────
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: {
        headers: {
            'x-student-token': sessionStorage.getItem('studentToken') || ''
        }
    }
});

// ── AUTH GUARD — verifies token against Supabase ──────────────────
window.onload = async function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
        return;
    }

    try {
        const { data, error } = await sb.rpc('verify_student_token', {
            submitted_token: token
        });

        if (error || !data || data.length === 0) {
            sessionStorage.clear();
            window.location.replace("student_login.html");
            return;
        }
        // Token is valid – page stays open, now attach auto-prompt etc.
        initAutoPrompt();
        initEventListeners();
    } catch (e) {
        console.error("Token Verification Error:", e);
        sessionStorage.clear();
        window.location.replace("student_login.html");
    }
};

// ── AUTO-PROMPT LOGIC ─────────────────────────────────────────────
function initAutoPrompt() {
    const pendingPrompt = sessionStorage.getItem("autoPrompt");
    if (pendingPrompt) {
        document.getElementById("userInput").value = pendingPrompt;
        sessionStorage.removeItem("autoPrompt");
        setTimeout(() => { askAI(); }, 1000);
    }
}

// ── AI CHAT FUNCTIONS ─────────────────────────────────────────────
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
        // ✅ Send student token for edge function to verify
        const { data, error } = await sb.functions.invoke("hyper-api", {
            body: { 
                prompt: text,
                courseCode: student.course || "GENERAL",
                isLecturer: student.role === "admin",
                studentToken: sessionStorage.getItem('studentToken') || ''
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

function checkEnter(e) { 
    if (e.key === "Enter") askAI(); 
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

// ── EVENT LISTENERS (CSP‑compliant) ────────────────────────────────
function initEventListeners() {
    document.getElementById('sendBtn')?.addEventListener('click', askAI);

    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', checkEnter);
    }
}