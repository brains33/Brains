
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
            document.body.textContent = '';
            const container = document.createElement('div');
            container.style.cssText = 'background:#1a1a1a;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;';
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
        console.log("Security check failed, proceeding with caution.");
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

// ── SUPABASE CLIENT ─────────────────────────────────────────────────
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: { headers: { 'x-admin-token': sessionStorage.getItem('adminToken') || '' } }
});

// ── ADMIN AUTH GUARD ─────────────────────────────────────────────────
(async function() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") { window.location.replace("index.html"); return; }
    const token = sessionStorage.getItem("adminToken");
    if (!token) { window.location.replace("index.html"); return; }
    const { data: isValid, error } = await sb.rpc('verify_admin_token', { submitted_token: token });
    if (error || !isValid) { sessionStorage.clear(); window.location.replace("index.html"); }
})();

// ── CONVERSATION HISTORY ────────────────────────────────────────────
let conversationHistory = [];

function addToHistory(role, content) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 8) conversationHistory.shift();
    try { sessionStorage.setItem('ai10_history', JSON.stringify(conversationHistory)); } catch(e) {}
}

function loadHistory() {
    try {
        const saved = sessionStorage.getItem('ai10_history');
        if (saved) conversationHistory = JSON.parse(saved);
    } catch(e) { conversationHistory = []; }
}

function clearHistory() {
    conversationHistory = [];
    sessionStorage.removeItem('ai10_history');
}

// ── TYPING ANIMATION ────────────────────────────────────────────────
async function typeMessage(element, html, speed = 10) {
    if (html.length > 800) { element.innerHTML = html; return; }
    element.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = html;

    async function walkNodes(parent, target) {
        for (const node of parent.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const span = document.createTextNode('');
                target.appendChild(span);
                let current = '';
                for (const ch of node.textContent) {
                    current += ch;
                    span.textContent = current;
                    await new Promise(r => setTimeout(r, speed));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const clone = document.createElement(node.tagName);
                for (const attr of node.attributes) clone.setAttribute(attr.name, attr.value);
                target.appendChild(clone);
                await walkNodes(node, clone);
            }
        }
    }
    await walkNodes(temp, element);
}

// ── FORMAT RESPONSE ─────────────────────────────────────────────────
function formatReply(rawText) {
    return sanitise(rawText)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(0,255,136,0.1);padding:1px 5px;border-radius:3px;font-family:monospace;">$1</code>');
}

// ── SUGGESTION CHIPS ─────────────────────────────────────────────────
const ADMIN_SUGGESTIONS = [
    "Summarise this topic",
    "Generate 5 MCQs on this",
    "What are the clinical implications?",
    "Give an example for students",
    "Create a study note"
];

function showSuggestions() {
    const container = document.getElementById('suggestionChips');
    if (!container) return;
    container.style.display = 'flex';
    container.innerHTML = '';
    const start = conversationHistory.length % ADMIN_SUGGESTIONS.length;
    const picks = [...ADMIN_SUGGESTIONS.slice(start), ...ADMIN_SUGGESTIONS.slice(0, start)].slice(0, 3);
    picks.forEach(s => {
        const chip = document.createElement('button');
        chip.className = 'chip';
        chip.textContent = s;
        chip.addEventListener('click', () => {
            document.getElementById('userInput').value = s;
            askAI();
        });
        container.appendChild(chip);
    });
}

// ── VOICE INPUT ──────────────────────────────────────────────────────
function initVoiceInput() {
    const micBtn = document.getElementById('micBtn');
    if (!micBtn) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { micBtn.style.display = 'none'; return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart  = () => micBtn.classList.add('listening');
    recognition.onend    = () => micBtn.classList.remove('listening');
    recognition.onerror  = () => micBtn.classList.remove('listening');
    recognition.onresult = (event) => {
        document.getElementById('userInput').value = event.results[0][0].transcript;
        askAI();
    };
    micBtn.addEventListener('click', () => { try { recognition.start(); } catch(e){} });
}

// ── MAIN AI FUNCTION ────────────────────────────────────────────────
async function askAI() {
    const input   = document.getElementById("userInput");
    const chat    = document.getElementById("chatBox");
    const text    = input.value.trim();
    const student = JSON.parse(sessionStorage.getItem('student_data')) || {};
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = text;
    chat.appendChild(userMsg);
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    const chipsEl = document.getElementById('suggestionChips');
    if (chipsEl) chipsEl.style.display = 'none';

    const loading = document.createElement('div');
    loading.className = 'message ai';
    loading.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;

    try {
        const { data, error } = await sb.functions.invoke("hyper-api", {
            body: {
                prompt: text,
                courseCode: student.course || "GENERAL",
                mode: "chat",
                history: conversationHistory,
                isLecturer: true
            }
        });

        if (error) throw error;

        if (data?.answer) {
            const formatted = formatReply(data.answer);
            await typeMessage(loading, formatted, 10);

            const isCSVRequest = text.toLowerCase().includes("csv") || text.toLowerCase().includes("bulk");
            if (data.answer.includes(",") && isCSVRequest) {
                const btn = document.createElement("button");
                btn.className = "download-btn";
                btn.textContent = "📥 Download Bulk Upload CSV";
                btn.addEventListener('click', () => downloadCSV(data.answer.replace(/<br>/g, '\n'), "Bulk_Questions.csv"));
                loading.appendChild(document.createElement("br"));
                loading.appendChild(btn);
            }

            addToHistory('user', text);
            addToHistory('assistant', data.answer);
            showSuggestions();

        } else if (data?.error) {
            loading.textContent = "⚠️ " + sanitise(data.error);
        } else {
            loading.textContent = "❌ The AI returned an empty response.";
        }
    } catch (err) {
        loading.textContent = "❌ Connection Error. Ensure your internet is active.";
        console.error("Supabase Function Error:", err);
    }

    chat.scrollTop = chat.scrollHeight;
}

function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
}

function clearChat() {
    const chat = document.getElementById('chatBox');
    if (!chat) return;
    chat.innerHTML = '<div class="message ai">Chat cleared. 🧹 Ask me anything!</div>';
    clearHistory();
    const chipsEl = document.getElementById('suggestionChips');
    if (chipsEl) chipsEl.style.display = 'none';
}

// ── EVENT LISTENERS ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();

    const pendingPrompt = sessionStorage.getItem("autoPrompt");
    if (pendingPrompt) {
        document.getElementById("userInput").value = pendingPrompt;
        sessionStorage.removeItem("autoPrompt");
        setTimeout(() => { askAI(); }, 1000);
    }

    document.getElementById('sendBtn')?.addEventListener('click', askAI);
    document.getElementById('clearBtn')?.addEventListener('click', clearChat);
    document.getElementById('userInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') askAI();
    });

    initVoiceInput();
});
