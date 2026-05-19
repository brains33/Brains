// ── EXAM PAGE (CSP‑compliant) ─────────────────────────────────────────


// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

(async function brainsSecurity() {
    const EXEMPT = ['maintenance', 'index'];
    if (EXEMPT.some(p => window.location.pathname.toLowerCase().includes(p))) return;
    try {
        const r = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check-system-status' })
            }
        );
        const d = await r.json();
        if (r.status === 503 || d.error === 'MAINTENANCE_MODE') {
            document.documentElement.innerHTML = '<html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0f0d;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Segoe UI,sans-serif;color:white}.box{text-align:center;max-width:480px;background:#0f1f15;border:1px solid rgba(255,68,68,.3);border-radius:20px;padding:50px 30px}.icon{font-size:4rem;margin-bottom:20px}h1{color:#ff4444;font-size:1.8rem;margin-bottom:12px}p{color:rgba(255,255,255,.6);line-height:1.7;font-size:.95rem}.badge{display:inline-block;margin-top:24px;padding:8px 20px;background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.4);border-radius:50px;color:#ff6b6b;font-size:.8rem;letter-spacing:2px;text-transform:uppercase;font-weight:700}.retry{margin-top:20px;display:inline-block;padding:12px 28px;background:none;border:1px solid rgba(255,255,255,.2);border-radius:10px;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer}</style></head><body><div class=box><div class=icon>&#128274;</div><h1>System Locked</h1><p>BRAINS AI is currently under administrative lockdown.<br>All access has been temporarily suspended.<br><br>Please contact the ICT department.</p><div class=badge>&#9888; Maintenance Mode Active</div><br><br><button class=retry onclick=location.reload()>&#8635; Check Again</button></div></body></html>';
        }
    } catch(e) { console.warn('BRAINS security check skipped:', e.message); }
}());

// ── AUTH GUARD (moved from inline script) ──────────────────────────
(async function() {
    const token = sessionStorage.getItem("studentToken");
    const activeSub = sessionStorage.getItem('activeSubject');

    if (sessionStorage.getItem("loginUser") !== "true" || !token || !activeSub) {
        sessionStorage.removeItem('activeSubject');
        localStorage.removeItem('saved_exam_progress');
        window.location.replace("index.html");
        return;
    }

    try {
        const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
        const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
        const _sb = supabase.createClient(S_URL, S_KEY, {
            global: { headers: { 'x-student-token': sessionStorage.getItem('studentToken') || '' } }
        });

        const { data, error } = await _sb.rpc('verify_student_token', {
            submitted_token: token
        });

        if (error || !data || data.length === 0) {
            ['saved_exam_progress', 'saved_questions_order'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
            window.location.replace("index.html");
            return;
        }

        // Overwrite sessionStorage with real DB data
        const real = data[0];
        const deviceId = localStorage.getItem('muujiza_device_token');
        sessionStorage.setItem('student_data', JSON.stringify({
            name:     real.name,
            matrix:   real.matrix_no,
            faculty:  real.faculty || "Not Specified",
            dept:     real.department.toUpperCase().trim(),
            level:    String(real.level || '').replace(/L+$/i, '').trim(),
            semester: real.semester,
            deviceId: deviceId
        }));
    } catch (e) {
        console.error("Exam Auth Error:", e);
        ['saved_exam_progress', 'saved_questions_order'].forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
        window.location.replace("index.html");
    }
})();

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

// ── GLOBAL STATE ────────────────────────────────────────────────────
let questions = [];
let currentIdx = 0;
let answers = {};
let examActive = false;

// ── EVENT LISTENERS ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Start exam button
    const startBtn = document.getElementById('startExamBtn');
    if (startBtn) startBtn.addEventListener('click', initExam);

    // Navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => changeQuestion(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeQuestion(1));

    // Submit button
    const submitBtn = document.getElementById('finalSubmit');
    if (submitBtn) submitBtn.addEventListener('click', () => finishExam(false));

    // Camera retry button
    const camRetry = document.getElementById('camRetry');
    if (camRetry) camRetry.addEventListener('click', setupProctoring);

    // Delegation for radio buttons inside question area (recordAnswer)
    const questionArea = document.getElementById('questionArea');
    if (questionArea) {
        questionArea.addEventListener('change', (e) => {
            const radio = e.target;
            if (radio && radio.name === 'choice' && radio.dataset.idx !== undefined) {
                recordAnswer(parseInt(radio.dataset.idx), parseInt(radio.value));
            }
        });
    }

// Calculator modal (scientific, CSP‑safe)
const calcBtn = document.getElementById('calcBtn');
const modal = document.getElementById('calculatorModal');
const closeCalc = document.getElementById('closeCalcBtn');
if (calcBtn && modal && closeCalc) {
    calcBtn.addEventListener('click', () => { modal.style.display = 'block'; });
    closeCalc.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    const calcDisplay   = document.getElementById('calcDisplay');
    const calcBtns      = document.querySelectorAll('.calc-btn');
    const degRadToggle  = document.getElementById('degRadToggle');
    let currentExpression = '';
    let isDegreeMode      = true;   // default DEG

    // DEG/RAD toggle
    if (degRadToggle) {
        degRadToggle.addEventListener('click', () => {
            isDegreeMode = !isDegreeMode;
            degRadToggle.textContent = isDegreeMode ? 'DEG' : 'RAD';
            degRadToggle.style.color = isDegreeMode ? '#00ff88' : '#ffc107';
            degRadToggle.style.borderColor = isDegreeMode ? '#00ff88' : '#ffc107';
        });
    }

    function updateDisplay() {
        calcDisplay.value = currentExpression || '0';
    }

    // ----- Safe expression evaluator (no eval) -----
    const precedence = {
        '+': 1, '-': 1,
        '*': 2, '/': 2, '%': 2,
        '^': 3,
        'sin': 4, 'cos': 4, 'tan': 4, 'log': 4, 'ln': 4, 'sqrt': 4
    };

    function isFunction(token) {
        return ['sin','cos','tan','log','ln','sqrt'].includes(token);
    }

    function toRad(deg) { return deg * (Math.PI / 180); }

    // Tokenize expression — handles PI, E, all functions
    function tokenize(expr) {
        const tokens = [];
        let i = 0;
        const len = expr.length;

        while (i < len) {
            const ch = expr[i];
            if (ch === ' ') { i++; continue; }

            // Numbers (including decimals)
            if ((ch >= '0' && ch <= '9') || ch === '.') {
                let num = '';
                while (i < len && ((expr[i] >= '0' && expr[i] <= '9') || expr[i] === '.')) {
                    num += expr[i++];
                }
                tokens.push({ type: 'number', value: parseFloat(num) });
                continue;
            }

            // Operators
            if ('+-*/^%()'.includes(ch)) {
                tokens.push({ type: ch === '(' || ch === ')' ? 'paren' : 'operator', value: ch });
                i++;
                continue;
            }

            // Named constants and functions — check longest match first
            const remaining = expr.slice(i).toUpperCase();

            if (remaining.startsWith('SQRT')) {
                tokens.push({ type: 'function', value: 'sqrt' });
                i += 4; continue;
            }
            if (remaining.startsWith('SIN')) {
                tokens.push({ type: 'function', value: 'sin' });
                i += 3; continue;
            }
            if (remaining.startsWith('COS')) {
                tokens.push({ type: 'function', value: 'cos' });
                i += 3; continue;
            }
            if (remaining.startsWith('TAN')) {
                tokens.push({ type: 'function', value: 'tan' });
                i += 3; continue;
            }
            if (remaining.startsWith('LOG')) {
                tokens.push({ type: 'function', value: 'log' });
                i += 3; continue;
            }
            if (remaining.startsWith('LN')) {
                tokens.push({ type: 'function', value: 'ln' });
                i += 2; continue;
            }
            // Constants — PI before P, E as standalone
            if (remaining.startsWith('PI')) {
                tokens.push({ type: 'number', value: Math.PI });
                i += 2; continue;
            }
            if (remaining.startsWith('E') && (i + 1 >= len || !'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(remaining[1]))) {
                tokens.push({ type: 'number', value: Math.E });
                i += 1; continue;
            }

            // Unknown — skip silently
            i++;
        }

        // Insert implicit multiplication: number ( or ) number or constant function etc.
        const result = [];
        for (let j = 0; j < tokens.length; j++) {
            const cur  = tokens[j];
            const prev = result[result.length - 1];
            if (prev) {
                const needsMul =
                    (prev.type === 'number'   && (cur.type === 'function' || cur.value === '(')) ||
                    (prev.value === ')'       && (cur.type === 'number' || cur.type === 'function' || cur.value === '(')) ||
                    (prev.type === 'number'   && cur.type === 'number');
                if (needsMul) result.push({ type: 'operator', value: '*' });
            }
            result.push(cur);
        }
        return result;
    }

    // Shunting-yard → RPN → evaluate
    function evaluateTokens(tokens) {
        const output = [];
        const ops    = [];

        for (const tok of tokens) {
            if (tok.type === 'number') {
                output.push(tok.value);
            } else if (tok.type === 'function') {
                ops.push(tok);
            } else if (tok.value === '(') {
                ops.push(tok);
            } else if (tok.value === ')') {
                while (ops.length && ops[ops.length-1].value !== '(') {
                    output.push(ops.pop());
                }
                ops.pop(); // remove '('
                if (ops.length && ops[ops.length-1].type === 'function') {
                    output.push(ops.pop());
                }
            } else if (tok.type === 'operator') {
                const o1 = tok;
                while (ops.length && ops[ops.length-1].value !== '(' &&
                       (precedence[ops[ops.length-1].value] || 0) >= (precedence[o1.value] || 0)) {
                    output.push(ops.pop());
                }
                ops.push(o1);
            }
        }
        while (ops.length) output.push(ops.pop());

        // Evaluate RPN stack
        const stack = [];
        for (const item of output) {
            if (typeof item === 'number') {
                stack.push(item);
            } else if (item.type === 'function') {
                const arg = stack.pop();
                let res;
                // Apply degree conversion for trig if in DEG mode
                switch (item.value) {
                    case 'sin':  res = Math.sin(isDegreeMode ? toRad(arg) : arg); break;
                    case 'cos':  res = Math.cos(isDegreeMode ? toRad(arg) : arg); break;
                    case 'tan':  res = Math.tan(isDegreeMode ? toRad(arg) : arg); break;
                    case 'log':  res = Math.log10(arg); break;
                    case 'ln':   res = Math.log(arg);   break;
                    case 'sqrt': res = Math.sqrt(arg);  break;
                    default: throw new Error('Unknown function: ' + item.value);
                }
                stack.push(res);
            } else {
                // binary operator
                const b = stack.pop();
                const a = stack.pop();
                let res;
                switch (item.value) {
                    case '+': res = a + b; break;
                    case '-': res = a - b; break;
                    case '*': res = a * b; break;
                    case '/':
                        if (b === 0) throw new Error('Division by zero');
                        res = a / b; break;
                    case '%': res = a % b; break;
                    case '^': res = Math.pow(a, b); break;
                    default: throw new Error('Unknown operator: ' + item.value);
                }
                stack.push(res);
            }
        }
        if (stack.length !== 1) throw new Error('Invalid expression');
        return stack[0];
    }

    function evaluateExpression() {
        let expr = currentExpression.trim();
        if (!expr) return;
        // Remove trailing operator (but not closing paren)
        expr = expr.replace(/[+\-*/^%]$/, '').trim();
        if (!expr) return;
        // Auto-close unclosed parentheses
        const open  = (expr.match(/\(/g) || []).length;
        const close = (expr.match(/\)/g) || []).length;
        expr += ')'.repeat(Math.max(0, open - close));
        try {
            const tokens = tokenize(expr);
            if (tokens.length === 0) return;
            const result = evaluateTokens(tokens);
            if (isNaN(result) || !isFinite(result)) throw new Error('Invalid result');
            // Round to 10 decimal places to avoid floating point noise
            const rounded = parseFloat(result.toPrecision(10));
            currentExpression = rounded.toString();
            updateDisplay();
        } catch (e) {
            console.error("Calc error:", e.message);
            currentExpression = 'Error';
            updateDisplay();
            setTimeout(() => {
                if (currentExpression === 'Error') { currentExpression = ''; updateDisplay(); }
            }, 1500);
        }
    }

    calcBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = btn.getAttribute('data-val');
            if (val === 'C') {
                currentExpression = '';
            } else if (val === 'CE') {
                // Smart backspace — remove last full token (e.g. "sin(" not just "(")
                const funcMatch = currentExpression.match(/^(.*?)(sin\(|cos\(|tan\(|log\(|ln\(|sqrt\(|PI|E)$/);
                if (funcMatch) {
                    currentExpression = funcMatch[1];
                } else {
                    currentExpression = currentExpression.slice(0, -1);
                }
            } else if (val === '=') {
                evaluateExpression();
                return;
            } else if (val === '^2') {
                // Append ^2 shortcut
                currentExpression += '^2';
            } else if (val === '%(') {
                // Percentage — append /100 wrapper
                currentExpression += '/100';
            } else {
                if (currentExpression === 'Error') currentExpression = '';
                currentExpression += val;
            }
            updateDisplay();
        });
    });
}
    // ── NEW: Build / update question palette
    function buildPalette() {
        const container = document.getElementById('questionPalette');
        if (!container) return;
        const total = questions.length;
        let html = '<h4>📋 Questions</h4><div class="palette-grid">';
        for (let i = 0; i < total; i++) {
            const answered    = answers.hasOwnProperty(i);
            const currentClass = (i === currentIdx) ? 'current' : '';
            html += `<button class="palette-btn ${answered ? 'answered' : ''} ${currentClass}" data-qidx="${i}">${i+1}</button>`;
        }
        html += '</div>';
        html += `<div class="palette-legend">
            <span><span class="legend-dot" style="background:#333; border:1px solid #555;"></span>Not answered</span>
            <span><span class="legend-dot" style="background:var(--primary);"></span>Answered</span>
            <span><span class="legend-dot" style="background:#333; border:2px solid #fff;"></span>Current</span>
        </div>`;
        container.innerHTML = html;

        // Add event listeners to each palette button
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-qidx'));
                if (!isNaN(idx)) {
                    currentIdx = idx;
                    renderQuestion();
                    updatePaletteActive();
                }
            });
        });
    }

    function updatePaletteActive() {
        document.querySelectorAll('.palette-btn').forEach(btn => {
            btn.classList.remove('current');
            const idx = parseInt(btn.getAttribute('data-qidx'));
            if (idx === currentIdx) btn.classList.add('current');
        });
    }

    function updatePaletteAnswered() {
        document.querySelectorAll('.palette-btn').forEach(btn => {
            const idx = parseInt(btn.getAttribute('data-qidx'));
            if (answers.hasOwnProperty(idx)) btn.classList.add('answered');
            else btn.classList.remove('answered');
        });
    }

    // ── INIT EXAM (modified to build palette) ──────────────────────────
    async function initExam() {
        console.log("BRAINS AI: Starting Exam Sequence...");
        const student = JSON.parse(sessionStorage.getItem('student_data'));
        const activeSub = sessionStorage.getItem('activeSubject');

        if (!student || !activeSub) {
            return alert("Session Error. Please log in again.");
        }

        const examType = sessionStorage.getItem('examSessionType');
        let queryLevel = student.level;
        let querySemester = student.semester;
        if (examType === 'carryover') {
            const origLevel = sessionStorage.getItem('carryoverOriginalLevel');
            const origSem = sessionStorage.getItem('carryoverOriginalSemester');
            if (origLevel) queryLevel = origLevel;
            if (origSem) querySemester = origSem;
        }

        try {
            const savedProgress = localStorage.getItem('saved_exam_progress');
            const savedQuestions = localStorage.getItem('saved_questions_order');

            if (savedProgress && savedQuestions) {
                answers = JSON.parse(savedProgress);
                questions = JSON.parse(savedQuestions);
                console.log("State restored.");
            } else {
                const { data, error } = await sb.from('questions')
                    .select('*')
                    .eq('course', activeSub)
                    .eq('department', student.dept)
                    .eq('level', queryLevel)
                    .eq('semester', querySemester);

                if (error || !data || data.length === 0) {
                    return alert("No questions found for " + activeSub);
                }

                questions = data.sort(() => Math.random() - 0.5);
                localStorage.setItem('saved_questions_order', JSON.stringify(questions));
            }

            document.getElementById('startOverlay').style.display = 'none';
            document.getElementById('examBox').style.display = 'flex';
            document.getElementById('subjectTitle').innerText = activeSub;

            const matrix = student.matrix_no || student.matrix;
            await sb.from('live_monitoring').upsert({
                matrix_no: matrix,
                name: student.name,
                current_subject: activeSub,
                status: 'ACTIVE',
                last_seen: new Date().toISOString()
            });

            examActive = true;
            // Build palette after questions are loaded
            buildPalette();
            renderQuestion();
            startCountdown();
            setupProctoring();

            const kickChecker = setInterval(async () => {
                if (!examActive) { clearInterval(kickChecker); return; }
                const student = JSON.parse(sessionStorage.getItem('student_data'));
                if (!student) return;
                const matrix = student.matrix_no || student.matrix;
                try {
                    const { data: rec } = await sb
                        .from('live_monitoring')
                        .select('status')
                        .eq('matrix_no', matrix)
                        .maybeSingle();
                    if (!rec) return;
                    if (rec.status === 'KICKED') {
                        clearInterval(kickChecker);
                        alert("🚨 SESSION TERMINATED: The Proctor has ended your exam session.");
                        ['saved_exam_progress','saved_questions_order'].forEach(k => localStorage.removeItem(k));
                        sessionStorage.clear();
                        window.location.href = "student_login.html";
                    }
                    if (rec.status === 'FORCE_SUBMIT') {
                        clearInterval(kickChecker);
                        finishExam(true);
                    }
                } catch(e) { /* silent */ }
            }, 5000);

        } catch (e) {
            console.error("Init Error:", e);
            alert("Failed to load exam. Check your connection.");
        }
    }

    // ── RENDER QUESTION ────────────────────────────────────────────────
    function renderQuestion() {
        const q = questions[currentIdx];
        const area = document.getElementById('questionArea');
        if (!q) return;

        let mediaHtml = "";
        if (q.image_url && q.image_url.trim() !== "") {
            const safeUrl = sanitise(q.image_url);
            const isVideo = q.image_url.toLowerCase().match(/\.(mp4|webm|ogg)$/);
            if (isVideo) {
                mediaHtml = `
                    <div style="width: 100%; text-align: center; margin-bottom: 20px;">
                        <video src="${safeUrl}" autoplay loop muted playsinline 
                            style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                        </video>
                    </div>`;
            } else {
                mediaHtml = `
                    <div style="width: 100%; text-align: center; margin-bottom: 20px;">
                        <img src="${safeUrl}" alt="Question Image" 
                            style="max-width: 100%; max-height: 300px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                    </div>`;
            }
        }

        area.innerHTML = `
            <div class="q-card" style="color: white; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <small style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 15px;">
                        Question ${currentIdx + 1} of ${questions.length}
                    </small>
                </div>
                
                <h3 style="margin-bottom: 25px; line-height: 1.4; font-size: 1.25rem;">${sanitise(q.questions)}</h3> 

                ${mediaHtml} 
                <div class="options" style="display: flex; flex-direction: column; gap: 12px;">
                    ${[1, 2, 3, 4].map(num => `
                        <label class="opt-label" style="
                            display: flex; 
                            align-items: center; 
                            padding: 15px; 
                            background: white; 
                            color: #333; 
                            border-radius: 10px; 
                            cursor: pointer;
                            border: 2px solid transparent;
                            transition: 0.2s all;
                        ">
                            <input type="radio" name="choice" value="${num}" 
                                style="margin-right: 15px; transform: scale(1.3);"
                                ${answers[currentIdx] == num ? 'checked' : ''} 
                                data-idx="${currentIdx}">
                            <span style="font-weight: 500;">${sanitise(q['Option ' + num])}</span> 
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        // UI Updates
        document.getElementById('qCount').innerText = `${currentIdx + 1}/${questions.length}`;
        document.getElementById('progressBar').style.width = `${((currentIdx + 1)/questions.length)*100}%`;

        document.getElementById('prevBtn').style.visibility = currentIdx === 0 ? 'hidden' : 'visible';
        document.getElementById('nextBtn').style.display = currentIdx === questions.length - 1 ? 'none' : 'block';
        document.getElementById('finalSubmit').style.display = currentIdx === questions.length - 1 ? 'block' : 'none';

        if (window.MathJax) {
            MathJax.typesetPromise().catch(err => console.log("MathJax error: ", err.message));
        }
        updatePaletteActive();
    }

    function recordAnswer(idx, val) {
        answers[idx] = val;
        localStorage.setItem('saved_exam_progress', JSON.stringify(answers));
        updatePaletteAnswered();
    }

    function changeQuestion(step) {
        currentIdx += step;
        renderQuestion();
    }

    // ── TIMER ──────────────────────────────────────────────────────────
    async function startCountdown() {
        const student = JSON.parse(sessionStorage.getItem('student_data'));
        if (!student) return;
        const storedEndTime = sessionStorage.getItem('examSessionEndTime');
        let endTime = storedEndTime ? new Date(storedEndTime).getTime() : null;
        if (!endTime) {
            const { data, error } = await sb
                .from('exam_sessions')
                .select('end_time, is_active')
                .eq('department', student.dept)
                .eq('level', student.level)
                .eq('semester', student.semester)
                .eq('is_carryover', false)
                .maybeSingle();
            if (error || !data?.end_time) {
                alert("Time configuration error. Contact Admin.");
                window.location.href = "dashboard.html";
                return;
            }
            endTime = new Date(data.end_time).getTime();
        }
        const timerDisplay = document.getElementById("timerDisplay");
        const timerTask = setInterval(() => {
            const now = new Date().getTime();
            const diff = endTime - now;
            if (diff <= 0) {
                clearInterval(timerTask);
                timerDisplay.innerText = "00:00";
                timerDisplay.style.color = "#ff4444";
                finishExam(true);
                return;
            }
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            timerDisplay.innerText = `${mins}:${secs < 10 ? '0' + secs : secs}`;
            if (mins < 5) timerDisplay.style.color = "orange";
        }, 1000);
    }

    // ── FINISH EXAM ────────────────────────────────────────────────────
    async function finishExam(isAuto = false) {
        if (!examActive) return;
        examActive = false;
        const student = JSON.parse(sessionStorage.getItem('student_data'));
        const activeSub = sessionStorage.getItem('activeSubject');
        const currentAnswers = JSON.parse(localStorage.getItem('saved_exam_progress') || "{}");
        if (!student || !activeSub) return alert("Session Error. Contact Invigilator.");
        const submitBtn = document.getElementById('finalSubmit');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "SUBMITTING..."; }
        const examType = sessionStorage.getItem('examSessionType') || 'normal';
        let queryLevel = student.level;
        let querySemester = student.semester;
        if (examType === 'carryover') {
            const origLevel = sessionStorage.getItem('carryoverOriginalLevel');
            const origSem = sessionStorage.getItem('carryoverOriginalSemester');
            if (origLevel) queryLevel = origLevel;
            if (origSem) querySemester = origSem;
        }
        const submissionPayload = {
            student_matrix: student.matrix,
            student_name:   student.name,
            subject:        activeSub,
            department:     student.dept,
            level:          queryLevel,
            semester:       querySemester,
            faculty:        student.faculty || "",
            raw_answers:    currentAnswers,
            questions_order: questions,
            is_carryover:   examType === 'carryover',
            status:         isAuto ? "Auto-Submitted" : "Completed"
        };
        try {
            const response = await fetch(
                'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/calculate_score',
                {
                    method:  'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'apikey':        S_KEY,
                        'Authorization': `Bearer ${S_KEY}`
                    },
                    body: JSON.stringify(submissionPayload)
                }
            );
            const result = await response.json();
            if (response.ok) {
                ['saved_exam_progress', 'saved_questions_order',
                 'examSessionType', 'carryoverOriginalLevel',
                 'carryoverOriginalSemester'].forEach(k => localStorage.removeItem(k));
                sessionStorage.removeItem('activeSubject');
                sessionStorage.removeItem('examSessionType');
                sessionStorage.removeItem('carryoverOriginalLevel');
                sessionStorage.removeItem('carryoverOriginalSemester');
                alert("✅ Exam Submitted Successfully!\nYour result has been recorded. Check with your admin for your score.");
                window.location.replace('dashboard.html');
                return;
            }
            throw new Error(result.error || 'Edge Function failed');
        } catch (err) {
            console.warn("Edge Function unavailable, using local fallback:", err.message);
            try {
                const { data: correctAnswers } = await sb
                    .from('questions')
                    .select('id, answer')
                    .eq('course',      activeSub)
                    .eq('department',  student.dept)
                    .eq('level',       queryLevel)
                    .eq('semester',    querySemester);
                const answerKey = {};
                (correctAnswers || []).forEach(q => { answerKey[q.id] = String(q.answer); });
                let correct = 0;
                questions.forEach((q, idx) => {
                    const studentAnswer = String(currentAnswers[idx] || '');
                    const correctAnswer = answerKey[q.id];
                    if (studentAnswer === correctAnswer) correct++;
                });
                const localScore = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
                const { error: upsertError } = await sb
                    .from('results')
                    .upsert({
                        name: student.name,
                        matrix_no: student.matrix,
                        subject: activeSub,
                        course: activeSub,
                        score: localScore,
                        faculty: student.faculty || "",
                        department: student.dept || "",
                        level: queryLevel || "",
                        semester: querySemester || "",
                        is_carryover: examType === 'carryover',
                        status: "Completed"
                    }, { onConflict: 'matrix_no, subject' });
                if (upsertError) throw upsertError;
                ['saved_exam_progress', 'saved_questions_order',
                 'examSessionType', 'carryoverOriginalLevel',
                 'carryoverOriginalSemester'].forEach(k => localStorage.removeItem(k));
                sessionStorage.removeItem('activeSubject');
                sessionStorage.removeItem('examSessionType');
                sessionStorage.removeItem('carryoverOriginalLevel');
                sessionStorage.removeItem('carryoverOriginalSemester');
                alert("✅ Exam Submitted Successfully!\nYour result has been recorded. Check with your admin for your score.");
                window.location.replace('dashboard.html');
            } catch (fallbackErr) {
                console.error("Full fallback failed:", fallbackErr);
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = "SUBMIT FINISH"; }
                alert("❌ Submission failed. Screenshot your answers and contact the invigilator.\nError: " + fallbackErr.message);
            }
        }
    }

    // ── PROCTORING ─────────────────────────────────────────────────────
    let proctorInterval;
    document.addEventListener('visibilitychange', async () => {
        if (document.hidden) {
            console.warn("⚠️ Alert: Student navigated away!");
            const student = JSON.parse(sessionStorage.getItem('student_data'));
            if (!student) return;
            await sb.from('live_monitoring').upsert({
                matrix_no: student.matrix_no || student.matrix,
                name: student.name,
                current_subject: sessionStorage.getItem('activeSubject') || 'Exam',
                status: 'CHEAT',
                last_seen: new Date().toISOString()
            });
        }
    });
    async function setupProctoring() {
        const video = document.getElementById('proctorVideo');
        const retryBtn = document.getElementById('camRetry');
        if (!video) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { max: 15 } }
            });
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.muted = true;
                video.play().then(() => {
                    console.log("✅ Camera Active & Streaming");
                    if (retryBtn) retryBtn.style.display = "none";
                    if (proctorInterval) clearInterval(proctorInterval);
                    proctorInterval = setInterval(sendProctorSnapshot, 20000);
                }).catch(err => {
                    console.error("❌ Autoplay blocked:", err);
                    if (retryBtn) retryBtn.style.display = "block";
                });
            };
        } catch (err) {
            console.error("❌ Camera access denied:", err);
            alert("Camera access is mandatory for this exam.");
        }
    }
    async function sendProctorSnapshot() {
        if (!examActive) return;
        const video = document.getElementById('proctorVideo');
        const canvas = document.getElementById('proctorCanvas');
        if (!video || !canvas) return;
        const context = canvas.getContext('2d');
        if (video.paused || video.readyState < 2) return;
        const student = JSON.parse(sessionStorage.getItem('student_data'));
        if (!student) return;
        const matrix = student.matrix_no || student.matrix;
        try {
            const { data: currentRecord } = await sb
                .from('live_monitoring')
                .select('status')
                .eq('matrix_no', matrix)
                .single();
            let currentStatus = currentRecord ? currentRecord.status : 'ACTIVE';
            if (currentStatus === 'KICKED' || currentStatus === 'FORCE_SUBMIT') return;
            if (currentStatus === 'CHEAT') currentStatus = 'ACTIVE';
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageBase64 = canvas.toDataURL('image/jpeg', 0.3);
            await sb.from('live_monitoring').upsert({
                matrix_no: matrix,
                name: student.name,
                current_subject: sessionStorage.getItem('activeSubject') || 'Exam',
                last_snapshot: imageBase64,
                last_seen: new Date().toISOString(),
                status: currentStatus
            });
        } catch (err) {
            console.error("Proctoring Sync Error:", err.message);
        }
    }

}); // ✅ Close the DOMContentLoaded event listener