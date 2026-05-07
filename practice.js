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
    const btn = document.getElementById('startBtn');

    if (!code) return alert("Please enter a Course Code!");

    btn.disabled = true;
    btn.innerText = "Mu'ujiza AI reading handout...";

    try {
        // ✅ Send the student token so hyper‑api knows this is a real student
        const { data, error } = await sb.functions.invoke("hyper-api", {
            body: {
                prompt: "Generate 5 MCQ questions from the handout.",
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