// ── BRAINS AI GLOBAL SECURITY CHECK ─────────────────────────────────
(function () {
    const EXEMPT = ['maintenance', 'index'];
    const AUTH_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy';

    function showLockdown() {
        document.open();
        document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>System Locked | BRAINS AI</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0f0d;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Segoe UI,sans-serif;color:white;padding:20px}.box{text-align:center;max-width:460px;width:100%;background:#0f1f15;border:1px solid rgba(255,68,68,.35);border-radius:20px;padding:50px 28px}.icon{font-size:3.5rem;margin-bottom:16px}h1{color:#ff4444;font-size:1.7rem;margin-bottom:12px}p{color:rgba(255,255,255,.6);line-height:1.75;font-size:.92rem}.badge{display:inline-block;margin-top:22px;padding:7px 18px;background:rgba(255,68,68,.1);border:1px solid rgba(255,68,68,.4);border-radius:50px;color:#ff6b6b;font-size:.75rem;letter-spacing:2px;text-transform:uppercase;font-weight:700}.retry{margin-top:22px;display:inline-block;padding:11px 26px;background:none;border:1px solid rgba(255,255,255,.2);border-radius:10px;color:rgba(255,255,255,.45);font-size:.82rem;cursor:pointer;transition:.2s}.retry:hover{border-color:rgba(255,255,255,.5);color:#fff}</style></head><body><div class=box><div class=icon>&#128274;</div><h1>System Locked</h1><p>BRAINS AI is currently under administrative lockdown.<br>All student and bursary access has been suspended.<br><br>Please contact the ICT department for assistance.</p><div class=badge>&#9888;&nbsp; Maintenance Mode Active</div><br><br><button class=retry onclick="location.reload()">&#8635;&nbsp; Check Again</button></div></body></html>');
        document.close();
    }

    async function checkStatus() {
        const path = window.location.pathname.toLowerCase();
        if (EXEMPT.some(p => path.includes(p))) return;
        try {
            const resp = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check-system-status' })
            });
            if (resp.status === 503) {
                showLockdown();
                return;
            }
            const data = await resp.json();
            if (data.error === 'MAINTENANCE_MODE') {
                showLockdown();
            }
        } catch (e) {
            console.warn('BRAINS: security check skipped -', e.message);
        }
    }
    checkStatus();
    setInterval(checkStatus, 30000);
}());

// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ── SUPABASE CLIENT (direct – working) ──────────────────────────────
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: {
        headers: {
            'x-student-token': sessionStorage.getItem('studentToken') || ''
        }
    }
});

let localData = null;
let allMaterials = [];
let studentApi = null;
let proctorInterval;

// ── AUTH GUARD ──────────────────────────────────────────────────────
(function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
    }
})();

// ── ON LOAD (ORIGINAL WORKING VERSION) ─────────────────────────────
window.onload = async function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
        return;
    }

    try {
        const { data, error } = await sb.rpc('verify_student_token', { submitted_token: token });
        if (error || !data || data.length === 0) {
            ['saved_exam_progress','saved_questions_order'].forEach(k => localStorage.removeItem(k));
            sessionStorage.clear();
            window.location.replace("student_login.html");
            return;
        }

        const real = data[0];
        const deviceId = localStorage.getItem('muujiza_device_token');
        const studentPackage = {
            name: real.name,
            matrix: real.matrix_no,
            faculty: real.faculty || "Not Specified",
            dept:    real.department.toUpperCase().trim(),
            level:   String(real.level || '').replace(/L+$/i, '').trim(),
            semester: real.semester,
            deviceId: deviceId
        };
        sessionStorage.setItem('student_data', JSON.stringify(studentPackage));
        localData = studentPackage;

        // Display student details
        document.getElementById('welcomeText').innerText = `Welcome, ${localData.name.split(' ')[0]}!`;
        document.getElementById('dspName').innerText    = localData.name;
        document.getElementById('dspMatrix').innerText  = localData.matrix;
        document.getElementById('sideMatrix').innerText = localData.matrix;
        document.getElementById('dspFaculty').innerText = localData.faculty || "N/A";
        document.getElementById('dspDept').innerText    = localData.dept    || "N/A";

        const displayLevel = localData.level + 'L';
        document.getElementById('dspLevelSem').innerText = `${displayLevel} | ${localData.semester}`;

        // Start all original functions
        fetchExams();
        fetchCarryoverExams();
        fetchCaExams();
        syncGatekeeper();
        checkResultsReleased();
        checkExamCardReleased();
        checkScheduledExamCardReleased();
        setInterval(syncGatekeeper, 5000);
        setInterval(checkSession, 15000);
        setInterval(checkResultsReleased, 30000);
        setInterval(checkExamCardReleased, 30000);
        setInterval(checkScheduledExamCardReleased, 30000);
        setInterval(fetchCaExams, 30000);
        syncClassroom();
        setInterval(syncClassroom, 60000);
        checkForLiveClass();
        setInterval(checkForLiveClass, 30000);

        bindDashboardEvents();
        loadMyAssignments();
        setInterval(loadMyAssignments, 60000);
    } catch (e) {
        console.error("Token Verification Error:", e);
        sessionStorage.clear();
        window.location.replace("student_login.html");
    }
};

// ── EVENT BINDING (ORIGINAL) ───────────────────────────────────────
function bindDashboardEvents() {
    document.getElementById('navCourseReg')?.addEventListener('click', () => {
        // Hide main dashboard content, show registration panel
        document.querySelector('.main-content').style.display = 'none';
        document.getElementById('sec-courseReg').style.display = 'block';
        loadCourseRegistration();
    });

    // Clicking Dashboard nav item restores main content
    document.querySelector('.nav-item.active')?.addEventListener('click', () => {
        document.querySelector('.main-content').style.display = '';
        document.getElementById('sec-courseReg').style.display = 'none';
    });

    document.getElementById('downloadResultsNav')?.addEventListener('click', downloadResultsPDF);
    document.getElementById('downloadExamCardNav')?.addEventListener('click', downloadExamCardPDF);
    document.getElementById('navAiLink')?.addEventListener('click', () => window.location.href = 'AI11.html');
    document.getElementById('navLogout')?.addEventListener('click', logout);
    document.getElementById('navPracticeLink')?.addEventListener('click', () => window.location.href = 'practice.html');
    document.getElementById('navAssignments')?.addEventListener('click', () => {
        document.querySelector('.card:nth-child(5)')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('downloadScheduledExamCardNav')?.addEventListener('click', downloadScheduledExamCardPDF);
    document.getElementById('startExamBtn')?.addEventListener('click', verifyAndStart);

    const tokenEl = document.getElementById('examToken');
    if (tokenEl) {
        tokenEl.addEventListener('input', () => {
            const pos = tokenEl.selectionStart;
            tokenEl.value = tokenEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            tokenEl.setSelectionRange(pos, pos);
        });
    }

    document.getElementById('courseSearch')?.addEventListener('keyup', filterMaterials);
    document.getElementById('joinClassBtn')?.addEventListener('click', joinClass);
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        document.getElementById('noteModal').style.display = 'none';
    });

    const resourceList = document.getElementById('resourceList');
    if (resourceList) {
        resourceList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const action = btn.getAttribute('data-action');
            if (action === 'open-file') {
                const url = btn.getAttribute('data-url');
                if (url) window.open(url, '_blank');
            } else if (action === 'show-note') {
                const title = btn.getAttribute('data-title');
                const note = btn.getAttribute('data-note');
                document.getElementById('modalTitle').innerText = title;
                document.getElementById('modalBody').innerText = decodeURIComponent(note);
                document.getElementById('noteModal').style.display = 'block';
            }
        });
    }

    const subjectList = document.getElementById('subjectList');
    if (subjectList) {
        subjectList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || btn.disabled) return;
            const course = btn.getAttribute('data-course');
            if (course) selectExam(course);
        });
    }

    document.getElementById('submitAssignmentBtn')?.addEventListener('click', submitAssignment);
    const myAssignmentsList = document.getElementById('myAssignmentsList');
    if (myAssignmentsList) {
        myAssignmentsList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.classList.contains('delete-assign-btn')) {
                const id = btn.getAttribute('data-id');
                if (id) deleteStudentAssignment(id);
            }
        });
    }
}

// ── CORE FUNCTIONS (ORIGINAL, USING sb) ────────────────────────────

async function fetchExams() {
    const listDiv = document.getElementById("subjectList");
    if (!localData) return;

    try {
        // ── 1. Get student's registered courses for this semester ──────────
        const { data: regData } = await sb
            .from('course_registrations')
            .select('course_code')
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        const registeredCourses = (regData || []).map(r => r.course_code.toUpperCase().trim());

        if (registeredCourses.length === 0) {
            listDiv.innerHTML = `<div style="background:#fff3cd; border-left:5px solid #ffc107;
                padding:18px; border-radius:10px; color:#856404;">
                ⚠️ <strong>You have not registered any courses yet.</strong><br>
                Go to <em>Course Registration</em> in the sidebar to select your courses for this semester.
            </div>`;
            return;
        }

        const { data: onlineResults } = await sb.from('results')
            .select('subject, course')
            .eq('matrix_no', localData.matrix);
        const offlineResults = JSON.parse(localStorage.getItem('offline_scores') || "[]");

        const finishedSubjects = [
            ...(onlineResults ? onlineResults.map(r => (r.subject || r.course || "").toUpperCase().trim()) : []),
            ...offlineResults.map(r => (r.subject || r.course || "").toUpperCase().trim())
        ];

        const { data: exams, error } = await sb.from('questions')
            .select('course')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        if (error) throw error;

        // Only show questions for registered courses
        const allCourses = exams ? [...new Set(exams.map(e => e.course.toUpperCase().trim()))] : [];
        const uniqueCourses = allCourses.filter(c => registeredCourses.includes(c));

        if (uniqueCourses.length === 0) {
            listDiv.innerHTML = "<p style='color:gray;'>No exam questions available yet for your registered courses.</p>";
            return;
        }

        const { data: sessions } = await sb.from('exam_sessions')
            .select('course, token_code, is_active, end_time')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .eq('is_carryover', false)
            .eq('is_ca', false);

        const now = Date.now();
        const sessionMap = {};
        (sessions || []).forEach(s => {
            const c = (s.course || '').toUpperCase().trim();
            if (c) sessionMap[c] = s;
        });

        listDiv.innerHTML = uniqueCourses.map(course => {
            const isTaken = finishedSubjects.includes(course);
            const safeCourse = sanitise(course);
            const session = sessionMap[course];
            const isOpen = session && session.is_active === "true" && now < new Date(session.end_time).getTime();
            const token = session ? session.token_code : null;

            let tokenBadge = '';
            if (isTaken) tokenBadge = '';
            else if (isOpen && token) tokenBadge = `<span style="background:#00ff88;color:#0f5132;font-family:monospace;font-weight:bold;padding:2px 10px;border-radius:12px;font-size:0.85rem;margin-left:8px;">🔓 ${sanitise(token)}</span>`;
            else if (session && !isOpen) tokenBadge = `<span style="background:#ff4444;color:white;font-size:0.75rem;padding:2px 8px;border-radius:12px;margin-left:8px;">GATE CLOSED</span>`;

            const btnHtml = isTaken
                ? `<button disabled style="background:#eeeeee; color:#aaaaaa; border:none; padding:8px 15px; border-radius:5px; font-weight:bold;">BIT-TAWFEEQ</button>`
                : `<button data-course="${safeCourse}" style="background:#0f5132; color:#00ff88; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">SELECT</button>`;

            return `
                <div class="exam-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left: 5px solid ${isTaken ? '#ff4444' : (isOpen ? '#00ff88' : '#cccccc')}">
                    <div>
                        <b style="color: ${isTaken ? '#999' : '#333'}">${safeCourse} ${isTaken ? '(SUBMITTED)' : ''}</b>
                        ${tokenBadge}
                    </div>
                    ${btnHtml}
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error("fetchExams Error:", err);
        listDiv.innerHTML = "Error loading subjects.";
    }
}

function selectExam(course) {
    localStorage.removeItem('exam_questions');
    localStorage.removeItem('student_answers');
    localStorage.removeItem('current_index');
    sessionStorage.setItem('activeSubject', course.toUpperCase().trim());
    sessionStorage.removeItem('examSessionType');

    const examItems = document.querySelectorAll('#subjectList .exam-item');
    let autoToken = null;
    examItems.forEach(item => {
        const b = item.querySelector('b');
        if (b && b.textContent.trim().startsWith(course)) {
            const badge = item.querySelector('span[style*="monospace"]');
            if (badge) {
                const match = badge.textContent.replace('🔓', '').trim();
                if (match && match.length === 6) autoToken = match;
            }
        }
    });

    const tokenInput = document.getElementById('examToken');
    if (autoToken) {
        tokenInput.value = autoToken;
        document.getElementById('selectedCourseText').textContent = `✅ ${course} selected — token pre-filled. Click START EXAMINATION.`;
    } else {
        tokenInput.value = '';
        document.getElementById('selectedCourseText').textContent = `✅ ${course} selected — enter your token below.`;
    }
    tokenInput.focus();
}

async function verifyAndStart() {
    const activeSub = sessionStorage.getItem('activeSubject');
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const tokenInput = document.getElementById('examToken').value.trim().toUpperCase();

    if (!activeSub || activeSub === "null") return alert("❌ Please select a course first.");

    const attemptKey   = 'token_attempts_' + activeSub;
    const lockKey      = 'token_lockout_' + activeSub;
    const lockoutUntil = parseInt(sessionStorage.getItem(lockKey) || '0');
    if (Date.now() < lockoutUntil) {
        const mins = Math.ceil((lockoutUntil - Date.now()) / 60000);
        return alert(`⛔ Too many incorrect token attempts. Wait ${mins} minute(s) or contact your invigilator.`);
    }
    const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0');

    try {
        const { data: existingResult, error: resultErr } = await sb
            .from('results')
            .select('id, score')
            .eq('matrix_no', student.matrix)
            .or(`subject.eq.${activeSub},course.eq.${activeSub}`)
            .maybeSingle();

        if (resultErr) throw resultErr;
        if (existingResult && parseFloat(existingResult.score) >= 50) {
            return alert(`⛔ ACCESS DENIED: ${student.name.split(' ')[0]}, you have already passed ${activeSub} with ${existingResult.score}%.`);
        }

        let { data: session, error } = await sb.from('exam_sessions')
            .select('*')
            .eq('token_code', tokenInput)
            .eq('department', student.dept)
            .eq('level', student.level)
            .eq('semester', student.semester)
            .eq('course', activeSub)
            .eq('is_carryover', false)
            .eq('is_ca', false)
            .maybeSingle();

        if (!session && (!error || error.code === 'PGRST116')) {
            const { data: carrySession } = await sb.from('exam_sessions')
                .select('*')
                .eq('token_code', tokenInput)
                .eq('department', student.dept)
                .eq('carryover_course', activeSub)
                .eq('is_carryover', true)
                .maybeSingle();
            if (carrySession) session = carrySession;
        }

        // CA fallback
        if (!session) {
            const { data: caSession } = await sb.from('exam_sessions')
                .select('*')
                .eq('token_code', tokenInput)
                .eq('department', student.dept)
                .eq('course', activeSub)
                .eq('is_ca', true)
                .maybeSingle();
            if (caSession) {
                session = caSession;
                sessionStorage.setItem('examSessionType', 'ca');
            }
        }

        if (error && !session) {
            sessionStorage.setItem(attemptKey, attempts + 1);
            if (attempts + 1 >= 3) sessionStorage.setItem(lockKey, Date.now() + 10 * 60 * 1000);
            return alert("❌ Invalid Token. This token does not match your course, department, level or semester.");
        }
        if (!session) {
            sessionStorage.setItem(attemptKey, attempts + 1);
            if (attempts + 1 >= 3) sessionStorage.setItem(lockKey, Date.now() + 10 * 60 * 1000);
            return alert("❌ Invalid Token. No matching exam session found.");
        }

        const now = new Date().getTime();
        const endTime = new Date(session.end_time).getTime();
        if (session.is_active !== "true") return alert("⛔ The Gate is CLOSED by the Admin.");
        if (now > endTime) return alert("⏰ Time Expired. Entry locked.");

        sessionStorage.removeItem(attemptKey);
        sessionStorage.removeItem(lockKey);
        sessionStorage.setItem('examSessionEndTime', session.end_time);
        window.location.replace("exam.html");
    } catch (err) {
        console.error(err);
        alert("Security sync failed. Try again.");
    }
}

async function syncGatekeeper() {
    if (!localData) return;
    try {
        const { data, error } = await sb.from('exam_sessions')
            .select('token_code, is_active, end_time, course')
            .eq('department', localData.dept)
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .eq('is_carryover', false)
            .eq('is_ca', false);

        const gateBadge    = document.getElementById('gateBadge');
        const displayToken = document.getElementById('displayToken');
        const tokenInstr   = document.getElementById('tokenInstruction');

        if (error || !data || data.length === 0) {
            gateBadge.innerText = "NO SESSION"; gateBadge.style.background = "#555"; gateBadge.style.color = "white";
            displayToken.innerText = "----";
            if (tokenInstr) tokenInstr.innerText = "Wait for the admin to open the gate.";
            return;
        }

        const now = Date.now();
        const openSessions = data.filter(s => s.is_active === "true" && now < new Date(s.end_time).getTime());

        if (openSessions.length > 0) {
            const first = openSessions[0];
            gateBadge.innerText = `GATE OPEN (${openSessions.length} course${openSessions.length > 1 ? 's' : ''})`;
            gateBadge.style.background = "#00ff88"; gateBadge.style.color = "#0f5132";
            displayToken.innerText = openSessions.length === 1 ? first.token_code : "▼ See list";
            displayToken.style.fontSize = openSessions.length === 1 ? "3em" : "1.5em";
            if (tokenInstr) tokenInstr.innerText = openSessions.length === 1
                ? `Token for ${sanitise(first.course)} — select it above then click START.`
                : "Multiple courses are open — select your course above to see its token.";
            fetchExams();
        } else {
            gateBadge.innerText = "GATE CLOSED"; gateBadge.style.background = "#ff4444"; gateBadge.style.color = "white";
            displayToken.innerText = "----"; displayToken.style.fontSize = "3em";
            if (tokenInstr) tokenInstr.innerText = "Wait for the admin to open the gate.";
        }
    } catch (e) { /* silent */ }
}

async function checkSession() {
    if (!localData) return;
    const { data } = await sb.from('students').select('current_device_id').eq('matrix_no', localData.matrix).single();
    if (data && data.current_device_id !== localData.deviceId) { alert("Session active on another device."); logout(); }
}

async function fetchCarryoverExams() {
    const listDiv = document.getElementById('carryoverSubjectList');
    if (!listDiv || !localData) return;

    try {
        const { data: sessions, error } = await sb
            .from('exam_sessions')
            .select('*')
            .eq('is_carryover', true)
            .eq('is_active', 'true')
            .eq('department', localData.dept)
            .eq('original_level', localData.level)
            .eq('original_semester', localData.semester)
            .order('carryover_course', { ascending: true });

        if (error) throw error;
        if (!sessions || sessions.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available right now.</p>';
            return;
        }

        const { data: results, error: resErr } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);
        if (resErr) throw resErr;

        const passedCourses = new Set();
        (results || []).forEach(r => {
            const score = parseFloat(r.score);
            const course = (r.subject || '').toUpperCase().trim();
            if (!isNaN(score) && score >= 50) passedCourses.add(course);
        });

        const eligible = sessions.filter(s => {
            const courseCode = (s.carryover_course || '').toUpperCase().trim();
            return !passedCourses.has(courseCode);
        });

        if (eligible.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available for you.</p>';
            return;
        }

        // ── Only show carryover courses that still have questions in the bank ──
        // Each carryover course belongs to its original level+semester, so we
        // check per-session using original_level and original_semester.
        const coChecks = await Promise.all(eligible.map(async s => {
            const course   = (s.carryover_course || '').toUpperCase().trim();
            const origLvl  = s.original_level  || localData.level;
            const origSem  = s.original_semester || localData.semester;
            const { data } = await sb.from('questions').select('course', { count: 'exact', head: true })
                .eq('department', localData.dept.toUpperCase().trim())
                .eq('level',    origLvl)
                .eq('semester', origSem)
                .eq('course',   course);
            // data will be null for a head query; use count from response — but
            // head:true returns count in the response object. Check via non-head:
            const { data: qRows } = await sb.from('questions').select('id')
                .eq('department', localData.dept.toUpperCase().trim())
                .eq('level',    origLvl)
                .eq('semester', origSem)
                .ilike('course', course)
                .limit(1);
            return { s, hasQuestions: !!(qRows && qRows.length > 0) };
        }));
        const eligibleWithQ = coChecks.filter(r => r.hasQuestions).map(r => r.s);

        if (eligibleWithQ.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available right now.</p>';
            return;
        }

        listDiv.innerHTML = eligibleWithQ.map(s => {
            const safeCourse = sanitise(s.carryover_course);
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left:5px solid #ff9800;">
                    <div>
                        <b style="color:#333;">${safeCourse}</b>
                        <small style="color:#666; display:block;">Original: ${sanitise(s.original_level)}L | ${sanitise(s.original_semester)} Semester</small>
                    </div>
                    <button data-course="${safeCourse}" 
                            data-token="${sanitise(s.token_code)}"
                            data-orig-level="${sanitise(s.original_level)}"
                            data-orig-sem="${sanitise(s.original_semester)}"
                            class="select-carryover-btn"
                            style="background:#ff9800; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">
                        SELECT
                    </button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.select-carryover-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const course  = btn.getAttribute('data-course');
                const token   = btn.getAttribute('data-token');
                const origLvl = btn.getAttribute('data-orig-level');
                const origSem = btn.getAttribute('data-orig-sem');
                sessionStorage.setItem('activeSubject', course);
                sessionStorage.setItem('examSessionType', 'carryover');
                sessionStorage.setItem('carryoverOriginalLevel', origLvl);
                sessionStorage.setItem('carryoverOriginalSemester', origSem);
                const tokenInput = document.getElementById('examToken');
                if (tokenInput) tokenInput.value = token;
                alert(`Carryover selected: ${course}. The token is ready – click "Start Exam" to begin.`);
                tokenInput?.focus();
            });
        });
    } catch (err) {
        console.error("Carryover fetch error:", err);
        listDiv.innerHTML = '<p style="color:red;">Error loading carryover exams.</p>';
    }
}

async function fetchCaExams() {
    const listDiv = document.getElementById('caSubjectList');
    if (!listDiv || !localData) return;

    try {
        // ── Get registered courses first ───────────────────────────────────
        const { data: regData } = await sb
            .from('course_registrations')
            .select('course_code')
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        const registeredCourses = (regData || []).map(r => r.course_code.toUpperCase().trim());

        if (registeredCourses.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">Complete course registration first to see CA exams.</p>';
            return;
        }

        const { data: sessions, error } = await sb
            .from('exam_sessions')
            .select('*')
            .eq('is_ca', true)
            .eq('is_active', 'true')
            .eq('department', localData.dept)
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .order('course', { ascending: true });

        if (error) throw error;
        if (!sessions || sessions.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No CA exams available right now.</p>';
            return;
        }

        // Filter out courses already passed
        const { data: results } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);

        const passedCourses = new Set();
        (results || []).forEach(r => {
            if (!isNaN(parseFloat(r.score)) && parseFloat(r.score) >= 50)
                passedCourses.add((r.subject || '').toUpperCase().trim());
        });

        const eligible = sessions.filter(s =>
            !passedCourses.has((s.course || '').toUpperCase().trim()) &&
            registeredCourses.includes((s.course || '').toUpperCase().trim())
        );

        if (eligible.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No CA exams available for you.</p>';
            return;
        }

        // ── Only show CA courses that still have questions in the bank ──────
        // CA is a pre-exam test for the student's current dept + level + semester.
        const caCodes = eligible.map(s => (s.course || '').toUpperCase().trim()).filter(Boolean);
        const { data: caQData } = await sb.from('questions').select('course')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level',      localData.level)
            .eq('semester',   localData.semester)
            .in('course',     caCodes);
        const caHasQuestions = new Set((caQData || []).map(q => (q.course || '').toUpperCase().trim()));
        const eligibleWithQ  = eligible.filter(s => caHasQuestions.has((s.course || '').toUpperCase().trim()));

        if (eligibleWithQ.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No CA exams available right now.</p>';
            return;
        }

        listDiv.innerHTML = eligibleWithQ.map(s => {
            const safeCourse = sanitise(s.course);
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left:5px solid #3b82f6;">
                    <div>
                        <b style="color:#333;">${safeCourse}</b>
                        <small style="color:#666; display:block;">${sanitise(localData.level)}L | ${sanitise(localData.semester)} Semester</small>
                    </div>
                    <button data-course="${safeCourse}"
                            data-token="${sanitise(s.token_code)}"
                            class="select-ca-btn"
                            style="background:#3b82f6; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">
                        SELECT
                    </button>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.select-ca-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const course = btn.getAttribute('data-course');
                const token  = btn.getAttribute('data-token');
                sessionStorage.setItem('activeSubject', course);
                sessionStorage.setItem('examSessionType', 'ca');
                const tokenInput = document.getElementById('examToken');
                if (tokenInput) tokenInput.value = token;
                document.getElementById('selectedCourseText').textContent =
                    `✅ CA: ${course} selected — token pre-filled. Click START EXAMINATION.`;
                tokenInput?.focus();
            });
        });
    } catch (err) {
        console.error('CA fetch error:', err);
        listDiv.innerHTML = '<p style="color:red;">Error loading CA exams.</p>';
    }
}

async function logout() {
    const token = sessionStorage.getItem("studentToken");
    if (token) {
        try {
            await sb.from('students').update({ session_token: null, session_expires_at: null }).eq('session_token', token);
        } catch(e) {}
    }
    ['saved_exam_progress','saved_questions_order','offline_scores'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.replace("student_login.html");
}

// ── RESOURCES (ORIGINAL) ───────────────────────────────────────────
function renderList(items, highlightedCourse) {
    const listDiv = document.getElementById('resourceList');
    if (!listDiv) return;
    if (items.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#a0aec0; padding:20px;">No materials found in the database.</p>';
        return;
    }

    listDiv.innerHTML = items.map(item => {
        const isFile = !!(item.file_url && item.file_url.trim());
        const itemCourse = sanitise((item.course || "GENERAL").toUpperCase().trim());
        const safeTitle = sanitise(item.title || '');
        const safeFileUrl = sanitise(item.file_url || '');
        const safeNote = encodeURIComponent(item.note_content || '');
        const isRecommended = highlightedCourse && itemCourse === sanitise(highlightedCourse.toUpperCase().trim());
        const cardStyle = isRecommended 
            ? 'border: 2px solid #00ff88; background: #f0fff4; box-shadow: 0 4px 12px rgba(0,255,136,0.1);' 
            : 'border-bottom: 1px solid #f7fafc; background: white;';

        const btn = isFile
            ? `<button data-action="open-file" data-url="${safeFileUrl}" style="background: ${isRecommended ? '#0f5132' : '#2b6cb0'}; color: #00ff88; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem;">${isRecommended ? 'STUDY NOW' : 'OPEN'}</button>`
            : `<button data-action="show-note" data-title="${safeTitle}" data-note="${safeNote}" style="background: ${isRecommended ? '#0f5132' : '#2b6cb0'}; color: #00ff88; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.8rem;">${isRecommended ? 'STUDY NOW' : 'OPEN'}</button>`;

        return `
            <div class="res-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 8px; border-radius: 10px; ${cardStyle}">
                <div style="flex: 1;">
                    ${isRecommended ? '<span style="color:#0f5132; font-size:0.65rem; font-weight:800;">⭐ RECOMMENDED REVIEW</span>' : ''}
                    <span style="display: block; font-weight: 700; color: #2d3748; font-size: 1rem;">${safeTitle.toUpperCase()}</span>
                    <small style="color: #718096; font-weight: bold; text-transform: uppercase; font-size: 0.7rem;">CODE: ${itemCourse} • ${isFile ? '📁 PDF DOCUMENT' : '📝 NOTE'}</small>
                </div>
                ${btn}
            </div>
        `;
    }).join('');
}

function filterMaterials() {
    const query = document.getElementById('courseSearch').value.toLowerCase().replace(/\s/g, '');
    const lastExamCourse = localStorage.getItem('last_exam_course');
    const filtered = allMaterials.filter(item => {
        const title = (item.title || "").toLowerCase().replace(/\s/g, '');
        const course = (item.course || "").toLowerCase().replace(/\s/g, '');
        return title.includes(query) || course.includes(query);
    });
    renderList(filtered, lastExamCourse);
}

async function syncClassroom() {
    const lastExamCourse = localStorage.getItem('last_exam_course');
    try {
        const { data: ann } = await sb.from('exam_sessions').select('announcement').eq('id', 1).maybeSingle();
        const annBox = document.getElementById('announcementBox');
        if (ann && ann.announcement) {
            annBox.style.display = "block";
            document.getElementById('newsText').innerText = ann.announcement;
        } else annBox.style.display = "none";

        const { data: res, error: rErr } = await sb.from('resources').select('*').order('created_at', { ascending: false });
        if (rErr) return;
        if (res) {
            allMaterials = res;
            if (lastExamCourse) {
                const target = lastExamCourse.toUpperCase().trim();
                allMaterials.sort((a, b) => (b.course || "").toUpperCase().trim() === target ? 1 : -1);
            }
            renderList(allMaterials, lastExamCourse);
        }
    } catch (e) { console.error("Sync Process Error:", e); }
}

// ── LIVE CLASS (ORIGINAL) ──────────────────────────────────────────
async function checkForLiveClass() {
    const { data, error } = await sb.from('live_classes').select('*').eq('is_active', true).single();
    if (data) {
        window.currentRoomId = data.room_id;
        document.getElementById('liveCourseName').textContent = data.course_code;
        document.getElementById('classAlert').style.display = 'block';
    } else {
        document.getElementById('classAlert').style.display = 'none';
    }
}

async function joinClass() {
    if (!localData) return alert("Student data not loaded. Please refresh.");
    document.getElementById('classAlert').style.display = 'none';
    const container = document.querySelector('#studentVideoContainer');
    container.innerHTML = "";
    const options = {
        roomName: window.currentRoomId,
        width: "100%",
        height: 550,
        parentNode: container,
        userInfo: { displayName: `${localData.name} (${localData.matrix})` },
        configOverwrite: { startWithAudioMuted: true, startWithVideoMuted: true, disableProfile: true },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ['microphone','camera','chat','raisehand','tileview','fullscreen'] }
    };
    try { studentApi = new JitsiMeetExternalAPI("meet.jit.si", options); } catch (err) { alert("Video load failed."); }
}

// ── RESULTS (ORIGINAL PDF) ─────────────────────────────────────────
async function checkResultsReleased() {
    if (!localData) return;
    try {
        const { data, error } = await sb.rpc('is_results_released', {
            p_dept: localData.dept.trim().toUpperCase(),
            p_level: localData.level,
            p_semester: localData.semester
        });
        const navBtn = document.getElementById('downloadResultsNav');
        if (!navBtn) return;
        const isReleased = data === true;
        navBtn.style.display = isReleased ? 'flex' : 'none';
    } catch (e) { 
        console.error("Error checking results release status:", e);
        document.getElementById('downloadResultsNav').style.display = 'none';
    }
}

// ── GRADING HELPER ────────────────────────────────────────────────────
function computeGrade(total) {
    if (total >= 70) return { grade: 'A', remark: 'Excellent' };
    if (total >= 60) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Good' };
    if (total >= 40) return { grade: 'D', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
}

// ── GPA HELPERS ───────────────────────────────────────────────────────
function gradePoint(grade) {
    // Nigerian polytechnic / college of health grading scale (5-point)
    if (grade === 'A') return 5;
    if (grade === 'B') return 4;
    if (grade === 'C') return 3;
    if (grade === 'D') return 2;
    return 0; // F
}

function computeGPA(courseEntries) {
    // courseEntries: [{ total, grade, creditUnits }, ...]
    let totalQP = 0, totalUnits = 0;
    for (const c of courseEntries) {
        if (c.grade === 'F' || c.creditUnits === 0) {
            totalQP    += 0;
            totalUnits += c.creditUnits;
        } else {
            totalQP    += gradePoint(c.grade) * c.creditUnits;
            totalUnits += c.creditUnits;
        }
    }
    if (totalUnits === 0) return { gpa: null, totalUnits: 0, totalQP: 0 };
    return { gpa: (totalQP / totalUnits).toFixed(2), totalUnits, totalQP };
}

function remarkFor(gpa) {
    const g = parseFloat(gpa);
    if (g >= 3.5) return 'Distinction';
    if (g >= 3.0) return 'Upper Credit';
    if (g >= 2.0) return 'Lower Credit';
    if (g >= 1.0) return 'Pass';
    return 'Fail';
}

function buildSemesterTableHTML(semesterLabel, courseMap, catalogMap) {
    const courseEntries = [];
    let rowIdx = 0;
    const rows = Object.entries(courseMap).map(([course, data]) => {
        rowIdx++;
        // CA and Exam scores are stored as direct /30 and /70 values (no weighting needed)
        const caScore   = data.ca   ? Math.min(30, Math.round(parseFloat(data.ca.score)))   : 0;
        const examScore = data.exam ? Math.min(70, Math.round(parseFloat(data.exam.score))) : 0;
        const total     = Math.min(100, caScore + examScore);
        const { grade, remark } = computeGrade(total);
        const creditUnits = catalogMap[course] !== undefined ? catalogMap[course] : 3;
        const gp          = gradePoint(grade);
        const qp          = gp * creditUnits;
        const gradeColor  = grade === 'F' ? '#cc0000' : grade === 'D' ? '#b45309' : '#0f5132';
        const bg          = rowIdx % 2 === 0 ? '#f9f9f9' : '#fff';

        courseEntries.push({ course, total, grade, creditUnits, gp, qp });

        return `
        <tr style="background:${bg}">
            <td style="text-align:center;">${rowIdx}</td>
            <td style="font-weight:bold; letter-spacing:0.4px;">${course}</td>
            <td style="text-align:center; font-weight:bold; color:${gradeColor};">${grade}</td>
            <td style="text-align:center;">
                <span class="remark-pill" style="background:${grade === 'F' ? '#fee2e2' : '#d1fae5'}; color:${gradeColor};">
                    ${remark}
                </span>
            </td>
        </tr>`;
    }).join('');

    // GP/QP/Units still computed (needed for GPA/CGPA) but not shown per-row, matching the
    // standard Nigerian result slip format (NUC/NCE/College of Education) shown to students.
    const { gpa, totalUnits, totalQP } = computeGPA(courseEntries);
    const gpaColor = gpa === null ? '#555' : parseFloat(gpa) >= 3.5 ? '#0f5132' : parseFloat(gpa) >= 2.0 ? '#b45309' : '#cc0000';

    const semBlock = `
    <div class="sem-block">
      <div class="sem-title">${semesterLabel} Semester Results</div>
      <table>
        <thead>
          <tr>
            <th style="width:36px;">S/N</th>
            <th>Course Code</th>
            <th style="width:70px; text-align:center;">Grade</th>
            <th style="width:110px; text-align:center;">Remark</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${gpa !== null ? `
      <div class="sem-gpa-line">
        Total Units: <strong>${totalUnits}</strong> &nbsp;|&nbsp; Total QP: <strong>${totalQP}</strong> &nbsp;|&nbsp;
        GPA (${semesterLabel} Semester): <strong style="color:${gpaColor}; font-size:1rem;">${gpa}</strong> (${remarkFor(gpa)})
      </div>` : ''}
    </div>`;

    return { html: semBlock, totalUnits, totalQP, gpa };
}

async function downloadResultsPDF() {
    if (!localData) return alert("Student data not loaded.");

    // 1. Fetch all results for this student
    const { data: results, error } = await sb.from('results')
        .select('*')
        .eq('matrix_no', localData.matrix)
        .order('created_at', { ascending: true });
    if (error || !results || results.length === 0) return alert("No results yet.");

    // 2. Collect unique course codes to look up credit units
    const courseKeys = [...new Set(results.map(r => (r.subject || r.course || 'N/A').toUpperCase()))];

    // 3. Fetch credit units from course_catalog (fallback = 3 if not found)
    let catalogMap = {};
    try {
        const { data: catalog } = await sb.from('course_catalog')
            .select('course_code, credit_units, semester')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .in('course_code', courseKeys);
        if (catalog) {
            catalog.forEach(c => {
                catalogMap[c.course_code.toUpperCase()] = c.credit_units;
            });
        }
    } catch (e) { /* catalog may not exist yet — use fallback */ }

    // 4. Group by semester first, then by course: pair exam + CA
    const semesterMap = {}; // { '1st': { COURSE: {ca, exam} }, '2nd': {...} }
    for (const r of results) {
        const sem = r.semester || localData.semester || '1st';
        const key = (r.subject || r.course || 'N/A').toUpperCase();
        if (!semesterMap[sem]) semesterMap[sem] = {};
        if (!semesterMap[sem][key]) semesterMap[sem][key] = { exam: null, ca: null };
        if (r.is_ca) semesterMap[sem][key].ca   = r;
        else         semesterMap[sem][key].exam = r;
    }

    // 5. Build a table block per semester + accumulate for true CGPA
    const semesterOrder = ['1st', '2nd'].filter(s => semesterMap[s]);
    Object.keys(semesterMap).forEach(s => { if (!semesterOrder.includes(s)) semesterOrder.push(s); });

    let combinedUnits = 0, combinedQP = 0;
    const semesterBlocksHTML = semesterOrder.map(sem => {
        const { html, totalUnits, totalQP } = buildSemesterTableHTML(sem, semesterMap[sem], catalogMap);
        combinedUnits += totalUnits;
        combinedQP    += totalQP;
        return html;
    }).join('');

    // 6. True CGPA = combined Quality Points ÷ combined Credit Units across BOTH semesters
    const cgpa = combinedUnits > 0 ? (combinedQP / combinedUnits).toFixed(2) : null;
    const cgpaColor = cgpa === null ? '#555' : parseFloat(cgpa) >= 3.5 ? '#0f5132' : parseFloat(cgpa) >= 2.0 ? '#b45309' : '#cc0000';
    const cgpaBlock = cgpa !== null ? `
        <div class="gpa-box">
            <div class="gpa-item"><label>Total Credit Units</label><span>${combinedUnits}</span></div>
            <div class="gpa-item"><label>Total Quality Points</label><span>${combinedQP}</span></div>
            <div class="gpa-item"><label>Cumulative GPA (CGPA)</label>
                <span style="color:${cgpaColor}; font-size:1.4rem;">${cgpa}</span>
            </div>
            <div class="gpa-item"><label>CGPA Remark</label>
                <span style="color:${cgpaColor};">${remarkFor(cgpa)}</span>
            </div>
        </div>` : '';

    const printHTML = `<!DOCTYPE html>
<html><head><title>Result Slip — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 24px; color: #111; font-size: 11.5px; }
  .header { text-align:center; border-bottom: 3px solid #0f5132; padding-bottom:12px; margin-bottom:16px; }
  .header h1 { color:#0f5132; font-size:1.25rem; margin-bottom:4px; }
  .header p  { color:#555; font-size:0.75rem; }
  .info-box  { display:grid; grid-template-columns:1fr 1fr; gap:8px 30px; border:1px solid #ccc; border-radius:8px; padding:12px 16px; margin-bottom:16px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.64rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.9rem; }
  .sem-block { margin-bottom:10px; page-break-inside: avoid; }
  .sem-title { font-weight:bold; color:#0f5132; font-size:0.85rem; margin-bottom:5px; letter-spacing:0.4px; text-transform:uppercase; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:6px 8px; text-align:left; font-size:0.7rem; letter-spacing:0.3px; }
  td { border:1px solid #ddd; padding:5px 8px; font-size:0.74rem; }
  .remark-pill { display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.68rem; font-weight:bold; }
  .sem-gpa-line { margin-top:5px; padding:6px 10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:0.72rem; color:#14532d; }
  .key-box { margin-top:14px; padding:9px 13px; background:#f0fdf4; border:1px solid #86efac; border-radius:8px; font-size:0.7rem; color:#14532d; }
  .key-box strong { display:block; margin-bottom:3px; }
  .gpa-box { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:10px 18px; border:2px solid #0f5132; border-radius:10px; padding:13px 18px; margin-top:14px; background:#f0fdf4; page-break-inside: avoid; }
  .gpa-item label { display:block; font-size:0.62rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; }
  .gpa-item span  { font-weight:bold; color:#0f5132; font-size:1rem; }
  .footer { margin-top:18px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:8px; }
  @media print { body { padding:14px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>🎓 BRAINS AI — OFFICIAL RESULT SLIP</h1>
    <p>Academic Result Record &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Session Semesters</label><span>${semesterOrder.join(' & ')} Semester</span></div>
  </div>
  ${semesterBlocksHTML}
  ${cgpaBlock}
  <div class="key-box">
    <strong>Nigerian NUC / NCCE Approved Grading Scale:</strong>
    A — Excellent &nbsp;|&nbsp; B — Very Good &nbsp;|&nbsp; C — Good &nbsp;|&nbsp; D — Pass &nbsp;|&nbsp; F — Fail
    <br>Distinction ≥ 3.50 &nbsp;|&nbsp; Upper Credit ≥ 3.00 &nbsp;|&nbsp; Lower Credit ≥ 2.00 &nbsp;|&nbsp; Pass ≥ 1.00 &nbsp;|&nbsp; Fail &lt; 1.00
  </div>
  <div class="footer">BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This document is auto-generated.</div>
</body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
}

// ── EXAM CARD (ORIGINAL PDF) ───────────────────────────────────────
async function checkExamCardReleased() {
    if (!localData) return;
    try {
        const { data, error } = await sb.rpc('is_exam_card_released', {
            p_dept:     localData.dept.trim().toUpperCase(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        const navBtn = document.getElementById('downloadExamCardNav');
        if (!navBtn) return;
        const isReleased = data === true;
        navBtn.style.display = isReleased ? 'flex' : 'none';
    } catch (e) {
        console.error("Exam card check error:", e);
        const navBtn = document.getElementById('downloadExamCardNav');
        if (navBtn) navBtn.style.display = 'none';
    }
}

async function downloadExamCardPDF() {
    if (!localData) return alert("Student data not loaded.");
    const { data: qData, error } = await sb.from('questions')
        .select('course')
        .eq('department', localData.dept.toUpperCase().trim())
        .eq('level', localData.level)
        .eq('semester', localData.semester);
    if (error || !qData || qData.length === 0) return alert("No courses found for your group. Contact the admin.");
    const courses = [...new Set(qData.map(q => (q.course || '').toUpperCase().trim()))].filter(Boolean).sort();
    let scheduleMap = {};
    try {
        const { data: sched } = await sb.rpc('get_exam_schedules_for_student', {
            p_dept:     localData.dept.toUpperCase().trim(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        if (sched) sched.forEach(s => { scheduleMap[(s.course_code || '').toUpperCase().trim()] = s; });
    } catch(e) {}
    const qrData    = JSON.stringify({ matrix: localData.matrix, name: localData.name, dept: localData.dept, level: localData.level, semester: localData.semester });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&margin=0`;
    const rows = courses.map((c, i) => {
        const sched   = scheduleMap[c] || {};
        const dateStr = sched.exam_date ? new Date(sched.exam_date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) : '____________';
        const timeStr = sched.exam_time ? sched.exam_time.substring(0,5) : '____________';
        const venue   = sched.venue ? sanitise(sched.venue) : '____________';
        return `
        <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
            <td style="text-align:center; width:36px;">${i + 1}</td>
            <td style="font-weight:bold; letter-spacing:0.5px;">${c}</td>
            <td style="text-align:center; color:${sched.exam_date ? '#0f5132' : '#aaa'};">${dateStr}</td>
            <td style="text-align:center; color:${sched.exam_time ? '#0f5132' : '#aaa'};">${timeStr}</td>
            <td style="color:${sched.venue ? '#333' : '#aaa'};">${venue}</td>
            <td style="text-align:center; color:#aaa; width:110px;">____________</td>
        </tr>`;
    }).join('');
    const printHTML = `<!DOCTYPE html>
<html><head><title>Exam Card — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #111; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0f5132; padding-bottom:14px; margin-bottom:20px; }
  .header-text h1 { color:#0f5132; font-size:1.2rem; margin-bottom:4px; }
  .header-text p  { color:#555; font-size:0.75rem; }
  .qr-block { text-align:center; }
  .qr-block img { width:100px; height:100px; border:2px solid #0f5132; border-radius:6px; }
  .qr-block small { display:block; color:#aaa; font-size:0.6rem; margin-top:3px; }
  .info-box  { display:grid; grid-template-columns:1fr 1fr; gap:10px 30px; border:1px solid #ccc; border-radius:8px; padding:14px 18px; margin-bottom:22px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.68rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.92rem; }
  .notice { background:#fffbea; border:1px solid #f0c040; border-radius:6px; padding:10px 14px; font-size:0.78rem; color:#856404; margin-bottom:18px; }
  table { width:100%; border-collapse:collapse; margin-bottom:30px; }
  thead tr { background:#0f5132; color:white; }
  th { padding:9px 10px; text-align:left; font-size:0.75rem; letter-spacing:0.4px; }
  td { border:1px solid #ddd; padding:9px 10px; }
  .sign-section { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:30px; margin-bottom:20px; }
  .sign-box { border-top:1px solid #999; padding-top:8px; }
  .sign-box .sign-line { height:50px; border-bottom:1px dashed #ccc; margin-bottom:4px; }
  .sign-box p { font-size:0.72rem; color:#555; text-align:center; margin-top:4px; }
  .stamp-box { border:2px dashed #ccc; border-radius:8px; height:90px; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:0.75rem; margin-top:20px; margin-bottom:20px; }
  .footer { margin-top:24px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:10px; }
  @media print { body { padding:15px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-text">
      <h1>🎓 BRAINS AI — STUDENT EXAM CARD</h1>
      <p>Official CBT Examination Hall Ticket &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
      <p style="margin-top:4px; color:#0f5132; font-size:0.7rem; font-weight:bold;">
        Academic Session: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}
      </p>
    </div>
    <div class="qr-block">
      <img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'">
      <small>Scan to verify</small>
    </div>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <div class="notice">
    ⚠️ <strong>Instructions:</strong> Present this card at the examination hall entrance along with your valid student ID.
    The CBT access token for each course will be shown on your dashboard when the gate is open.
    You may only sit for courses listed below. This card is <strong>non-transferable</strong>.
  </div>
  
  <!-- ========== COURSES TABLE (comes FIRST) ========== -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Course Code</th>
        <th>Date</th>
        <th>Time</th>
        <th>Venue</th>
        <th>Invigilator Signature</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  
  <!-- ========== SIGNATURES (come AFTER the table) ========== -->
  <div class="sign-section">
    <div class="sign-box"><div class="sign-line"></div><p>Exam Officer Signature &amp; Date</p></div>
    <div class="sign-box"><div class="sign-line"></div><p>HOD / Dean Signature &amp; Date</p></div>
  </div>
  
  <div class="footer">
    BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This card is non-transferable.
  </div>
</body>
</html>`;
    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    win.onload = () => win.print();
}


// ── SCHEDULED EXAM CARD (ORIGINAL) ─────────────────────────────────
async function checkScheduledExamCardReleased() {
    if (!localData) return;
    try {
        const { data, error } = await sb.rpc('is_scheduled_exam_released', {
            p_dept:     localData.dept.trim().toUpperCase(),
            p_level:    localData.level,
            p_semester: localData.semester
        });
        const btn = document.getElementById('downloadScheduledExamCardNav');
        if (!btn) return;
        btn.style.display = (data === true) ? 'flex' : 'none';
    } catch (e) {
        console.error("Scheduled exam card check error:", e);
        const btn = document.getElementById('downloadScheduledExamCardNav');
        if (btn) btn.style.display = 'none';
    }
}

async function downloadScheduledExamCardPDF() {
    if (!localData) return alert("Student data not loaded.");
    const dept     = localData.dept.trim();
    const level    = localData.level;
    const semester = localData.semester;
    const { data: schedules, error } = await sb.rpc('get_exam_schedules_for_student', {
        p_dept:     dept.toUpperCase().trim(),
        p_level:    level,
        p_semester: semester
    });
    if (error) { console.error("Exam schedule fetch error:", error); alert("Error loading exam schedule: " + error.message); return; }
    if (!schedules || schedules.length === 0) { alert("No exam schedule found for your group. Contact the admin."); return; }
    const qrData    = JSON.stringify({ matrix: localData.matrix, name: localData.name, dept, level, semester });
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&margin=0`;
    const rows = schedules.map((s, i) => {
        const dateStr = s.exam_date ? new Date(s.exam_date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) : '—';
        const timeStr = s.exam_time ? s.exam_time.substring(0,5) : '—';
        return `
        <tr style="background:${i%2===0?'#f9f9f9':'#fff'}">
            <td style="padding:9px 10px; text-align:center;">${i+1}</td>
            <td style="padding:9px 10px; font-weight:bold; letter-spacing:0.5px;">${sanitise(s.course_code)}</td>
            <td style="padding:9px 10px; color:#0f5132;">${dateStr}</td>
            <td style="padding:9px 10px; color:#0f5132;">${timeStr}</td>
            <td style="padding:9px 10px;">${s.venue ? sanitise(s.venue) : '—'}</td>
            <td style="padding:9px 10px; color:#aaa; text-align:center;">____________</td>
        </td>`;
    }).join('');
    const printHTML = `<!DOCTYPE html>
<html><head><title>Scheduled Exam Card — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #111; font-size: 13px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0f5132; padding-bottom:14px; margin-bottom:20px; }
  .header-text h1 { color:#0f5132; font-size:1.2rem; margin-bottom:4px; }
  .header-text p  { color:#555; font-size:0.75rem; }
  .qr-block { text-align:center; }
  .qr-block img { width:100px; height:100px; border:2px solid #0f5132; border-radius:6px; }
  .qr-block small { display:block; color:#aaa; font-size:0.6rem; margin-top:3px; }
  .info-box { display:grid; grid-template-columns:1fr 1fr; gap:10px 30px; border:1px solid #ccc; border-radius:8px; padding:14px 18px; margin-bottom:22px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.68rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.92rem; }
  .notice { background:#fffbea; border:1px solid #f0c040; border-radius:6px; padding:10px 14px; font-size:0.78rem; color:#856404; margin-bottom:18px; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:9px 10px; text-align:left; font-size:0.75rem; letter-spacing:0.4px; }
  td { border:1px solid #ddd; }
  .sign-section { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:30px; }
  .sign-box { border-top:1px solid #999; padding-top:8px; }
  .sign-box .sign-line { height:50px; border-bottom:1px dashed #ccc; margin-bottom:4px; }
  .sign-box p { font-size:0.72rem; color:#555; text-align:center; margin-top:4px; }
  .stamp-box { border:2px dashed #ccc; border-radius:8px; height:90px; display:flex; align-items:center; justify-content:center; color:#ccc; font-size:0.75rem; margin-top:20px; }
  .footer { margin-top:24px; text-align:center; font-size:0.65rem; color:#aaa; border-top:1px solid #eee; padding-top:10px; }
  @media print { body { padding:15px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-text">
      <h1>🎓 BRAINS AI — SCHEDULED EXAM CARD</h1>
      <p>Official Physical Examination Hall Ticket &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
      <p style="margin-top:4px; color:#0f5132; font-size:0.7rem; font-weight:bold;">
        Academic Session: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}
      </p>
    </div>
    <div class="qr-block">
      <img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'">
      <small>Scan to verify</small>
    </div>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <div class="notice">
    ⚠️ <strong>Instructions:</strong> Present this card at the examination hall entrance with your valid student ID.
    This card is <strong>non-transferable</strong>. Ensure you arrive at least 15 minutes before your exam time.
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:36px;">#</th>
        <th>Course Code</th>
        <th>Date</th>
        <th>Time</th>
        <th>Venue</th>
        <th style="width:110px;">Invigilator Signature</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="sign-section">
    <div class="sign-box"><div class="sign-line"></div><p>Exam Officer Signature &amp; Date</p></div>
    <div class="sign-box"><div class="sign-line"></div><p>HOD / Dean Signature &amp; Date</p></div>
  </div>
  <div class="footer">
    BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp;
    This card is non-transferable and must be presented at every examination sitting.
  </div>
</body></html>`;
    const win = window.open('', '_blank');
    win.document.write(printHTML);
    win.document.close();
    win.onload = () => win.print();
}

// ── ASSIGNMENTS (ORIGINAL) ──────────────────────────────────────────
async function submitAssignment() {
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const course   = document.getElementById('assignCourse').value.trim().toUpperCase();
    const title    = document.getElementById('assignTitle').value.trim();
    const content  = document.getElementById('assignContent').value.trim();
    const msg      = document.getElementById('assignMsg');
    const btn      = document.getElementById('submitAssignmentBtn');

    if (!course || !title || !content) {
        msg.style.color = '#ff4444';
        msg.innerText = '⚠️ Please fill in all fields.';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Submitting...';

    try {
        const { error } = await sb.from('assignments').insert({
            student_name: student.name,
            matrix_no:    student.matrix,
            faculty:      student.faculty,
            department:   student.dept,
            level:        student.level,
            semester:     student.semester,
            course_code:  course,
            title:        title,
            content:      content,
            status:       'pending'
        });
        if (error) throw error;
        msg.style.color = '#00aa55';
        msg.innerText = '✅ Assignment submitted successfully!';
        document.getElementById('assignCourse').value  = '';
        document.getElementById('assignTitle').value   = '';
        document.getElementById('assignContent').value = '';
        loadMyAssignments();
    } catch (err) {
        msg.style.color = '#ff4444';
        msg.innerText = '❌ Submission failed: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = '📤 SUBMIT ASSIGNMENT';
    }
}

async function loadMyAssignments() {
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const listDiv = document.getElementById('myAssignmentsList');
    const { data, error } = await sb.from('assignments')
        .select('*')
        .eq('matrix_no', student.matrix)
        .order('submitted_at', { ascending: false });
    if (error || !data || data.length === 0) {
        listDiv.innerHTML = '<p style="color:#a0aec0; text-align:center;">No assignments submitted yet.</p>';
        return;
    }
    listDiv.innerHTML = data.map(a => {
        const isGraded = a.status === 'graded';
        const scoreText = isGraded
            ? `<span style="color:#0f5132; font-weight:bold; font-size:1.1rem;">${a.score} / ${a.max_score}</span>`
            : `<span style="color:#f59e0b; font-weight:bold;">Pending</span>`;
        const feedbackText = a.feedback
            ? `<p style="color:#555; font-size:0.85rem; margin-top:6px; border-left:3px solid #00ff88; padding-left:8px;">💬 ${sanitise(a.feedback)}</p>`
            : '';
        const deleteBtn = isGraded
            ? `<button data-id="${a.id}" class="delete-assign-btn" style="background:#ff4444; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem; margin-left:8px;">🗑️</button>`
            : '';
        return `
            <div style="padding:14px; margin-bottom:10px; border-radius:8px;
                        border-left:5px solid ${isGraded ? '#00ff88' : '#f59e0b'};
                        background:#f8fdf9;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#0f5132;">${sanitise(a.course_code)}</strong>
                        <span style="color:#666; font-size:0.85rem; margin-left:8px;">${sanitise(a.title)}</span>
                    </div>
                    <div style="display:flex; align-items:center;">
                        ${scoreText}
                        ${deleteBtn}
                    </div>
                </div>
                ${feedbackText}
                <small style="color:#a0aec0;">Submitted: ${new Date(a.submitted_at).toLocaleDateString()}</small>
            </div>
        `;
    }).join('');
}

async function deleteStudentAssignment(id) {
    if (!confirm('Delete this graded assignment? This cannot be undone.')) return;
    const { error } = await sb.from('assignments').delete().eq('id', id);
    if (error) alert('Delete failed: ' + error.message);
    else loadMyAssignments();
}

// ── COURSE REGISTRATION ────────────────────────────────────────────────────

const REG_MIN_UNITS = 15;
const REG_MAX_UNITS = 24;

async function loadCourseRegistration() {
    const listDiv     = document.getElementById('regCourseList');
    const unitBar     = document.getElementById('regUnitBar');
    const actionArea  = document.getElementById('regActionArea');
    const closedNote  = document.getElementById('regClosedNotice');
    const msgEl       = document.getElementById('regMsg');

    if (!listDiv || !localData) return;
    listDiv.innerHTML = '<p style="color:#a0aec0;">Loading courses...</p>';
    if (msgEl) msgEl.textContent = '';

    // Reset shared carryover units tracker
    window._regCarryoverUnits = 0;
    window._regCarryoverCodes = [];

    try {
        // 1. Check if admin has opened registration for this group
        const { data: control } = await sb
            .from('registration_control')
            .select('is_open')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .maybeSingle();

        const isOpen = control ? control.is_open : false;

        if (!isOpen) {
            closedNote.style.display  = 'block';
            unitBar.style.display     = 'none';
            actionArea.style.display  = 'none';
            listDiv.innerHTML = '';
        } else {
            closedNote.style.display = 'none';
        }

        // 2. Fetch student's active carryover sessions so they show first
        //    Carryovers are mandatory to register first per institution policy.
        const { data: coSessions } = await sb
            .from('exam_sessions')
            .select('carryover_course, original_level, original_semester')
            .eq('is_carryover', true)
            .eq('is_active', 'true')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('original_level', localData.level)
            .eq('original_semester', localData.semester);

        // Also check which carryover courses student hasn't passed yet
        const { data: results } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);

        const passedSet = new Set();
        (results || []).forEach(r => {
            if (parseFloat(r.score) >= 50)
                passedSet.add((r.subject || '').toUpperCase().trim());
        });

        // Filter to only unpassed carryover courses, deduplicate
        const coCodesRaw = [...new Set(
            (coSessions || [])
                .map(s => (s.carryover_course || '').toUpperCase().trim())
                .filter(c => c && !passedSet.has(c))
        )];

        // Get credit units for carryover courses from catalog
        // (use original level/semester — carryovers belong to past semesters)
        let coCatalogMap = {};
        if (coCodesRaw.length > 0) {
            const { data: coCat } = await sb
                .from('course_catalog')
                .select('course_code, credit_units')
                .in('course_code', coCodesRaw)
                .eq('department', localData.dept.toUpperCase().trim());
            (coCat || []).forEach(c => {
                coCatalogMap[(c.course_code || '').toUpperCase().trim()] = parseInt(c.credit_units) || 3;
            });
        }

        // Build carryover display — locked, pre-checked, counts toward total
        let carryoverHTML = '';
        if (coCodesRaw.length > 0) {
            let coUnits = 0;
            coCodesRaw.forEach(code => {
                const units = coCatalogMap[code] || 3;
                coUnits += units;
                window._regCarryoverCodes.push({ course_code: code, units });
            });
            window._regCarryoverUnits = coUnits;

            carryoverHTML = `
            <div style="background:#fff3cd; border-left:5px solid #ff9800;
                        border-radius:10px; padding:14px 18px; margin-bottom:16px;">
                <p style="margin:0 0 10px 0; color:#856404; font-weight:bold; font-size:0.9rem;">
                    ⚠️ You have carryover course(s) — these are automatically included and counted
                    toward your unit total first, as required by institution policy.
                </p>
                ${coCodesRaw.map(code => {
                    const units = coCatalogMap[code] || 3;
                    return `
                    <div style="display:flex; justify-content:space-between; align-items:center;
                                padding:12px 14px; margin-bottom:8px; background:white; border-radius:8px;
                                border-left:5px solid #ff9800; opacity:0.9;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <input type="checkbox" checked disabled
                                   style="width:18px; height:18px; accent-color:#ff9800;">
                            <div>
                                <strong style="color:#c05000;">${sanitise(code)}</strong>
                                <small style="color:#856404; margin-left:8px;">Carryover — locked</small>
                            </div>
                        </div>
                        <span style="background:#ff9800; color:white; font-weight:bold; font-size:0.85rem;
                                     padding:4px 12px; border-radius:20px; white-space:nowrap;">
                            ${units} unit${units !== 1 ? 's' : ''}
                        </span>
                    </div>`;
                }).join('')}
                <p style="margin:8px 0 0 0; color:#856404; font-size:0.85rem;">
                    Carryover subtotal: <strong>${coUnits} unit${coUnits !== 1 ? 's' : ''}</strong>
                    — remaining space: <strong>${REG_MAX_UNITS - coUnits} units</strong>
                </p>
            </div>`;
        }

        // 3. Load catalog courses for current semester
        let catalogQuery = sb
            .from('course_catalog')
            .select('course_code, course_title, credit_units')
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .order('course_code');

        if (localData.faculty && localData.faculty !== 'Not Specified') {
            catalogQuery = catalogQuery.eq('faculty', localData.faculty);
        }

        const { data: catalog, error: catErr } = await catalogQuery;
        if (catErr) throw catErr;

        if (!catalog || catalog.length === 0) {
            listDiv.innerHTML = carryoverHTML +
                '<p style="color:#a0aec0;">No courses found in catalog for your department/level/semester. Contact admin.</p>';
            unitBar.style.display    = 'none';
            actionArea.style.display = 'none';
            return;
        }

        // 4. Load already-registered courses for pre-checking
        const { data: existing } = await sb
            .from('course_registrations')
            .select('course_code')
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        const alreadyReg = new Set((existing || []).map(r => r.course_code.toUpperCase().trim()));

        // 5. Render carryover block first, then current semester checkboxes
        const catalogHTML = catalog.map(c => {
            const code    = (c.course_code || '').toUpperCase().trim();
            const title   = c.course_title || '';
            const units   = parseInt(c.credit_units) || 3;
            const checked = alreadyReg.has(code) ? 'checked' : '';
            const disabled = !isOpen ? 'disabled' : '';
            return `
            <div class="reg-course-card" id="regCard_${code}"
                 style="display:flex; justify-content:space-between; align-items:center;
                        padding:14px 18px; margin-bottom:10px; background:white; border-radius:10px;
                        border-left:5px solid ${alreadyReg.has(code) ? '#00ff88' : '#ddd'};
                        box-shadow:0 2px 6px rgba(0,0,0,0.04); transition:all 0.2s;">
                <label style="display:flex; align-items:center; gap:14px;
                              cursor:${isOpen ? 'pointer' : 'default'}; flex:1;">
                    <input type="checkbox" class="reg-checkbox"
                           data-code="${code}" data-units="${units}"
                           ${checked} ${disabled}
                           style="width:18px; height:18px; accent-color:#00ff88;
                                  cursor:${isOpen ? 'pointer' : 'default'};">
                    <div>
                        <strong style="color:#0f5132; font-size:1rem;">${sanitise(code)}</strong>
                        ${title ? `<span style="color:#555; margin-left:8px; font-size:0.9rem;">${sanitise(title)}</span>` : ''}
                    </div>
                </label>
                <span style="background:#0a3d25; color:#facc15; font-weight:bold; font-size:0.85rem;
                             padding:4px 12px; border-radius:20px; white-space:nowrap; margin-left:10px;">
                    ${units} unit${units !== 1 ? 's' : ''}
                </span>
            </div>`;
        }).join('');

        listDiv.innerHTML = carryoverHTML +
            (coCodesRaw.length > 0
                ? `<p style="color:#555; font-weight:bold; margin-bottom:12px;">
                       📚 Current Semester Courses — select to add:
                   </p>`
                : '') +
            catalogHTML;

        // 6. Show unit bar and action area only if registration is open
        if (isOpen) {
            unitBar.style.display    = 'flex';
            actionArea.style.display = 'block';
            updateRegUnitCounter();

            document.querySelectorAll('.reg-checkbox').forEach(cb => {
                cb.addEventListener('change', () => {
                    const code = cb.getAttribute('data-code');
                    const card = document.getElementById(`regCard_${code}`);
                    if (card) {
                        card.style.borderLeftColor = cb.checked ? '#00ff88' : '#ddd';
                        card.style.boxShadow = cb.checked
                            ? '0 4px 12px rgba(0,255,136,0.15)'
                            : '0 2px 6px rgba(0,0,0,0.04)';
                    }
                    updateRegUnitCounter();
                });
            });

            document.getElementById('regSaveBtn').onclick = saveCourseRegistration;
        } else {
            unitBar.style.display    = 'none';
            actionArea.style.display = 'none';
        }

    } catch (err) {
        console.error('loadCourseRegistration error:', err);
        listDiv.innerHTML = `<p style="color:red;">Error loading courses: ${sanitise(err.message)}</p>`;
    }
}

function updateRegUnitCounter() {
    const checkboxes = document.querySelectorAll('.reg-checkbox:checked');
    const coBase = window._regCarryoverUnits || 0;
    let selected = 0;
    checkboxes.forEach(cb => { selected += parseInt(cb.getAttribute('data-units')) || 0; });
    const total = coBase + selected;

    const totalEl  = document.getElementById('regTotalUnits');
    const statusEl = document.getElementById('regUnitStatus');
    if (!totalEl || !statusEl) return;

    totalEl.textContent = total;

    // Show breakdown if there are carryover units
    if (coBase > 0) {
        totalEl.title = `Carryover: ${coBase} + Selected: ${selected}`;
    }

    if (total === 0) {
        statusEl.textContent = 'No courses selected';
        statusEl.style.background = '#555';
    } else if (total < REG_MIN_UNITS) {
        statusEl.textContent = `Below minimum (${REG_MIN_UNITS} units)`;
        statusEl.style.background = '#ff4444';
    } else if (total > REG_MAX_UNITS) {
        statusEl.textContent = `Exceeds maximum (${REG_MAX_UNITS} units)!`;
        statusEl.style.background = '#ff4444';
    } else {
        statusEl.textContent = `✅ Valid (${REG_MIN_UNITS}–${REG_MAX_UNITS} units)`;
        statusEl.style.background = '#00a854';
    }
}

async function saveCourseRegistration() {
    const btn   = document.getElementById('regSaveBtn');
    const msgEl = document.getElementById('regMsg');

    // Carryover units + codes (set by loadCourseRegistration)
    const coBase  = window._regCarryoverUnits || 0;
    const coCodes = window._regCarryoverCodes || [];

    const checkboxes = document.querySelectorAll('.reg-checkbox');
    const selected = [];
    let selectedUnits = 0;

    checkboxes.forEach(cb => {
        if (cb.checked) {
            selected.push({
                course_code: cb.getAttribute('data-code'),
                units: parseInt(cb.getAttribute('data-units')) || 0
            });
            selectedUnits += parseInt(cb.getAttribute('data-units')) || 0;
        }
    });

    const totalUnits = coBase + selectedUnits;

    // Hard block: exceeds max (carryover + selected combined)
    if (totalUnits > REG_MAX_UNITS) {
        msgEl.style.color = '#ff4444';
        msgEl.textContent = `❌ Total units (${totalUnits}) exceed the maximum of ${REG_MAX_UNITS}.`
            + (coBase > 0 ? ` Note: ${coBase} unit(s) are already taken by your carryover course(s).` : '')
            + ` Please deselect some courses.`;
        return;
    }

    // Soft warn: below minimum
    if (totalUnits < REG_MIN_UNITS && (selected.length > 0 || coCodes.length > 0)) {
        const proceed = confirm(
            `⚠️ Total registered units (${totalUnits}) is below the minimum of ${REG_MIN_UNITS} units.\n\n`
            + (coBase > 0 ? `Carryover: ${coBase} units + Selected: ${selectedUnits} units = ${totalUnits} units.\n\n` : '')
            + `Do you want to save anyway?`
        );
        if (!proceed) return;
    }

    if (selected.length === 0 && coCodes.length === 0) {
        msgEl.style.color = '#ff4444';
        msgEl.textContent = '⚠️ Please select at least one course before saving.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';
    msgEl.textContent = '';

    try {
        // Delete existing registrations for this student/semester first
        await sb
            .from('course_registrations')
            .delete()
            .eq('matrix_no', localData.matrix)
            .eq('department', localData.dept.toUpperCase().trim())
            .eq('level', localData.level)
            .eq('semester', localData.semester);

        // Build rows: carryover courses first, then selected semester courses
        const coRows = coCodes.map(c => ({
            matrix_no:   localData.matrix,
            course_code: c.course_code,
            faculty:     localData.faculty || null,
            department:  localData.dept.toUpperCase().trim(),
            level:       localData.level,
            semester:    localData.semester
        }));

        const semRows = selected.map(s => ({
            matrix_no:   localData.matrix,
            course_code: s.course_code,
            faculty:     localData.faculty || null,
            department:  localData.dept.toUpperCase().trim(),
            level:       localData.level,
            semester:    localData.semester
        }));

        const { error } = await sb.from('course_registrations').insert([...coRows, ...semRows]);
        if (error) throw error;

        const totalCount = coRows.length + semRows.length;
        msgEl.style.color = '#00a854';
        msgEl.textContent = `✅ Registration saved! ${totalCount} course(s) | ${totalUnits} units`
            + (coBase > 0 ? ` (${coBase} carryover + ${selectedUnits} new)` : '')
            + `. Your Available Exams will now reflect your registered courses.`;

        // Refresh exam lists silently
        fetchExams();
        fetchCaExams();

    } catch (err) {
        msgEl.style.color = '#ff4444';
        msgEl.textContent = '❌ Save failed: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 SAVE COURSE REGISTRATION';
    }
}