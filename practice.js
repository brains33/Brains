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

let currentQuiz = [];

// ── AUTH GUARD — verifies token against Supabase, not just sessionStorage ──
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
        // Token is valid — page stays open
    } catch (e) {
        console.error("Token Verification Error:", e);
        sessionStorage.clear();
        window.location.replace("student_login.html");
    }
};

// ── GENERATE PRACTICE QUESTIONS ────────────────────────────────────
async function generatePractice() {
    const code = document.getElementById('courseCode').value.toUpperCase().trim();
    const difficultyEl = document.getElementById('difficultyLevel');
    const difficulty = difficultyEl ? difficultyEl.value : 'random';
    const btn = document.getElementById('startBtn');

    if (!code) return alert("Please enter a Course Code!");

    btn.disabled = true;
    btn.innerText = "Mu'ujiza AI reading handout...";

    // ── Build a dynamic prompt based on difficulty ────────
    let difficultyPrompt = "";
    if (difficulty === 'easy') {
        difficultyPrompt = "Generate 5 EASY multiple‑choice questions that test basic recall and simple understanding. Keep the questions straightforward and the answers obvious to anyone who has read the handout.";
    } else if (difficulty === 'hard') {
        difficultyPrompt = "Generate 5 HARD multiple‑choice questions that require deep analysis, application, or critical thinking. Include tricky distractors and scenario‑based questions. The answers should not be immediately obvious from glancing at the handout.";
    } else if (difficulty === 'mixed') {
        difficultyPrompt = "Generate 5 multiple‑choice questions with MIXED difficulty. Some should be easy (basic recall), some medium (application), and some hard (analysis). Make sure the set covers a range of cognitive levels.";
    } else { // 'random'
        const modes = ['easy', 'hard', 'mixed'];
        const randomMode = modes[Math.floor(Math.random() * modes.length)];
        if (randomMode === 'easy') {
            difficultyPrompt = "Generate 5 EASY multiple‑choice questions that test basic recall and simple understanding. Keep the questions straightforward.";
        } else if (randomMode === 'hard') {
            difficultyPrompt = "Generate 5 HARD multiple‑choice questions that require deep analysis, application, or critical thinking. Include tricky distractors.";
        } else {
            difficultyPrompt = "Generate 5 MIXED‑difficulty multiple‑choice questions. Some easy, some medium, some hard.";
        }
    }

    // Add a random seed so each generation is unique
    const randomSeed = Math.floor(Math.random() * 1000000);
    const fullPrompt = `${difficultyPrompt}\n\nCourse: ${code}\nFormat: Return ONLY a valid JSON array, no extra text.\nRandom seed: ${randomSeed}`;

    try {
        const { data, error } = await sb.functions.invoke("hyper-api", {
            body: {
                prompt: fullPrompt,
                courseCode: code,
                mode: "practice",
                studentToken: sessionStorage.getItem('studentToken') || ''
            }
        });

        if (error) throw error;

        currentQuiz = typeof data === 'string' ? JSON.parse(data) : data;

        if (!Array.isArray(currentQuiz)) {
            throw new Error("AI failed to format questions. Please try again.");
        }

        renderQuiz();

    } catch (err) {
        alert("Error: " + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = "Generate Questions";
    }
}
// ── RENDER QUIZ ────────────────────────────────────────────────────
function renderQuiz() {
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('quizArea').style.display = 'block';

    const container = document.getElementById('questionsContainer');
    container.innerHTML = currentQuiz.map((item, idx) => `
    <div class="q-card">
        <p><strong>${idx+1}. ${sanitise(item.q)}</strong></p>
        ${item.opts.map((opt, i) => `
            <label class="option-label">
                <input type="radio" name="q${idx}" value="${i}"> ${sanitise(opt)}
            </label>
        `).join('')}
    </div>
`).join('');
}

// ── GRADE PRACTICE ─────────────────────────────────────────────────
function gradePractice() {
    let score = 0;
    currentQuiz.forEach((item, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected && parseInt(selected.value) === item.ans) {
            score++;
        }
    });

    const percent = Math.round((score / currentQuiz.length) * 100);
    document.getElementById('quizArea').style.display = 'none';
    document.getElementById('resultArea').style.display = 'block';
    document.getElementById('scoreDisplay').innerText = percent + "%";
    document.getElementById('remarkDisplay').innerText = percent >= 50
        ? "Great job! Keep learning."
        : "Review the material and try again.";
}

// ── EVENT LISTENERS (CSP‑compliant) ────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startBtn')?.addEventListener('click', generatePractice);
    document.getElementById('submitBtn')?.addEventListener('click', gradePractice);
    document.getElementById('tryAgainBtn')?.addEventListener('click', function() {
        location.reload();
    });
    document.getElementById('doneBtn')?.addEventListener('click', function() {
        location.reload();
    });
});