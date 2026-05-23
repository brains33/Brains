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

// ── SECURE EDGE FUNCTION CLIENT (replaces direct Supabase) ──────────
const STUDENT_PROXY_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/student-proxy';

async function studentFetch(action, body = {}) {
    const token = sessionStorage.getItem('studentToken');
    if (!token) throw new Error('No student token found');
    const resp = await fetch(STUDENT_PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-student-token': token
        },
        body: JSON.stringify({ action, ...body })
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || `HTTP ${resp.status}`);
    return result;
}

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

// ── ON LOAD ─────────────────────────────────────────────────────────
window.onload = async function() {
    const token = sessionStorage.getItem("studentToken");
    if (sessionStorage.getItem("loginUser") !== "true" || !token) {
        window.location.replace("student_login.html");
        return;
    }

    try {
        const { student: real } = await studentFetch('get-student-info');
        const deviceId = localStorage.getItem('muujiza_device_token');
        const studentPackage = {
            name: real.name,
            matrix: real.matrix_no,
            faculty: real.faculty || "Not Specified",
            dept: real.department.toUpperCase().trim(),
            level: String(real.level || '').replace(/L+$/i, '').trim(),
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

        // Start core functions
        fetchExams();
        fetchCarryoverExams();
        syncGatekeeper();
        checkResultsReleased();
        checkExamCardReleased();
        checkScheduledExamCardReleased();
        setInterval(syncGatekeeper, 5000);
        setInterval(checkSession, 15000);
        setInterval(checkResultsReleased, 30000);
        setInterval(checkExamCardReleased, 30000);
        setInterval(checkScheduledExamCardReleased, 30000);
        syncClassroom();
        setInterval(syncClassroom, 60000);
        checkForLiveClass();
        setInterval(checkForLiveClass, 30000);

        bindDashboardEvents();
        loadMyAssignments();
        setInterval(loadMyAssignments, 60000);
    } catch (e) {
        console.error("Init Error:", e);
        // Don't clear session on edge function error – show error in UI instead
        document.getElementById('welcomeText').innerText = "⚠️ Could not load data. Please refresh.";
    }
};

// ── EVENT BINDING (unchanged) ──────────────────────────────────────
function bindDashboardEvents() {
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

// ── CORE FUNCTIONS (using studentFetch) ────────────────────────────

async function fetchExams() {
    const listDiv = document.getElementById("subjectList");
    if (!localData) return;

    try {
        const { results: onlineResults } = await studentFetch('get-my-results');
        const offlineResults = JSON.parse(localStorage.getItem('offline_scores') || "[]");
        const finishedSubjects = [
            ...(onlineResults ? onlineResults.map(r => (r.subject || r.course || "").toUpperCase().trim()) : []),
            ...offlineResults.map(r => (r.subject || r.course || "").toUpperCase().trim())
        ];

        const { courses: exams } = await studentFetch('get-exam-courses');
        if (!exams || exams.length === 0) {
            listDiv.innerHTML = "<p style='color:gray;'>No exams found for your department.</p>";
            return;
        }

        const uniqueCourses = [...new Set(exams.map(e => e.toUpperCase().trim()))];
        const { sessions } = await studentFetch('get-exam-sessions');
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
    const activeSub  = sessionStorage.getItem('activeSubject');
    const student    = JSON.parse(sessionStorage.getItem('student_data'));
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
        const { passed, score } = await studentFetch('check-already-passed', { course: activeSub });
        if (passed && score >= 50) {
            return alert(`⛔ ACCESS DENIED: ${student.name.split(' ')[0]}, you have already passed ${activeSub} with ${score}%.`);
        }

        const { session, error: tokenErr } = await studentFetch('validate-exam-token', {
            token: tokenInput,
            course: activeSub,
            isCarryover: false
        }).catch(e => ({ error: e.message }));

        if (tokenErr || !session) {
            sessionStorage.setItem(attemptKey, attempts + 1);
            if (attempts + 1 >= 3) sessionStorage.setItem(lockKey, Date.now() + 10 * 60 * 1000);
            return alert("❌ Invalid Token. This token does not match your course, department, level or semester.");
        }

        const now = Date.now();
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
        const { sessions } = await studentFetch('get-exam-sessions');
        const gateBadge    = document.getElementById('gateBadge');
        const displayToken = document.getElementById('displayToken');
        const tokenInstr   = document.getElementById('tokenInstruction');

        if (!sessions || sessions.length === 0) {
            gateBadge.innerText = "NO SESSION"; gateBadge.style.background = "#555"; gateBadge.style.color = "white";
            displayToken.innerText = "----";
            if (tokenInstr) tokenInstr.innerText = "Wait for the admin to open the gate.";
            return;
        }

        const now = Date.now();
        const openSessions = sessions.filter(s => s.is_active === "true" && now < new Date(s.end_time).getTime());

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
    try {
        const { deviceId } = await studentFetch('check-device-session');
        if (deviceId && deviceId !== localData.deviceId) {
            alert("Session active on another device.");
            logout();
        }
    } catch (e) { /* ignore */ }
}

async function fetchCarryoverExams() {
    const listDiv = document.getElementById('carryoverSubjectList');
    if (!listDiv || !localData) return;

    try {
        const { sessions } = await studentFetch('get-carryover-sessions');
        if (!sessions || sessions.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available right now.</p>';
            return;
        }

        const { results } = await studentFetch('get-my-results');
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

        listDiv.innerHTML = eligible.map(s => {
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

async function logout() {
    try {
        await studentFetch('logout');
    } catch(e) {}
    ['saved_exam_progress','saved_questions_order','offline_scores'].forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    window.location.replace("student_login.html");
}

// ── RESOURCES (using studentFetch) ─────────────────────────────────
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
        const { announcement } = await studentFetch('get-announcement');
        const annBox = document.getElementById('announcementBox');
        if (announcement) {
            annBox.style.display = "block";
            document.getElementById('newsText').innerText = announcement;
        } else annBox.style.display = "none";

        const { resources } = await studentFetch('get-resources');
        if (resources) {
            allMaterials = resources;
            if (lastExamCourse) {
                const target = lastExamCourse.toUpperCase().trim();
                allMaterials.sort((a, b) => (b.course || "").toUpperCase().trim() === target ? 1 : -1);
            }
            renderList(allMaterials, lastExamCourse);
        }
    } catch (e) { console.error("Sync Process Error:", e); }
}

// ── LIVE CLASS ──────────────────────────────────────────────────────
async function checkForLiveClass() {
    try {
        const { liveClass } = await studentFetch('get-live-class');
        if (liveClass) {
            window.currentRoomId = liveClass.room_id;
            document.getElementById('liveCourseName').textContent = liveClass.course_code;
            document.getElementById('classAlert').style.display = 'block';
        } else {
            document.getElementById('classAlert').style.display = 'none';
        }
    } catch (e) { /* silent */ }
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

// ── RESULTS (using studentFetch) ────────────────────────────────────
async function checkResultsReleased() {
    if (!localData) return;
    try {
        const { released } = await studentFetch('check-results-released');
        const navBtn = document.getElementById('downloadResultsNav');
        if (navBtn) navBtn.style.display = released ? 'flex' : 'none';
    } catch (e) {
        console.error("Error checking results release status:", e);
        document.getElementById('downloadResultsNav').style.display = 'none';
    }
}

async function downloadResultsPDF() {
    if (!localData) return alert("Student data not loaded.");
    try {
        const { results } = await studentFetch('get-my-results');
        if (!results || results.length === 0) return alert("No results yet.");

        const rows = results.map((r, i) => {
            const course = (r.subject || r.course || 'N/A').toUpperCase();
            const score  = r.score ?? 'N/A';
            const pass   = (r.score || 0) >= 50;
            return `
            <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#fff'}">
                <td style="text-align:center;">${i + 1}</td>
                <td style="font-weight:bold; letter-spacing:0.5px;">${course}</td>
                <td style="text-align:center; font-weight:bold; color:${pass ? '#0f5132' : '#cc0000'};">${score}</td>
                <td style="text-align:center;">
                    <span style="display:inline-block; padding:3px 10px; border-radius:12px; font-size:0.78rem; font-weight:bold;
                                 background:${pass ? '#d1fae5' : '#fee2e2'}; color:${pass ? '#0f5132' : '#cc0000'};">
                        ${pass ? 'PASS' : 'FAIL'}
                    </span>
                </td>
            </tr>`;
        }).join('');

        const printHTML = `<!DOCTYPE html>
<html><head><title>Result Slip — ${localData.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; padding: 30px; color: #111; font-size: 13px; }
  .header { text-align:center; border-bottom: 3px solid #0f5132; padding-bottom:14px; margin-bottom:20px; }
  .header h1 { color:#0f5132; font-size:1.3rem; margin-bottom:4px; }
  .header p  { color:#555; font-size:0.8rem; }
  .info-box  { display:grid; grid-template-columns:1fr 1fr; gap:10px 30px; border:1px solid #ccc; border-radius:8px; padding:14px 18px; margin-bottom:22px; background:#f9fdfb; }
  .info-item label { display:block; font-size:0.68rem; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px; }
  .info-item span  { font-weight:bold; color:#0f5132; font-size:0.95rem; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:10px 12px; text-align:left; font-size:0.8rem; letter-spacing:0.5px; }
  td { border:1px solid #ddd; padding:10px 12px; }
  .footer { margin-top:28px; text-align:center; font-size:0.7rem; color:#aaa; border-top:1px solid #eee; padding-top:10px; }
  @media print { body { padding:15px; } }
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
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <table>
    <thead><tr><th style="width:40px;">#</th><th>Course Code</th><th style="width:100px; text-align:center;">Score (%)</th><th style="width:80px; text-align:center;">Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This document is auto-generated.</div>
</body></html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
    } catch (err) {
        alert("Error loading results: " + err.message);
    }
}

// ── EXAM CARD (using studentFetch) ─────────────────────────────────
async function checkExamCardReleased() {
    if (!localData) return;
    try {
        const { released } = await studentFetch('check-exam-card-released');
        const navBtn = document.getElementById('downloadExamCardNav');
        if (navBtn) navBtn.style.display = released ? 'flex' : 'none';
    } catch (e) {
        console.error("Exam card check error:", e);
        document.getElementById('downloadExamCardNav').style.display = 'none';
    }
}

async function downloadExamCardPDF() {
    if (!localData) return alert("Student data not loaded.");
    try {
        const { courses } = await studentFetch('get-exam-card-courses');
        if (!courses || courses.length === 0) {
            return alert("No courses found for your group. Contact the admin.");
        }
        const { schedules } = await studentFetch('get-exam-schedules');
        const scheduleMap = {};
        (schedules || []).forEach(s => {
            scheduleMap[(s.course_code || '').toUpperCase().trim()] = s;
        });

        const qrData = JSON.stringify({ matrix: localData.matrix, name: localData.name, dept: localData.dept, level: localData.level, semester: localData.semester });
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}&margin=0`;

        const rows = courses.map((c, i) => {
            const sched = scheduleMap[c] || {};
            const dateStr = sched.exam_date ? new Date(sched.exam_date).toLocaleDateString('en-GB', { weekday:'short', day:'2-digit', month:'short', year:'numeric' }) : '____________';
            const timeStr = sched.exam_time ? sched.exam_time.substring(0,5) : '____________';
            const venue = sched.venue ? sanitise(sched.venue) : '____________';
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
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#0f5132; color:white; }
  th { padding:9px 10px; text-align:left; font-size:0.75rem; letter-spacing:0.4px; }
  td { border:1px solid #ddd; padding:9px 10px; }
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
      <h1>🎓 BRAINS AI — STUDENT EXAM CARD</h1>
      <p>Official CBT Examination Hall Ticket &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
      <p style="margin-top:4px; color:#0f5132; font-size:0.7rem; font-weight:bold;">Academic Session: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
    </div>
    <div class="qr-block"><img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'"><small>Scan to verify</small></div>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <div class="notice">⚠️ <strong>Instructions:</strong> Present this card at the examination hall entrance along with your valid student ID. The CBT access token for each course will be shown on your dashboard when the gate is open. You may only sit for courses listed below. This card is <strong>non-transferable</strong>.</div>
  <tr><thead><tr><th>#</th><th>Course Code</th><th>Date</th><th>Time</th><th>Venue</th><th>Invigilator Signature</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="sign-section"><div class="sign-box"><div class="sign-line"></div><p>Exam Officer Signature &amp; Date</p></div><div class="sign-box"><div class="sign-line"></div><p>HOD / Dean Signature &amp; Date</p></div></div>
  <div class="stamp-box">OFFICIAL STAMP / SEAL</div>
  <div class="footer">BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This card is non-transferable.</div>
</body></html>`;

        const win = window.open('', '_blank');
        win.document.write(printHTML);
        win.document.close();
        win.onload = () => win.print();
    } catch (err) {
        alert("Error generating exam card: " + err.message);
    }
}

// ── SCHEDULED EXAM CARD (using studentFetch) ────────────────────────
async function checkScheduledExamCardReleased() {
    if (!localData) return;
    try {
        const { released } = await studentFetch('check-scheduled-exam-released');
        const btn = document.getElementById('downloadScheduledExamCardNav');
        if (btn) btn.style.display = released ? 'flex' : 'none';
    } catch (e) {
        console.error("Scheduled exam card check error:", e);
        const btn = document.getElementById('downloadScheduledExamCardNav');
        if (btn) btn.style.display = 'none';
    }
}

async function downloadScheduledExamCardPDF() {
    if (!localData) return alert("Student data not loaded.");
    try {
        const { schedules } = await studentFetch('get-exam-schedules');
        if (!schedules || schedules.length === 0) {
            alert("No exam schedule found for your group. Contact the admin.");
            return;
        }
        const qrData = JSON.stringify({ matrix: localData.matrix, name: localData.name, dept: localData.dept, level: localData.level, semester: localData.semester });
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
            </tr>`;
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
      <p style="margin-top:4px; color:#0f5132; font-size:0.7rem; font-weight:bold;">Academic Session: ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
    </div>
    <div class="qr-block"><img src="${qrCodeUrl}" alt="QR Code" onerror="this.style.display='none'"><small>Scan to verify</small></div>
  </div>
  <div class="info-box">
    <div class="info-item"><label>Full Name</label><span>${localData.name}</span></div>
    <div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div>
    <div class="info-item"><label>Faculty</label><span>${localData.faculty || 'N/A'}</span></div>
    <div class="info-item"><label>Department</label><span>${localData.dept}</span></div>
    <div class="info-item"><label>Level</label><span>${localData.level}L</span></div>
    <div class="info-item"><label>Semester</label><span>${localData.semester} Semester</span></div>
  </div>
  <div class="notice">⚠️ <strong>Instructions:</strong> Present this card at the examination hall entrance with your valid student ID. This card is <strong>non-transferable</strong>. Ensure you arrive at least 15 minutes before your exam time.</div>
  <table><thead><tr><th style="width:36px;">#</th><th>Course Code</th><th>Date</th><th>Time</th><th>Venue</th><th style="width:110px;">Invigilator Signature</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="sign-section"><div class="sign-box"><div class="sign-line"></div><p>Exam Officer Signature &amp; Date</p></div><div class="sign-box"><div class="sign-line"></div><p>HOD / Dean Signature &amp; Date</p></div></div>
  <div class="stamp-box">OFFICIAL STAMP / SEAL</div>
  <div class="footer">BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} &nbsp;|&nbsp; POWERED BY MU'UJIZA DATA &nbsp;|&nbsp; This card is non-transferable and must be presented at every examination sitting.</div>
</body></html>`;

        const win = window.open('', '_blank');
        win.document.write(printHTML);
        win.document.close();
        win.onload = () => win.print();
    } catch (err) {
        alert("Error loading exam schedule: " + err.message);
    }
}

// ── ASSIGNMENT FUNCTIONS (using studentFetch) ──────────────────────
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
    msg.style.color = '';
    msg.innerText = '';

    try {
        await studentFetch('submit-assignment', { course_code: course, title, content });
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
    try {
        const { assignments } = await studentFetch('get-my-assignments');
        if (!assignments || assignments.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0; text-align:center;">No assignments submitted yet.</p>';
            return;
        }
        listDiv.innerHTML = assignments.map(a => {
            const isGraded = a.status === 'graded';
            const scoreText = isGraded ? `<span style="color:#0f5132; font-weight:bold; font-size:1.1rem;">${a.score} / ${a.max_score}</span>` : `<span style="color:#f59e0b; font-weight:bold;">Pending</span>`;
            const feedbackText = a.feedback ? `<p style="color:#555; font-size:0.85rem; margin-top:6px; border-left:3px solid #00ff88; padding-left:8px;">💬 ${sanitise(a.feedback)}</p>` : '';
            const deleteBtn = isGraded ? `<button data-id="${a.id}" class="delete-assign-btn" style="background:#ff4444; color:white; border:none; padding:4px 10px; border-radius:4px; cursor:pointer; font-size:0.75rem; margin-left:8px;">🗑️</button>` : '';
            return `
                <div style="padding:14px; margin-bottom:10px; border-radius:8px; border-left:5px solid ${isGraded ? '#00ff88' : '#f59e0b'}; background:#f8fdf9;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div><strong style="color:#0f5132;">${sanitise(a.course_code)}</strong> <span style="color:#666; font-size:0.85rem; margin-left:8px;">${sanitise(a.title)}</span></div>
                        <div style="display:flex; align-items:center;">${scoreText} ${deleteBtn}</div>
                    </div>
                    ${feedbackText}
                    <small style="color:#a0aec0;">Submitted: ${new Date(a.submitted_at).toLocaleDateString()}</small>
                </div>
            `;
        }).join('');
    } catch (err) {
        listDiv.innerHTML = '<p style="color:red;">Error loading assignments.</p>';
    }
}

async function deleteStudentAssignment(id) {
    if (!confirm('Delete this graded assignment? This cannot be undone.')) return;
    try {
        await studentFetch('delete-assignment', { assignmentId: id });
        loadMyAssignments();
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}