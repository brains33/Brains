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
                <div style="background:#0f172a;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;">
                    <h1 style="color:#ef4444;font-size:2.5rem;">⚠️ SYSTEM LOCKED</h1>
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
        headers: { 'x-student-token': sessionStorage.getItem('studentToken') || '' }
    }
});

// ── CONVERSATION HISTORY ────────────────────────────────────────────
let conversationHistory = [];

function addToHistory(role, content) {
    conversationHistory.push({ role, content });
    if (conversationHistory.length > 8) conversationHistory.shift(); // keep last 8 turns
    try { sessionStorage.setItem('ai_history', JSON.stringify(conversationHistory)); } catch(e) {}
}

function loadHistory() {
    try {
        const saved = sessionStorage.getItem('ai_history');
        if (saved) conversationHistory = JSON.parse(saved);
    } catch(e) { conversationHistory = []; }
}

function clearHistory() {
    conversationHistory = [];
    sessionStorage.removeItem('ai_history');
}

// ── TYPING ANIMATION ────────────────────────────────────────────────
async function typeMessage(element, html, speed = 12) {
    // Strip HTML tags to get plain text length; render as HTML but animate char by char
    // We animate on the raw HTML string for speed; for long messages skip animation
    if (html.length > 800) { element.innerHTML = html; return; }
    element.innerHTML = '';
    // Animate by revealing characters — but we must not break mid-tag
    // So we build a temporary div and walk child nodes
    const temp = document.createElement('div');
    temp.innerHTML = html;
    element.innerHTML = '';

    async function walkNodes(parent, target) {
        for (const node of parent.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                let current = '';
                const span = document.createTextNode('');
                target.appendChild(span);
                for (const ch of text) {
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

// ── AUTH GUARD ─────────────────────────────────────────────────────
// Wire up buttons immediately — auth only controls navigation, not interactivity
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initVoiceInput();
});

window.onload = async function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
        return;
    }

    try {
        const { data, error } = await sb.rpc('verify_student_token', { submitted_token: token });
        if (error || !data || data.length === 0) {
            sessionStorage.clear();
            window.location.replace("student_login.html");
            return;
        }

        loadHistory();
        populateCourseDropdown();
        prefillCourseFromStudent();
        initAutoPrompt();

    } catch (e) {
        console.error("Token Verification Error:", e);
        sessionStorage.clear();
        window.location.replace("student_login.html");
    }
};

// ── COURSE DROPDOWN ─────────────────────────────────────────────────
async function populateCourseDropdown() {
    try {
        const student = JSON.parse(sessionStorage.getItem('student_data')) || {};
        const query = sb.from('questions').select('course');
        if (student.dept)     query.eq('department', student.dept.toUpperCase().trim());
        if (student.level)    query.eq('level', student.level);
        if (student.semester) query.eq('semester', student.semester);

        const { data } = await query;
        if (!data) return;
        const unique = [...new Set(data.map(c => (c.course || '').toUpperCase().trim()))].filter(Boolean).sort();
        const dl = document.getElementById('courseList');
        if (dl) dl.innerHTML = unique.map(c => `<option value="${c}">`).join('');
    } catch(e) { console.warn("Course dropdown error:", e); }
}

function prefillCourseFromStudent() {
    const student = JSON.parse(sessionStorage.getItem('student_data')) || {};
    const ci = document.getElementById('courseInput');
    // Use last used course from sessionStorage if available
    const lastCourse = sessionStorage.getItem('ai_last_course');
    if (ci && lastCourse) ci.value = lastCourse;
    else if (ci && student.course) ci.value = student.course.toUpperCase();
}

// ── AUTO-PROMPT ─────────────────────────────────────────────────────
function initAutoPrompt() {
    const pendingPrompt = sessionStorage.getItem("autoPrompt");
    if (pendingPrompt) {
        document.getElementById("userInput").value = pendingPrompt;
        sessionStorage.removeItem("autoPrompt");
        setTimeout(() => { askAI(); }, 1000);
    }
}

// ── SUGGESTION CHIPS ────────────────────────────────────────────────
const GENERIC_SUGGESTIONS = [
    "Explain more simply",
    "Give a clinical example",
    "What are the key points?",
    "Create 3 quiz questions on this",
    "Compare with a related topic"
];

function showSuggestions(context) {
    const container = document.getElementById('suggestionChips');
    if (!container) return;
    container.style.display = 'flex';
    container.innerHTML = '';
    // Pick 3 suggestions; rotate based on history length so they vary
    const start = conversationHistory.length % GENERIC_SUGGESTIONS.length;
    const picks = [...GENERIC_SUGGESTIONS.slice(start), ...GENERIC_SUGGESTIONS.slice(0, start)].slice(0, 3);
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

// ── VOICE INPUT ─────────────────────────────────────────────────────
function initVoiceInput() {
    const micBtn = document.getElementById('micBtn');
    if (!micBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        micBtn.style.display = 'none';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart  = () => micBtn.classList.add('listening');
    recognition.onend    = () => micBtn.classList.remove('listening');
    recognition.onerror  = () => micBtn.classList.remove('listening');

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('userInput').value = transcript;
        askAI();
    };

    micBtn.addEventListener('click', () => {
        try { recognition.start(); } catch(e) { /* already started */ }
    });
}

// ── FORMAT RESPONSE ─────────────────────────────────────────────────
function formatReply(rawText) {
    return sanitise(rawText)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(0,255,136,0.1);padding:1px 5px;border-radius:3px;font-family:monospace;">$1</code>');
}

// ── MAIN AI FUNCTION ────────────────────────────────────────────────
async function askAI() {
    const input    = document.getElementById("userInput");
    const chat     = document.getElementById("chatBox");
    const text     = input.value.trim();
    const courseEl = document.getElementById('courseInput');
    const student  = JSON.parse(sessionStorage.getItem('student_data')) || {};

    if (!text) return;

    // Get course — prefer explicit input, fallback to student data
    const courseCode = (courseEl?.value.trim().toUpperCase() || student.course || 'GENERAL');
    if (courseEl) sessionStorage.setItem('ai_last_course', courseCode);

    // Render user bubble
    const userMsg = document.createElement('div');
    userMsg.className = 'message user';
    userMsg.textContent = text;
    chat.appendChild(userMsg);
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    // Hide suggestion chips while thinking
    const chipsEl = document.getElementById('suggestionChips');
    if (chipsEl) chipsEl.style.display = 'none';

    // Thinking indicator with animated dots
    const loading = document.createElement('div');
    loading.className = 'message ai';
    loading.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;

    try {
        const { data, error } = await sb.functions.invoke("hyper-api", {
            body: {
                prompt: text,
                courseCode,
                mode: "chat",
                history: conversationHistory,          // ← conversation memory
                isLecturer: student.role === "admin",
                studentToken: sessionStorage.getItem('studentToken') || ''
            }
        });

        if (error) throw error;

        if (data?.answer) {
            const rawAnswer  = data.answer;
            const formatted  = formatReply(rawAnswer);

            // Type the answer character by character
            await typeMessage(loading, formatted, 10);

            // Add CSV download button if applicable
            const isCSVRequest = text.toLowerCase().includes("csv") || text.toLowerCase().includes("bulk");
            if (rawAnswer.includes(",") && isCSVRequest) {
                const btn = document.createElement("button");
                btn.className = "download-btn";
                btn.textContent = "📥 Download Bulk Upload CSV";
                btn.addEventListener('click', () => downloadCSV(rawAnswer.replace(/<br>/g, '\n'), "Bulk_Questions.csv"));
                loading.appendChild(document.createElement("br"));
                loading.appendChild(btn);
            }

            // Save to conversation history
            addToHistory('user', text);
            addToHistory('assistant', rawAnswer);

            // Show follow-up suggestions
            showSuggestions(rawAnswer);

        } else if (data?.error) {
            loading.textContent = "⚠️ " + sanitise(data.error);
        } else {
            loading.textContent = "❌ The AI returned an empty response. Please try again.";
        }

    } catch (err) {
        loading.textContent = "❌ Connection Error. Check your internet and try again.";
        console.error("Supabase Function Error:", err);
    }

    chat.scrollTop = chat.scrollHeight;
}

// ── HELPERS ─────────────────────────────────────────────────────────
function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

function clearChat() {
    const chat = document.getElementById('chatBox');
    if (!chat) return;
    chat.innerHTML = '<div class="message ai">Chat cleared. 🧹 Ask me anything about your course!</div>';
    clearHistory();
    const chipsEl = document.getElementById('suggestionChips');
    if (chipsEl) chipsEl.style.display = 'none';
}

// ── EVENT LISTENERS ─────────────────────────────────────────────────
function initEventListeners() {
    document.getElementById('sendBtn')?.addEventListener('click', askAI);
    document.getElementById('clearBtn')?.addEventListener('click', clearChat);

    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') askAI(); });
    }

    // Auto-uppercase course input
    const courseEl = document.getElementById('courseInput');
    if (courseEl) {
        courseEl.addEventListener('input', () => {
            const pos = courseEl.selectionStart;
            courseEl.value = courseEl.value.toUpperCase();
            courseEl.setSelectionRange(pos, pos);
        });
    }
}
