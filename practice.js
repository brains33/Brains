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
// Client created fresh each time so token is always current
function getClient() {
    return supabase.createClient(S_URL, S_KEY, {
        global: { headers: { 'x-student-token': sessionStorage.getItem('studentToken') || '' } }
    });
}
const sb = getClient();

let currentQuiz = [];
let lastScore   = 0;
let lastPercent = 0;

// ── AUTH GUARD ──────────────────────────────────────────────────────
// Wire UI immediately via DOMContentLoaded — don't wait for auth
// Auth runs in parallel and only redirects if truly invalid
document.addEventListener('DOMContentLoaded', function () {
    // Wire all buttons immediately
    document.getElementById('startBtn')?.addEventListener('click', generatePractice);
    document.getElementById('submitBtn')?.addEventListener('click', gradePractice);
    document.getElementById('reviewBtn')?.addEventListener('click', reviewAnswers);
    document.getElementById('tryAgainBtn')?.addEventListener('click', () => location.reload());
    document.getElementById('doneBtn')?.addEventListener('click', () => location.reload());

    const ci = document.getElementById('courseCode');
    if (ci) {
        ci.addEventListener('input', () => {
            const pos = ci.selectionStart;
            ci.value = ci.value.toUpperCase();
            ci.setSelectionRange(pos, pos);
        });
    }

    // Run auth check in background — UI is already interactive
    verifyAuth();
});

async function verifyAuth() {
    const token = sessionStorage.getItem('studentToken');

    // Basic check first — no token at all → redirect
    if (sessionStorage.getItem('loginUser') !== 'true' || !token) {
        window.location.replace('student_login.html');
        return;
    }

    try {
        const { data, error } = await sb.rpc('verify_student_token', { submitted_token: token });
        if (error || !data || data.length === 0) {
            sessionStorage.clear();
            window.location.replace('student_login.html');
            return;
        }
        // Auth passed — populate helpers
        populateCourseDropdown();
        prefillCourse();
        initVoiceInput();
    } catch (e) {
        // Network error during verify — don't redirect, just warn
        // Student is already on the page; let them use it
        console.warn('Token verify failed (network):', e);
        populateCourseDropdown();
        prefillCourse();
        initVoiceInput();
    }
}

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
                prompt:       fullPrompt,
                courseCode:   code,
                mode:         "practice",
                studentToken: sessionStorage.getItem('studentToken') || ''
            }
        });

        if (error) throw error;
        if (!data) throw new Error("No response from AI. Please try again.");

        // Edge function now ALWAYS returns { answer: "...", mode: "practice" }
        // data.answer is the raw AI string — strip fences and parse
        let rawText = (data.answer || data.questions || data || '').toString();

        // Strip markdown fences the AI sometimes adds despite instructions
        rawText = rawText.replace(/```json\s*/gi, '').replace(/```/gi, '').trim();

        // Extract JSON array — grab everything between first [ and last ]
        const start = rawText.indexOf('[');
        const end   = rawText.lastIndexOf(']');
        if (start === -1 || end === -1) throw new Error("AI did not return a question list. Please try again.");
        rawText = rawText.slice(start, end + 1);

        let parsed;
        try { parsed = JSON.parse(rawText); }
        catch(e) { throw new Error("AI response could not be read. Please try again."); }

        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error("AI returned no questions. Please try again.");
        }

        // Normalise every possible field name the AI might use
        currentQuiz = parsed.map(item => {
            const q    = item.q || item.question || item.Question || item.text || '';
            const opts = item.opts || item.options || item.choices || item.Options || item.Choices || [];
            let   ans  = item.ans ?? item.answer ?? item.correct ?? item.correct_answer
                      ?? item.correctAnswer ?? item.correctIndex ?? 0;

            if (typeof ans === 'string') {
                const upper = ans.trim().toUpperCase();
                if (['A','B','C','D'].includes(upper)) {
                    ans = ['A','B','C','D'].indexOf(upper);
                } else {
                    const idx = opts.findIndex(o =>
                        o.toString().trim().toLowerCase() === ans.toLowerCase());
                    ans = idx >= 0 ? idx : 0;
                }
            } else if (typeof ans === 'number' && ans >= 1 && opts.length === 4) {
                ans = ans - 1; // convert 1-based to 0-based
            }

            return { q: String(q).trim(), opts: opts.map(String), ans: Math.max(0, Number(ans)) };
        }).filter(item => item.q.length > 0 && item.opts.length >= 2);

        if (currentQuiz.length === 0) {
            throw new Error("Questions could not be loaded. Please try again.");
        }

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

// end of practice.js
