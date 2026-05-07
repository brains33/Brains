
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

let localData = null;
let allMaterials = [];
let studentApi = null;
let proctorInterval;

// ── AUTH GUARD (moved from inline script) ──────────────────────────
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
            dept: real.department.toUpperCase().trim(),
            level: real.level,
            semester: real.semester,
            deviceId: deviceId
        };
        sessionStorage.setItem('student_data', JSON.stringify(studentPackage));
        localData = studentPackage;

        // Display student details
        document.getElementById('welcomeText').innerText = `Welcome, ${localData.name.split(' ')[0]}!`;
        document.getElementById('dspName').innerText = localData.name;
        document.getElementById('dspMatrix').innerText = localData.matrix;
        document.getElementById('sideMatrix').innerText = localData.matrix;
        document.getElementById('dspFaculty').innerText = localData.faculty || "N/A";
        document.getElementById('dspDept').innerText = localData.dept || "N/A";
        document.getElementById('dspLevelSem').innerText = `${localData.level}L | ${localData.semester}`;

        // Start core functions
        fetchExams();
       
fetchCarryoverExams();  
        syncGatekeeper();
        checkResultsReleased();
        setInterval(syncGatekeeper, 5000);
        setInterval(checkSession, 15000);
        setInterval(checkResultsReleased, 30000);
        syncClassroom();
        setInterval(syncClassroom, 60000);
        checkForLiveClass();
        setInterval(checkForLiveClass, 30000);

        // Attach event listeners after DOM is ready
        bindDashboardEvents();
        loadMyAssignments();
        setInterval(loadMyAssignments, 60000);

    } catch (e) {
        console.error("Token Verification Error:", e);
        sessionStorage.clear();
        window.location.replace("student_login.html");
    }
};

// ── EVENT BINDING ──────────────────────────────────────────────────
function bindDashboardEvents() {
    // Sidebar navigation
    document.getElementById('downloadResultsNav')?.addEventListener('click', downloadResultsPDF);
    document.getElementById('navAiLink')?.addEventListener('click', () => window.location.href = 'AI11.html');
    document.getElementById('navLogout')?.addEventListener('click', logout);
    document.getElementById('navPracticeLink')?.addEventListener('click', () => window.location.href = 'practice.html');
    document.getElementById('navAssignments')?.addEventListener('click', () => {
        document.querySelector('.card:nth-child(5)')?.scrollIntoView({ behavior: 'smooth' });
    });

    // Start exam button
    document.getElementById('startExamBtn')?.addEventListener('click', verifyAndStart);

    // Course search in resources
    document.getElementById('courseSearch')?.addEventListener('keyup', filterMaterials);

    // Join live class
    document.getElementById('joinClassBtn')?.addEventListener('click', joinClass);

    // Close note modal
    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        document.getElementById('noteModal').style.display = 'none';
    });

    // Resource list delegation (open buttons)
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

    // Exam list delegation (SELECT buttons)
    const subjectList = document.getElementById('subjectList');
    if (subjectList) {
        subjectList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn || btn.disabled) return;
            const course = btn.getAttribute('data-course');
            if (course) selectExam(course);
        });
    }

    // Assignment submit button
    document.getElementById('submitAssignmentBtn')?.addEventListener('click', submitAssignment);

    // Assignment list delegation (delete buttons)
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

// ── CORE FUNCTIONS ─────────────────────────────────────────────────

async function fetchExams() {
    const listDiv = document.getElementById("subjectList");
    if (!localData) return;

    try {
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
        if (!exams || exams.length === 0) {
            listDiv.innerHTML = "<p style='color:gray;'>No exams found for your department.</p>";
            return;
        }

        const uniqueCourses = [...new Set(exams.map(e => e.course.toUpperCase().trim()))];

        listDiv.innerHTML = uniqueCourses.map(course => {
            const isTaken = finishedSubjects.includes(course);
            const safeCourse = sanitise(course);
            const btnHtml = isTaken
                ? `<button disabled style="background:#eeeeee; color:#aaaaaa; border:none; padding:8px 15px; border-radius:5px; font-weight:bold;">BIT-TAWFEEQ</button>`
                : `<button data-course="${safeCourse}" style="background:#0f5132; color:#00ff88; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-weight:bold;">SELECT</button>`;
            return `
                <div class="exam-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px; background:white; border-radius:8px; border-left: 5px solid ${isTaken ? '#ff4444' : '#00ff88'}">
                    <b style="color: ${isTaken ? '#999' : '#333'}">${safeCourse} ${isTaken ? '(SUBMITTED)' : ''}</b>
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
    alert(`Course ${course} selected! Now enter your token.`);
    document.getElementById('examToken').focus();
}

async function verifyAndStart() {
    const activeSub = sessionStorage.getItem('activeSubject');
    const student = JSON.parse(sessionStorage.getItem('student_data'));
    const tokenInput = document.getElementById('examToken').value.trim();

    if (!activeSub || activeSub === "null") return alert("❌ Please select a course first.");

    try {
        // Check if the student already has a result for this course
        const { data: existingResult, error: resultErr } = await sb
            .from('results')
            .select('id, score')
            .eq('matrix_no', student.matrix)
            .or(`subject.eq.${activeSub},course.eq.${activeSub}`)
            .maybeSingle();

        if (resultErr) throw resultErr;

        // If a result exists AND its score is >= 50, block access (they already passed)
        if (existingResult && parseFloat(existingResult.score) >= 50) {
            return alert(`⛔ ACCESS DENIED: ${student.name.split(' ')[0]}, you have already passed ${activeSub} with ${existingResult.score}%.`);
        }

        // Try regular session first (matching level & semester)
        let { data: session, error } = await sb.from('exam_sessions')
            .select('*')
            .eq('token_code', tokenInput)
            .eq('department', student.dept)
            .eq('level', student.level)
            .eq('semester', student.semester)
            .eq('is_carryover', false )
            .maybeSingle();

        // If no regular session found, try a carryover session (only needs token + department match)
        if (!session && (!error || error.code === 'PGRST116')) {
            const { data: carrySession } = await sb.from('exam_sessions')
                .select('*')
                .eq('token_code', tokenInput)
                .eq('department', student.dept)
                .eq('is_carryover', true)
                .maybeSingle();
            if (carrySession) session = carrySession;
        }

        if (error && !session) return alert("❌ Invalid Token. This token does not belong to your department, level or semester.");
        if (!session) return alert("❌ Invalid Token. No matching exam session found.");

        const now = new Date().getTime();
        const endTime = new Date(session.end_time).getTime();
        if (session.is_active !== "true") return alert("⛔ The Gate is CLOSED by the Admin.");
        if (now > endTime) return alert("⏰ Time Expired. Entry locked.");

        // Save the session end time so the exam page can use it (works for both regular & carryover)
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
            .select('token_code, is_active, end_time')
            .eq('department', localData.dept)
            .eq('level', localData.level)
            .eq('semester', localData.semester)
            .eq('is_carryover', false)          // ← add this line
            .maybeSingle();

        const gateBadge    = document.getElementById('gateBadge');
        const displayToken = document.getElementById('displayToken');
        if (error || !data) {
            gateBadge.innerText = "NO SESSION"; gateBadge.style.background = "#555"; gateBadge.style.color = "white";
            displayToken.innerText = "----";
            return;
        }

        const now = new Date().getTime();
        const endTime = new Date(data.end_time).getTime();
        const isOpen = data.is_active === "true" && now < endTime;

        if (data.is_active === "true" && now >= endTime) {
            await sb.from('exam_sessions').update({ is_active: "false" })
                .eq('department', localData.dept).eq('level', localData.level).eq('semester', localData.semester);
        }

        if (isOpen) {
            gateBadge.innerText = "GATE OPEN"; gateBadge.style.background = "#00ff88"; gateBadge.style.color = "#0f5132";
            displayToken.innerText = data.token_code;
        } else {
            gateBadge.innerText = "GATE CLOSED"; gateBadge.style.background = "#ff4444"; gateBadge.style.color = "white";
            displayToken.innerText = "----";
        }
    } catch (e) { console.error("Gate Sync Error:", e); }
}

async function checkSession() {
    if (!localData) return;
    const { data } = await sb.from('students').select('current_device_id').eq('matrix_no', localData.matrix).single();
    if (data && data.current_device_id !== localData.deviceId) { alert("Session active on another device."); logout(); }
}

// ── CARRYOVER / RESIT EXAMS ────────────────────────────────────────
async function fetchCarryoverExams() {
    const listDiv = document.getElementById('carryoverSubjectList');
    if (!listDiv || !localData) return;

    try {
        // 1. Fetch all active carryover sessions for this student's department
        const { data: sessions, error } = await sb
            .from('exam_sessions')
            .select('*')
            .eq('is_carryover', true)
            .eq('is_active', 'true')                // only when the gate is open
            .eq('department', localData.dept)
            .order('carryover_course', { ascending: true });

        if (error) throw error;
        if (!sessions || sessions.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available right now.</p>';
            return;
        }

        // 2. Determine which courses the student has already PASSED (score ≥ 50)
        const { data: results, error: resErr } = await sb
            .from('results')
            .select('subject, score')
            .eq('matrix_no', localData.matrix);

        if (resErr) throw resErr;

        const passedCourses = new Set();
        (results || []).forEach(r => {
            const score = parseFloat(r.score);
            const course = (r.subject || '').toUpperCase().trim();
            if (!isNaN(score) && score >= 50) {
                passedCourses.add(course);
            }
        });

        // 3. A session is eligible only if its course is NOT already passed
        const eligible = sessions.filter(s => {
            const courseCode = (s.carryover_course || '').toUpperCase().trim();
            return !passedCourses.has(courseCode);
        });

        if (eligible.length === 0) {
            listDiv.innerHTML = '<p style="color:#a0aec0;">No carryover exams available for you.</p>';
            return;
        }

        // 4. Render the list
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

        // 5. Bind click events to the SELECT buttons
        document.querySelectorAll('.select-carryover-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const course  = btn.getAttribute('data-course');
                const token   = btn.getAttribute('data-token');
                const origLvl = btn.getAttribute('data-orig-level');
                const origSem = btn.getAttribute('data-orig-sem');

                // Store carryover context for the exam page
                sessionStorage.setItem('activeSubject', course);
                sessionStorage.setItem('examSessionType', 'carryover');
                sessionStorage.setItem('carryoverOriginalLevel', origLvl);
                sessionStorage.setItem('carryoverOriginalSemester', origSem);

                // Pre‑fill the token field and notify the student
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

// ── RESOURCES ──────────────────────────────────────────────────────
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

// ── LIVE CLASS ──────────────────────────────────────────────────────
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

// ── RESULTS ─────────────────────────────────────────────────────────
async function checkResultsReleased() {
    if (!localData) return;
    try {
        const { data } = await sb.from('admin_settings').select('results_config').eq('id', 1).maybeSingle();
        const navBtn = document.getElementById('downloadResultsNav');
        if (!navBtn) return;
        if (data && data.results_config) {
            const key = `${localData.dept.trim().toUpperCase()}_${localData.level}_${localData.semester}`;
            navBtn.style.display = data.results_config[key] === true ? 'flex' : 'none';
        } else navBtn.style.display = 'none';
    } catch (e) { console.error(e); }
}

async function downloadResultsPDF() {
    if (!localData) return alert("Student data not loaded.");
    const { data: results, error } = await sb.from('results').select('*').eq('matrix_no', localData.matrix).order('created_at', { ascending: true });
    if (error || !results || results.length === 0) return alert("No results yet.");
    const rows = results.map((r, i) => `<tr style="background:${i%2===0?'#f9f9f9':'#fff'}"><td>${i+1}</td><td>${(r.subject||r.course||'N/A').toUpperCase()}</td><td style="color:${(r.score||0)>=50?'#0f5132':'#cc0000'}">${r.score??'N/A'}</td><td style="color:${(r.score||0)>=50?'#0f5132':'#cc0000'}">${(r.score||0)>=50?'PASS':'FAIL'}</td></tr>`).join('');
    const printHTML = `<!DOCTYPE html><html><head><title>Result Slip - ${localData.name}</title><style>body{font-family:Arial;padding:30px;color:#111}h1{color:#0f5132;text-align:center}.info-box{border:1px solid #ccc;padding:15px;border-radius:8px;margin-bottom:25px}.info-row{display:flex;gap:30px;flex-wrap:wrap}.info-item{flex:1;min-width:150px}.info-item label{font-size:0.75em;color:#777}table{width:100%;border-collapse:collapse}th{background:#0f5132;color:white;padding:12px;text-align:left}td{border:1px solid #ddd;padding:10px}.footer{margin-top:30px;text-align:center;font-size:0.75em;color:#aaa}</style></head><body><h1>🎓 BRAINS AI — OFFICIAL RESULT SLIP</h1><p style="text-align:center">Academic Result Record — POWERED BY MU'UJIZA DATA</p><div class="info-box"><div class="info-row"><div class="info-item"><label>Full Name</label><span>${localData.name}</span></div><div class="info-item"><label>Matrix Number</label><span>${localData.matrix}</span></div><div class="info-item"><label>Department</label><span>${localData.dept}</span></div><div class="info-item"><label>Faculty</label><span>${localData.faculty||'N/A'}</span></div><div class="info-item"><label>Level / Semester</label><span>${localData.level}L | ${localData.semester} Semester</span></div><div class="info-item"><label>Date Generated</label><span>${new Date().toLocaleDateString()}</span></div></div></div><table><thead><tr><th>#</th><th>Course Code</th><th>Score (%)</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><div class="footer">BRAINS AI CBT SYSTEM © ${new Date().getFullYear()}</div></body></html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
}

// ── ASSIGNMENT FUNCTIONS ──────────────────────────────────────────
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
    if (error) {
        alert('Delete failed: ' + error.message);
    } else {
        loadMyAssignments();
    }
}