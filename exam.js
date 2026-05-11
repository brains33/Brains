

 // ── EXAM PAGE (CSP‑compliant) ─────────────────────────────────────────

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

// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

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
            // ✅ FIX: strip any trailing L — must match questions table format
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
});

// ── INIT EXAM ──────────────────────────────────────────────────────
async function initExam() {
    console.log("BRAINS AI: Starting Exam Sequence...");
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const activeSub = sessionStorage.getItem('activeSubject');

    if (!student || !activeSub) {
        return alert("Session Error. Please log in again.");
    }

    // ── Determine effective level & semester ─────────────────────
    const examType = sessionStorage.getItem('examSessionType');  // 'carryover' or null
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
            // Fetch questions using the appropriate level/semester
            const { data, error } = await sb.from('questions')
                .select('*')
                .eq('course', activeSub)
                .eq('department', student.dept)
                .eq('level', queryLevel)
                // Include semester if your questions table has it; remove if not
                .eq('semester', querySemester);

            if (error || !data || data.length === 0) {
                return alert("No questions found for " + activeSub);
            }

            questions = data.sort(() => Math.random() - 0.5);
            localStorage.setItem('saved_questions_order', JSON.stringify(questions));
        }

        document.getElementById('startOverlay').style.display = 'none';
        document.getElementById('examBox').style.display = 'block';
        document.getElementById('subjectTitle').innerText = activeSub;

        examActive = true;
        renderQuestion();
        startCountdown();

        // ✅ FIX: Fast kick checker — runs every 5s separate from snapshot (20s)
        // Ensures EXIT button takes effect within 5 seconds not 20
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
            } catch(e) { /* silent — network hiccup */ }
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

            ${mediaHtml} <div class="options" style="display: flex; flex-direction: column; gap: 12px;">
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
}

function recordAnswer(idx, val) {
    answers[idx] = val;
    localStorage.setItem('saved_exam_progress', JSON.stringify(answers));
}

function changeQuestion(step) {
    currentIdx += step;
    renderQuestion();
}

// ── TIMER ──────────────────────────────────────────────────────────
async function startCountdown() {
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    if (!student) return;

    // First, try the end time passed from the dashboard (works for carryover & normal)
    const storedEndTime = sessionStorage.getItem('examSessionEndTime');
    let endTime = storedEndTime ? new Date(storedEndTime).getTime() : null;

    if (!endTime) {
        // Fallback: fetch from DB using student's current level/semester (only for normal exams)
        const { data, error } = await sb
            .from('exam_sessions')
            .select('end_time, is_active')
            .eq('department', student.dept)
            .eq('level', student.level)
            .eq('semester', student.semester)
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
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const activeSub = sessionStorage.getItem('activeSubject');
    const currentAnswers = JSON.parse(localStorage.getItem('saved_exam_progress') || "{}");

    if (!student || !activeSub) return alert("Session Error. Contact Invigilator.");

    const submitBtn = document.getElementById('finalSubmit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = "SUBMITTING..."; }

    // ── Determine effective level & semester ─────────────────
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
        level:          queryLevel,        // carryover uses original level
        semester:       querySemester,     // carryover uses original semester
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
            // Clear all exam and carryover session keys
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
            // Local fallback scoring (same logic as before but using queryLevel/querySemester)
            const { data: correctAnswers } = await sb
                .from('questions')
                .select('id, answer')
                .eq('course',      activeSub)
                .eq('department',  student.dept)
                .eq('level',       queryLevel)
                .eq('semester',    querySemester);

            const answerKey = {};
            (correctAnswers || []).forEach(q => {
                answerKey[q.id] = String(q.answer);
            });

            let correct = 0;
            const totalQuestions = questions.length;

            questions.forEach((q, idx) => {
                const studentAnswer = String(currentAnswers[idx] || '');
                const correctAnswer = answerKey[q.id];
                if (studentAnswer === correctAnswer) {
                    correct++;
                }
            });

            const localScore = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

            
            
const { error: upsertError } = await sb
    .from('results')
    .upsert({
        name:       student.name,
        matrix_no:  student.matrix,
        subject:    activeSub,
        course:     activeSub,
        score:      localScore,
        faculty:    student.faculty  || "",
        department: student.dept     || "",
        level:      queryLevel       || "",
        semester:   querySemester    || "",
        is_carryover: examType === 'carryover',
        status:     "Completed"
    }, { onConflict: 'matrix_no, subject' });

if (upsertError) throw upsertError;

            // Clear all exam and carryover session keys
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

window.addEventListener('load', () => {
    setupProctoring();
});

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
            video: {
                width: { ideal: 320 },
                height: { ideal: 240 },
                frameRate: { max: 15 }
            }
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

        if (currentStatus === 'KICKED') {
            alert("🚨 SESSION TERMINATED: The Proctor has ended your exam session.");
            ['saved_exam_progress', 'saved_questions_order'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
            window.location.href = "student_login.html";
            return;
        }
        if (currentStatus === 'FORCE_SUBMIT') {

    finishExam(true);   
    return;          
}

        if (currentStatus === 'CHEAT') {
            currentStatus = 'ACTIVE';
        }

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