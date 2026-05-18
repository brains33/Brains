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
    global: { headers: { 'x-student-token': sessionStorage.getItem('studentToken') || '' } }
});

let currentQuiz  = [];
let lastScore    = 0;
let lastPercent  = 0;

// ── AUTH GUARD ──────────────────────────────────────────────────────
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
        populateCourseDropdown();
        prefillCourse();
        initVoiceInput();
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
        const dl = document.getElementById('practiceCourselist');
        if (dl) dl.innerHTML = unique.map(c => `<option value="${c}">`).join('');
    } catch(e) { console.warn("Course dropdown:", e); }
}

function prefillCourse() {
    const student = JSON.parse(sessionStorage.getItem('student_data')) || {};
    const input   = document.getElementById('courseCode');
    if (!input) return;
    const lastCourse = sessionStorage.getItem('practice_last_course');
    if (lastCourse) input.value = lastCourse;
    else if (student.course) input.value = student.course.toUpperCase();
}

// ── VOICE INPUT FOR COURSE ──────────────────────────────────────────
function initVoiceInput() {
    const micBtn = document.getElementById('micCourseBtn');
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
        const t = event.results[0][0].transcript.replace(/\s/g, '').toUpperCase();
        document.getElementById('courseCode').value = t;
    };
    micBtn.addEventListener('click', () => { try { recognition.start(); } catch(e){} });
}

// ── GENERATE PRACTICE QUESTIONS ─────────────────────────────────────
async function generatePractice() {
    const code = document.getElementById('courseCode').value.toUpperCase().trim();
    const difficulty = document.getElementById('difficultyLevel')?.value || 'random';
    const btn = document.getElementById('startBtn');

    if (!code) { alert("Please enter a Course Code!"); return; }
    sessionStorage.setItem('practice_last_course', code);

    btn.disabled = true;
    btn.innerText = "Generating…";
    document.getElementById('setupArea').style.display = 'none';
    document.getElementById('loadingArea').style.display = 'block';

    let difficultyPrompt = "";
    if (difficulty === 'easy') {
        difficultyPrompt = "Generate 5 EASY multiple-choice questions testing basic recall. Keep questions straightforward.";
    } else if (difficulty === 'hard') {
        difficultyPrompt = "Generate 5 HARD multiple-choice questions requiring deep analysis and critical thinking. Include tricky distractors.";
    } else if (difficulty === 'mixed') {
        difficultyPrompt = "Generate 5 MIXED difficulty MCQs. Some easy recall, some analytical, some application-based.";
    } else {
        const modes = ['easy', 'hard', 'mixed'];
        const m = modes[Math.floor(Math.random() * modes.length)];
        difficultyPrompt = m === 'easy'
            ? "Generate 5 EASY MCQs testing basic recall."
            : m === 'hard'
            ? "Generate 5 HARD MCQs requiring critical thinking and tricky distractors."
            : "Generate 5 MIXED difficulty MCQs covering recall, application, and analysis.";
    }

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
        if (!Array.isArray(currentQuiz)) throw new Error("AI failed to format questions. Please try again.");

        document.getElementById('loadingArea').style.display = 'none';
        renderQuiz();

    } catch (err) {
        document.getElementById('loadingArea').style.display = 'none';
        document.getElementById('setupArea').style.display = 'block';
        alert("Error: " + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.innerText = "⚡ Generate Questions";
    }
}

// ── RENDER QUIZ ─────────────────────────────────────────────────────
function renderQuiz() {
    document.getElementById('quizArea').style.display = 'block';
    const container = document.getElementById('questionsContainer');
    container.innerHTML = currentQuiz.map((item, idx) => `
        <div class="q-card" id="qcard-${idx}">
            <p><strong>${idx + 1}. ${sanitise(item.q)}</strong></p>
            ${item.opts.map((opt, i) => `
                <label class="option-label" id="opt-${idx}-${i}">
                    <input type="radio" name="q${idx}" value="${i}" style="margin-right:8px;"> ${sanitise(opt)}
                </label>
            `).join('')}
        </div>
    `).join('');
}

// ── GRADE PRACTICE ──────────────────────────────────────────────────
function gradePractice() {
    let score = 0;
    currentQuiz.forEach((item, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        if (selected && parseInt(selected.value) === item.ans) score++;
    });

    lastScore   = score;
    lastPercent = Math.round((score / currentQuiz.length) * 100);

    document.getElementById('quizArea').style.display = 'none';
    document.getElementById('resultArea').style.display = 'block';
    document.getElementById('scoreDisplay').innerText = lastPercent + "%";

    // Animate score bar
    setTimeout(() => {
        const fill = document.getElementById('scoreFill');
        if (fill) {
            fill.style.width = lastPercent + '%';
            fill.style.background = lastPercent >= 50 ? '#00ff88' : '#ff4444';
        }
    }, 100);

    const remarks = [
        { min: 80, text: "🏆 Excellent! You've mastered this topic." },
        { min: 60, text: "👍 Good job! Review a few weak areas." },
        { min: 50, text: "✅ You passed! Keep practising to improve." },
        { min:  0, text: "📖 Review the material carefully and try again." }
    ];
    const remark = remarks.find(r => lastPercent >= r.min);
    document.getElementById('remarkDisplay').innerText =
        `${score}/${currentQuiz.length} correct — ${remark.text}`;
}

// ── REVIEW ANSWERS ──────────────────────────────────────────────────
function reviewAnswers() {
    document.getElementById('resultArea').style.display = 'none';
    document.getElementById('quizArea').style.display = 'block';

    // Reveal correct/wrong answers visually
    currentQuiz.forEach((item, idx) => {
        const selected = document.querySelector(`input[name="q${idx}"]:checked`);
        const selectedVal = selected ? parseInt(selected.value) : -1;

        item.opts.forEach((_, i) => {
            const label = document.getElementById(`opt-${idx}-${i}`);
            if (!label) return;
            // Disable all radios
            const radio = label.querySelector('input');
            if (radio) radio.disabled = true;

            if (i === item.ans) {
                label.classList.add('correct'); // always highlight correct
            } else if (i === selectedVal && selectedVal !== item.ans) {
                label.classList.add('wrong');   // what they chose if wrong
            }
        });
    });

    // Change submit button to "Back to Score"
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.textContent = '📊 Back to Score';
        submitBtn.removeEventListener('click', gradePractice);
        submitBtn.addEventListener('click', () => {
            document.getElementById('quizArea').style.display = 'none';
            document.getElementById('resultArea').style.display = 'block';
        });
    }
}

// ── EVENT LISTENERS ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('startBtn')?.addEventListener('click', generatePractice);
    document.getElementById('submitBtn')?.addEventListener('click', gradePractice);
    document.getElementById('reviewBtn')?.addEventListener('click', reviewAnswers);
    document.getElementById('tryAgainBtn')?.addEventListener('click', () => location.reload());
    document.getElementById('doneBtn')?.addEventListener('click', () => location.reload());

    // Auto-uppercase course input
    const ci = document.getElementById('courseCode');
    if (ci) {
        ci.addEventListener('input', () => {
            const pos = ci.selectionStart;
            ci.value = ci.value.toUpperCase();
            ci.setSelectionRange(pos, pos);
        });
    }
});
