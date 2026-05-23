// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
// ─────────────────────────────────────────────────────────────────────

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


const ADMIN_PROXY_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/admin-proxy';
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: { headers: { 'x-admin-token': sessionStorage.getItem('adminToken') || '' } }
});


// ── CSP‑COMPLIANT AUTH GUARD (Custom Token) ─────────────────────────
(async function() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") { window.location.replace("index.html"); return; }
    const token = sessionStorage.getItem("adminToken");
    if (!token) { window.location.replace("index.html"); return; }
    const { data: isValid, error } = await sb.rpc('verify_admin_token', { submitted_token: token });
    if (error || !isValid) { sessionStorage.clear(); window.location.replace("index.html"); }
})();
// ... rest of admin.js stays exactly the same ...

// Logout function (update)
window.adminLogout = async function() {
    const token = sessionStorage.getItem("adminToken");
    if (token) {
        await sb.from('admin_settings')
            .update({ session_token: null, session_expires_at: null })
            .eq('session_token', token);
    }
    sessionStorage.clear();
    window.location.replace("index.html");
};
// ── CORE NAVIGATION ──────────────────────────────────────────────────
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
}
function showSection(name) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    const t = document.getElementById('sec-' + name);
    if (t) t.classList.add('active');

    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.nav-link[data-section]').forEach(n => {
        if (n.getAttribute('data-section') === name) n.classList.add('active');
    });

    // Single titles object containing ALL sections (including recyclebin)
    const titles = {
        dashboard: 'Dashboard',
        gatekeeper: 'Gatekeeper',
        questions: 'Questions',
        results: 'Results',
        release: 'Release Results',
        students: 'Students',
        promotion: 'Session Promotion',
        aifeed: 'AI Brain Feed',
        markadjust: 'Mark Adjustment',
        carryover: 'Carryover Exams',
        recyclebin: 'Recycle Bin'
    };

    document.getElementById('topbarTitle').textContent = titles[name] || 'BRAINS AI';

    // Load recycle bin data when switching to that section
    if (name === 'recyclebin') loadRecycleBin();

    if (window.innerWidth < 900) closeSidebar();
}
async function loadStats() {
    try {
        const [s,q,r,l] = await Promise.all([
            sb.from('students').select('*',{count:'exact',head:true}),
            sb.from('questions').select('*',{count:'exact',head:true}),
            sb.from('results').select('*',{count:'exact',head:true}),
            sb.from('live_monitoring').select('*',{count:'exact',head:true})
        ]);
        ['statStudents','d-students'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent = s.count??'—'; });
        ['statQuestions','d-questions'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent = q.count??'—'; });
        ['statResults','d-results'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent = r.count??'—'; });
        const dl = document.getElementById('d-live'); if(dl) dl.textContent = l.count??'—';
    } catch(e) { console.error('Stats:',e); }
}

// ── EVENT BINDING (replaces all inline onclick/onchange) ──────────
function bindEvents() {
    document.getElementById('topbarMenuBtn')?.addEventListener('click', toggleSidebar);
    document.getElementById('sidebarCloseBtn')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);
    document.getElementById('coFaculty')?.addEventListener('change', updateCarryoverDepartments);
document.getElementById('coGenerateTokenBtn')?.addEventListener('click', createCarryoverSession);
document.getElementById('coToggleGateBtn')?.addEventListener('click', toggleCarryoverGate);
document.getElementById('coForceLogoutBtn')?.addEventListener('click', forceLogoutCarryover);
document.getElementById('coStartExamBtn')?.addEventListener('click', startCarryoverExam);

    document.getElementById('sidebarNav')?.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (!link) return;
        if (link.getAttribute('href') && link.getAttribute('href') !== '#') return;
        e.preventDefault();
        const section = link.getAttribute('data-section');
        if (section) showSection(section);
    });
    document.getElementById('resultFilterFaculty')?.addEventListener('change', updateResultFilterDepartments);
document.getElementById('resultFilterDept')?.addEventListener('change', () => { fetchFreshData(); }); // already calls render
document.getElementById('resultFilterLevel')?.addEventListener('change', () => { fetchFreshData(); });
document.getElementById('resultFilterSemester')?.addEventListener('change', () => { fetchFreshData(); });
document.getElementById('fullProctorGrid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.kick-btn');
    if (!btn) return;
    const matrix = btn.getAttribute('data-matrix');
    const name   = btn.getAttribute('data-name');
    if (matrix) kickStudent(matrix, name);   // calls the existing function
});

    document.getElementById('liveMonitorLink')?.addEventListener('click', (e) => { e.preventDefault(); openProctorPanel(); });
    document.getElementById('logoutLink')?.addEventListener('click', (e) => { e.preventDefault(); adminLogout(); });

    document.querySelectorAll('.quick-btn[data-section]').forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.getAttribute('data-section')));
    });
    
    document.getElementById('rbFaculty')?.addEventListener('change', updateRBFilterDepartments);
document.getElementById('rbDept')?.addEventListener('change', loadRecycleBin);
document.getElementById('rbLevel')?.addEventListener('change', loadRecycleBin);
document.getElementById('rbSemester')?.addEventListener('change', loadRecycleBin);
document.getElementById('rbSearch')?.addEventListener('input', loadRecycleBin);
document.getElementById('rbWipeAllBtn')?.addEventListener('click', wipeAllBin);
    document.getElementById('quickLiveMonitor')?.addEventListener('click', openProctorPanel);

    document.getElementById('wipeSnapshotsBtn')?.addEventListener('click', clearMonitoringTable);
    document.getElementById('closeProctorPanelBtn')?.addEventListener('click', closeProctorPanel);

    document.getElementById('startExamBtn')?.addEventListener('click', startExam);
    document.getElementById('generateTokenBtn')?.addEventListener('click', createExamSession);
    document.getElementById('gateBtn')?.addEventListener('click', toggleGate);
    document.getElementById('gateFaculty')?.addEventListener('change', updateGateDepartments);
    document.getElementById('forceLogoutAllBtn')?.addEventListener('click', forceLogoutAll);

    document.getElementById('submitBtn')?.addEventListener('click', saveQuestions);
    document.getElementById('cancelBtn')?.addEventListener('click', resetForm);
    document.getElementById('q_faculty')?.addEventListener('change', updateSingleDepartments);
    document.getElementById('bulk_faculty')?.addEventListener('change', updateBulkDepartments);
    document.getElementById('bulkUploadBtn')?.addEventListener('click', processBulk);
    document.getElementById('wipeAllBtn')?.addEventListener('click', wipeAllQuestions);
    document.getElementById('qSearch')?.addEventListener('input', loadList);

    document.getElementById('exportCourseCsvBtn')?.addEventListener('click', exportCourseCSV);
    document.getElementById('printCoursePdfBtn')?.addEventListener('click', printCoursePDF);
    document.getElementById('deleteAllResultsBtn')?.addEventListener('click', deleteAllResults);
    document.getElementById('exportMasterCsvBtn')?.addEventListener('click', exportMasterCSV);
    document.getElementById('printMasterPdfBtn')?.addEventListener('click', printMasterPDF);
    document.getElementById('courseSearchInput')?.addEventListener('input', renderResultsUI);
    document.getElementById('masterSearchInput')?.addEventListener('input', renderMasterUI);

    document.getElementById('releaseFaculty')?.addEventListener('change', updateReleaseDepartments);
    document.getElementById('releaseResultsBtn')?.addEventListener('click', releaseResults);
    document.getElementById('hideResultsBtn')?.addEventListener('click', rejectResults);

    document.getElementById('regFaculty')?.addEventListener('change', updateAdminDepartments);
    document.getElementById('regSubmitBtn')?.addEventListener('click', registerUser);
    document.getElementById('userSearch')?.addEventListener('input', loadUsers);
    document.getElementById('chartFilterFaculty')?.addEventListener('change', updateChartFilterDepartments);
document.getElementById('chartFilterDept')?.addEventListener('change', renderDashboardChart);
document.getElementById('chartFilterLevel')?.addEventListener('change', renderDashboardChart);
document.getElementById('chartFilterSemester')?.addEventListener('change', renderDashboardChart);
document.getElementById('chartFilterCourse')?.addEventListener('input', renderDashboardChart);

    document.getElementById('promoteFaculty')?.addEventListener('change', updatePromotionDepartments);
    document.getElementById('promoteBtn')?.addEventListener('click', promoteTargetedStudents);

    document.getElementById('syncAIBtn')?.addEventListener('click', syncHandout);
    document.getElementById('ma-faculty')?.addEventListener('change', updateMarkAdjustDepartments);
document.getElementById('ma-applyBtn')?.addEventListener('click', applyMarkAdjustment);

    // Delegate user list buttons (Edit, Reset PW, Approve, Revoke, Delete)
    document.getElementById('userList')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const studentId = btn.getAttribute('data-student-id');
        const studentName = btn.getAttribute('data-student-name');
        if (btn.classList.contains('edit-btn')) openEditModal(studentId);
        else if (btn.classList.contains('reset-pw-btn')) adminResetPassword(studentId, studentName);
        else if (btn.classList.contains('approve-btn')) approveStudent(studentId);
        else if (btn.classList.contains('revoke-btn')) revokeStudent(studentId);
        else if (btn.classList.contains('delete-btn')) deleteStudent(studentId);
    });
    
    document.getElementById('rbList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const binId = btn.getAttribute('data-bin-id');
    if (btn.classList.contains('restore-btn')) restoreFromBin(binId);
    else if (btn.classList.contains('perm-delete-btn')) permanentDeleteBin(binId);
});
    

    // Delegate question list buttons (Edit, Delete)
    document.getElementById('qList')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const questionId = btn.getAttribute('data-question-id');
        if (btn.classList.contains('edit-q-btn')) prepareEdit(questionId);
        else if (btn.classList.contains('delete-q-btn')) deleteQuestion(questionId);
    });

    // Delegate result delete buttons — MOVED inside bindEvents() so allResults is
    // guaranteed to be declared before these listeners are registered.
    document.getElementById('adminResultsGrid')?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-result-btn');
        if (deleteBtn) {
            const id      = deleteBtn.getAttribute('data-result-id');
            const context = deleteBtn.getAttribute('data-context');
            if (id) deleteResult(id, context);
            return;
        }
        const saveBtn = e.target.closest('.save-score-btn');
        if (saveBtn) {
            const id = saveBtn.getAttribute('data-result-id');
            const input = document.querySelector(`#adminResultsGrid .score-input[data-result-id="${id}"]`);
            const newScore = parseInt(input?.value);
            if (!isNaN(newScore)) saveAdjustedScore(id, newScore);
        }
    });

    document.getElementById('masterRecordsGrid')?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-result-btn');
        if (deleteBtn) {
            const id      = deleteBtn.getAttribute('data-result-id');
            const context = deleteBtn.getAttribute('data-context');
            if (id) deleteResult(id, context);
            return;
        }
        const saveBtn = e.target.closest('.save-score-btn');
        if (saveBtn) {
            const id = saveBtn.getAttribute('data-result-id');
            const input = document.querySelector(`#masterRecordsGrid .score-input[data-result-id="${id}"]`);
            const newScore = parseInt(input?.value);
            if (!isNaN(newScore)) saveAdjustedScore(id, newScore);
        }
    });
}

function updateChartFilterDepartments() {
    const facName = document.getElementById('chartFilterFaculty').value;
    const deptSelect = document.getElementById('chartFilterDept');
    if (!facName) {
        deptSelect.innerHTML = '<option value="">-- All Departments --</option>';
        return;
    }
    const facObj = window.allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- All Departments --</option>' +
        filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}

function updateResultFilterDepartments() {
    const facName = document.getElementById('resultFilterFaculty').value;
    const deptSelect = document.getElementById('resultFilterDept');
    if (!facName) {
        deptSelect.innerHTML = '<option value="">-- All Departments --</option>';
        return;
    }
    const facObj = window.allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- All Departments --</option>' +
        filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}
// ── MASTER INIT ──────────────────────────────────────────────────────
window.onload = async () => {
    await initAdminUserPage();
    await initQuestionPage();
    await fetchFreshData();
    await fetchInitialData();
    setInterval(fetchFreshData, 30000);
    bindEvents();
    loadStats();
    setTimeout(() => { renderDashboardChart(); }, 500);  // small delay to ensure all DOM is ready
};


// ── AI BRAIN FEED ────────────────────────────────────────────────────
async function syncHandout() {
    const code = document.getElementById('feedCourse').value.toUpperCase().trim();
    const body = document.getElementById('feedText').value.trim();
    const btn  = document.getElementById('syncAIBtn');
    if (!code || !body) return alert("⚠️ Fill in both Course Code and Handout Text!");
    if (btn) { btn.disabled = true; btn.textContent = "Syncing..."; }
    try {
        const { error } = await sb.from('course_knowledge').upsert({ course_code: code, content: body }, { onConflict: 'course_code' });
        if (error) throw error;
        alert("✅ AI Brain updated! Course: " + sanitise(code));
        document.getElementById('feedCourse').value = '';
        document.getElementById('feedText').value   = '';

    } catch (err) {
        alert("❌ Sync failed: " + err.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = "🧠 SYNC TO AI BRAIN"; }
    }
}



// ── QUESTION MANAGEMENT (single question save + reset) ──────────────
async function saveQuestions() {
    const btn = document.getElementById('submitBtn');
    const questionData = {
        "questions": document.getElementById('q').value.trim(),
        "Option 1": document.getElementById('o1').value.trim(),
        "Option 2": document.getElementById('o2').value.trim(),
        "Option 3": document.getElementById('o3').value.trim(),
        "Option 4": document.getElementById('o4').value.trim(),
        "answer": parseInt(document.getElementById('ans').value),
        "course": document.getElementById('q_course').value.trim().toUpperCase(),
        "level": document.getElementById('q_level').value,
        "semester": document.getElementById('q_semester').value,
        "department": document.getElementById('q_dept').value.trim().toUpperCase(),
        "faculty": document.getElementById('q_faculty').value.trim().toUpperCase()
    };
    if (!questionData.questions || !questionData.course || isNaN(questionData.answer)) return alert("Please fill all required fields.");
    btn.disabled = true; btn.textContent = "Uploading...";
    try {
        const { error } = await sb.from('questions').insert([questionData]);
        if (error) throw error;
        alert("Questions Uploaded Successfully!");
        if (typeof resetForm === "function") resetForm();
    } catch (err) {
        alert("Upload failed: " + err.message);
    } finally {
        btn.disabled = false; btn.textContent = "UPLOAD TO DATABASE";
    }
}

function resetForm() {
    document.getElementById('q').value = "";
    document.getElementById('o1').value = "";
    document.getElementById('o2').value = "";
    document.getElementById('o3').value = "";
    document.getElementById('o4').value = "";
    document.getElementById('ans').value = "";
}

// ── Gate department dropdown ────────────────────────────────────────
function updateGateDepartments() {
    const facultyName = document.getElementById('gateFaculty').value;
    const deptSelect  = document.getElementById('gateDept');
    if (!deptSelect) return;
    if (!facultyName) { deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facObj   = window.allFaculties.find(f => f.name === facultyName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' +
        filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}

// ── CREATE EXAM SESSION ─────────────────────────────────────────────
async function createExamSession() {
    const faculty  = document.getElementById('gateFaculty').value;
    const dept     = document.getElementById('gateDept').value;
    const level    = document.getElementById('gateLevel').value;
    const semester = document.getElementById('adminSemesterSelect').value;
    const course   = document.getElementById('gateCourse').value.trim().toUpperCase();
    if (!faculty || !dept || !level || !semester) return alert("⚠️ Please select Faculty, Department, Level and Semester first.");
    if (!course) return alert("⚠️ Please enter a Course Code before generating a token.");

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newToken = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => chars[b % chars.length]).join('');
    const endTime  = new Date(); endTime.setMinutes(endTime.getMinutes() + 60);

    try {
        // Find existing session matching ALL four identifying columns
        const { data: existing } = await sb.from('exam_sessions')
            .select('id')
            .eq('department', dept)
            .eq('level',      level)
            .eq('semester',   semester)
            .eq('course',     course)
            .eq('is_carryover', false)
            .maybeSingle();

        let error;
        if (existing) {
            // Row exists — just update the token and time
            ({ error } = await sb.from('exam_sessions')
                .update({
                    token_code: newToken,
                    is_active:  "false",
                    faculty,
                    end_time:   endTime.toISOString()
                })
                .eq('id', existing.id));
        } else {
            // No row yet — insert fresh
            ({ error } = await sb.from('exam_sessions')
                .insert({
                    faculty,
                    department:   dept,
                    level,
                    semester,
                    course,
                    is_carryover: false,
                    token_code:   newToken,
                    is_active:    "false",
                    end_time:     endTime.toISOString()
                }));
        }

        if (error) throw error;

        document.getElementById('activeTokenTop').textContent      = newToken;
        document.getElementById('activeTokenBottom').textContent   = newToken;
        document.getElementById('activeCourseDisplay').textContent = course;
        alert(`✅ Token ${newToken} → ${sanitise(course)} | ${sanitise(dept)} | ${sanitise(level)}L | ${sanitise(semester)} Semester`);
    } catch (err) {
        alert("Sync Error: " + err.message);
    }
}
// ── TOGGLE GATE ──────────────────────────────────────────────────────
async function toggleGate() {
    const statusText = document.getElementById('gateStatus');
    const gateBtn    = document.getElementById('gateBtn');
    const dept       = document.getElementById('gateDept').value;
    const level      = document.getElementById('gateLevel').value;
    const semester   = document.getElementById('adminSemesterSelect').value;
    const course     = document.getElementById('gateCourse').value.trim().toUpperCase();
    if (!dept || !level || !semester) return alert("⚠️ Select Faculty, Department, Level and Semester first.");
    if (!course) return alert("⚠️ Please enter a Course Code first.");
    const isOpening = statusText.textContent.includes("CLOSED");
    const { error } = await sb.from('exam_sessions')
        .update({ is_active: isOpening ? "true" : "false" })
        .eq('department', dept)
        .eq('level', level)
        .eq('semester', semester)
        .eq('course', course)
        .eq('is_carryover', false);

    if (!error) {
        statusText.textContent   = isOpening ? "EXAM GATE: OPEN" : "EXAM GATE: CLOSED";
        statusText.style.color   = isOpening ? "#00ff88" : "#ff4444";
        gateBtn.textContent      = isOpening ? "CLOSE GATE / LOCK LOGIN" : "OPEN GATE FOR LOGIN";
        gateBtn.style.background = isOpening ? "#ff4444" : "#00ff88";
        gateBtn.style.color      = isOpening ? "white" : "#0f5132";
    } else { alert("Gate Error: " + error.message); }
}

async function forceLogoutAll() {
    const faculty  = document.getElementById('gateFaculty').value;
    const dept     = document.getElementById('gateDept').value;
    const level    = document.getElementById('gateLevel').value;
    const semester = document.getElementById('adminSemesterSelect').value;
    const course   = document.getElementById('gateCourse').value.trim().toUpperCase();

    if (!faculty || !dept || !level || !semester) {
        alert("⚠️ Please select Faculty, Department, Level and Semester first.");
        return;
    }
    if (!course) {
        alert("⚠️ Please enter a Course Code first.");
        return;
    }

    const confirmMsg = `🚨 WARNING: This will immediately kick out ALL active students in:\n\nFaculty: ${faculty}\nDepartment: ${dept}\nLevel: ${level}L\nSemester: ${semester}\nCourse: ${course}\n\nTheir current answers will be LOST, and the exam gate will be CLOSED for this course. Proceed?`;
    if (!confirm(confirmMsg)) return;

    try {
        // 1. Get only ACTIVE students in live_monitoring for this group
        const { data: liveStudents, error: liveErr } = await sb
            .from('students')
            .select('matrix_no')
            .eq('faculty', faculty)
            .eq('department', dept)
            .eq('level', level)
            .eq('semester', semester);

        if (liveErr) throw liveErr;
        if (!liveStudents || liveStudents.length === 0) {
            alert("ℹ️ No students found in this group.");
            return;
        }

        const allMatrix = liveStudents.map(s => s.matrix_no);

        // 2. Only kick those who are currently ACTIVE in live_monitoring
        const { data: activeRows, error: activeErr } = await sb
            .from('live_monitoring')
            .select('matrix_no')
            .in('matrix_no', allMatrix)
            .eq('status', 'ACTIVE');

        if (activeErr) throw activeErr;

        const activeMatrix = activeRows?.map(r => r.matrix_no) || [];

        if (activeMatrix.length > 0) {
            const { error: kickErr } = await sb
                .from('live_monitoring')
                .update({ status: 'KICKED' })
                .in('matrix_no', activeMatrix);
            if (kickErr) throw kickErr;
        }

        // 3. Close the exam gate for this course – prevents re‑entry
        const { error: gateErr } = await sb
            .from('exam_sessions')
            .update({ is_active: 'false' })
            .eq('department', dept)
            .eq('level', level)
            .eq('semester', semester)
            .eq('course', course)
            .eq('is_carryover', false);

        if (gateErr) throw gateErr;

        // 4. Update UI and confirm
        document.getElementById('gateStatus').textContent = "EXAM GATE: CLOSED";
        document.getElementById('gateStatus').style.color = "#ff4444";
        document.getElementById('gateBtn').textContent = "OPEN GATE FOR LOGIN";
        document.getElementById('gateBtn').style.background = "#00ff88";
        document.getElementById('gateBtn').style.color = "#0f5132";
        document.getElementById('activeTokenTop').textContent = "---";
        document.getElementById('activeTokenBottom').textContent = "---";
        document.getElementById('activeCourseDisplay').textContent = "---";

        alert(`✅ Force logout successful!\n\n${activeMatrix.length} active student(s) kicked.\nThe gate is now CLOSED for ${course} | ${dept} ${level}L ${semester} Semester.`);

    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

// ── TIMER CONTROL ────────────────────────────────────────────────────
let countdownInterval = null;
async function startExam() {
    const mins     = parseInt(document.getElementById("duration").value);
    const dept     = document.getElementById('gateDept').value;
    const level    = document.getElementById('gateLevel').value;
    const semester = document.getElementById('adminSemesterSelect').value;
    const course   = document.getElementById('gateCourse').value.trim().toUpperCase();
    const token    = document.getElementById('activeTokenTop').textContent;
    if (!dept || !level || !semester) return alert("⚠️ Select Faculty, Department, Level and Semester in Gatekeeper first.");
    if (!course) return alert("⚠️ Please enter a Course Code first.");
    if (token === "---" || isNaN(mins) || mins <= 0) return alert("⚠️ Generate a token and enter a valid duration first.");
    const endTime = new Date(Date.now() + mins * 60000).toISOString();
    const { error } = await sb.from('exam_sessions')
        .update({ is_active: "true", end_time: endTime })
        .eq('department', dept)
        .eq('level', level)
        .eq('semester', semester)
        .eq('course', course)
        .eq('is_carryover', false);
    if (error) { alert("DB Error: " + error.message); return; }
    document.getElementById('gateStatus').textContent = "EXAM GATE: OPEN";
    document.getElementById('gateStatus').style.color = "#00ff88";
    document.getElementById('gateBtn').textContent = "CLOSE GATE / LOCK LOGIN";
    document.getElementById('gateBtn').style.background = "#ff4444";
    document.getElementById('gateBtn').style.color = "white";
    alert(`✅ Exam started for ${sanitise(course)} | ${sanitise(dept)} ${sanitise(level)}L | ${sanitise(semester)} Semester!`);
    runVisualTimer(mins * 60, dept, level, semester, course);
}
function runVisualTimer(totalSeconds, dept, level, semester, course) {
    clearInterval(countdownInterval);
    const timerDisplay = document.getElementById('timerDisplay');
    countdownInterval = setInterval(async () => {
        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            if (timerDisplay) timerDisplay.textContent = "00:00";
            await autoCloseGate(dept, level, semester, course);
            return;
        }
        const m = Math.floor(totalSeconds / 60), s = totalSeconds % 60;
        if (timerDisplay) timerDisplay.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        totalSeconds--;
    }, 1000);
}
async function autoCloseGate(dept, level, semester, course) {
    await sb.from('exam_sessions')
        .update({ is_active: "false" })
        .eq('department', dept)
        .eq('level', level)
        .eq('semester', semester)
        .eq('course', course)
        .eq('is_carryover', false);

    document.getElementById('gateStatus').textContent = "EXAM GATE: CLOSED (EXPIRED)";
    document.getElementById('gateStatus').style.color = "#ff4444";
    document.getElementById('gateBtn').textContent = "OPEN GATE FOR LOGIN";
    document.getElementById('gateBtn').style.background = "#00ff88";
    document.getElementById('gateBtn').style.color = "#0f5132";
    document.getElementById('activeTokenTop').textContent = "---";
    document.getElementById('activeTokenBottom').textContent = "---";
    document.getElementById('activeCourseDisplay').textContent = "---";
}

// ── DATA MAPS & INITIALIZATION ──────────────────────────────────────
let editingStudentId = null;
const LEVEL_OPTIONS = ["100","200","300","400","500","600","700","800","900","1000"];
const SEMESTER_OPTIONS = ["1st","2nd"];

async function initAdminUserPage() {
    console.log("Syncing with BRAINS AI Database...");
    try {
        const { data: fData, error: fErr } = await sb.from('faculties').select('*').order('name');
        const { data: dData, error: dErr } = await sb.from('departments').select('*').order('name');
        if (fErr || dErr) throw new Error("Database connection failed");
        window.allFaculties = fData || [];
        window.allDepartments = dData || [];
const rbFacEl = document.getElementById('rbFaculty');
if (rbFacEl) rbFacEl.innerHTML = '<option value="">-- All Faculties --</option>' + window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');

const rbLevelEl = document.getElementById('rbLevel');
if (rbLevelEl) rbLevelEl.innerHTML = '<option value="">-- All Levels --</option>' + LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
        // -- existing dropdowns --
        const facSelect = document.getElementById('regFaculty');
        if (facSelect) facSelect.innerHTML = '<option value="">-- Select Faculty --</option>' + window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        const gateFacSelect = document.getElementById('gateFaculty');
        if (gateFacSelect) gateFacSelect.innerHTML = '<option value="">-- Select Faculty --</option>' + window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        const gateLevelEl = document.getElementById('gateLevel');
        if (gateLevelEl) gateLevelEl.innerHTML = '<option value="">-- Choose Level --</option>' + LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
        const relFacEl = document.getElementById('releaseFaculty');
        if (relFacEl) relFacEl.innerHTML = '<option value="">-- Select Faculty --</option>' + window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        const relLvlEl = document.getElementById('releaseLevel');
        if (relLvlEl) relLvlEl.innerHTML = '<option value="">-- Choose Level --</option>' + LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');

        // -- NEW: Result filter dropdowns --
        const rFilterFaculty = document.getElementById('resultFilterFaculty');
        if (rFilterFaculty) {
            rFilterFaculty.innerHTML = '<option value="">-- All Faculties --</option>' +
                window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        }
        const rFilterLevel = document.getElementById('resultFilterLevel');
        if (rFilterLevel) {
            rFilterLevel.innerHTML = '<option value="">-- All Levels --</option>' +
                LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
        }

        // Chart filter dropdowns — populated HERE so window.allFaculties exists
        const chartFacEl = document.getElementById('chartFilterFaculty');
        if (chartFacEl) {
            chartFacEl.innerHTML = '<option value="">-- All Faculties --</option>' +
                window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        }
        const chartLvlEl = document.getElementById('chartFilterLevel');
        if (chartLvlEl) {
            chartLvlEl.innerHTML = '<option value="">-- All Levels --</option>' +
                LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
        }

        loadStaticDropdowns();
        if (typeof loadUsers === "function") loadUsers();
    } catch (err) {
        console.error("Initialization failed:", err.message);
        const facSelect = document.getElementById('regFaculty');
        if (facSelect) facSelect.innerHTML = '<option value="">Error Loading Data</option>';
    }
}

// NOTE: chartFilterFaculty and chartFilterLevel dropdowns are now populated
// inside initAdminUserPage() AFTER window.allFaculties is loaded from Supabase.
// Populating them here caused "Cannot read properties of undefined (reading 'map')"
// because window.allFaculties didn't exist yet at script parse time.

function loadStaticDropdowns() {
    const levelEl = document.getElementById('regLevel');
    const semesterEl = document.getElementById('regSemester');
    if (levelEl) levelEl.innerHTML = '<option value="">-- Choose Level --</option>' + LEVEL_OPTIONS.map(lvl => `<option value="${lvl}">${lvl}</option>`).join('');
    if (semesterEl) semesterEl.innerHTML = '<option value="">-- Choose Semester --</option>' + SEMESTER_OPTIONS.map(sem => `<option value="${sem}">${sem}</option>`).join('');
}
function updateAdminDepartments() {
    const facultyName = document.getElementById('regFaculty').value;
    const deptSelect = document.getElementById('regDept');
    if (!deptSelect) return;
    if (!facultyName) { deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facultyObj = window.allFaculties.find(f => f.name === facultyName);
    if (!facultyObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facultyObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' + filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}

// ── STUDENT MANAGEMENT ─────────────────────────────────────────────
window.currentUserList = [];
async function loadUsers() {
    const userList = document.getElementById('userList');
    const searchTerm = document.getElementById('userSearch')?.value || "";
    try {
        let query = sb.from('students').select('*');
        if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,matrix_no.ilike.%${searchTerm}%`);
        const { data: students, error } = await query.order('name');
        if (error) throw error;
        window.currentUserList = students || [];
        if (!students || students.length === 0) {
            userList.innerHTML = '<div style="padding:20px; color:gray;">No students found.</div>';
            return;
        }
        userList.innerHTML = students.map(s => {
            const safeName   = sanitise(s.name || '');
            const safeMatrix = sanitise(s.matrix_no || '');
            const safeEmail  = sanitise(s.email || '');
            const safeFaculty= sanitise(s.faculty || '');
            const safeDept   = sanitise(s.department || '');
            const safeLevel  = sanitise(s.level || '');
            const safeSem    = sanitise(s.semester || '');
            const safeStatus = sanitise(s.status || '');
            const safePw     = sanitise(s.password || '');
            const safeId     = s.id;
            return `
            <div class="list-item" style="background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 20px; border-left: 5px solid ${s.status === 'approved' ? '#00ff88' : '#f0c060'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                    <strong style="font-size: 1.2rem; color: #0f5132;">${safeName.toUpperCase()}</strong>
                    <span style="font-size: 0.75rem; font-weight: bold; padding: 4px 8px; border-radius: 20px; background: ${s.status === 'approved' ? '#d1e7dd' : '#fff3cd'}; color: ${s.status === 'approved' ? '#0f5132' : '#856404'};">
                        ${safeStatus.toUpperCase()}
                    </span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; color: #444;">
                    <div><strong>🆔 Matric:</strong> ${safeMatrix}</div>
                    <div><strong>📧 Email:</strong> ${safeEmail}</div>
                    <div><strong>🏢 Faculty:</strong> ${safeFaculty}</div>
                    <div><strong>🎓 Dept:</strong> ${safeDept}</div>
                    <div><strong>📈 Level:</strong> ${safeLevel}</div>
                    <div><strong>📅 Sem:</strong> ${safeSem}</div>
                    <div style="grid-column: span 2; background: #f8f9fa; padding: 5px; border-radius: 4px; margin-top: 5px; border: 1px dashed #ccc;">
                        <strong>🔑 Password:</strong> <code style="color: #d63384;">${safePw}</code>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 15px; border-top: 1px solid #eee; justify-content: flex-end; flex-wrap: wrap;">
                    <button class="edit-btn" data-student-id="${safeId}" style="background:#f0c060; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">✏️ EDIT</button>
                    <button class="reset-pw-btn" data-student-id="${safeId}" data-student-name="${safeName}" style="background:#7c3aed; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">🔑 RESET PW</button>
                    ${s.status === 'approved' ? `
                        <button class="revoke-btn" data-student-id="${safeId}" style="background:#ff9800; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">🚫 REVOKE</button>
                    ` : `
                        <button class="approve-btn" data-student-id="${safeId}" style="background:#00ff88; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">✅ APPROVE</button>
                    `}
                    <button class="delete-btn" data-student-id="${safeId}" style="background:#ff4444; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-weight:bold;">🗑️ DELETE</button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error("Error loading users:", err.message);
        userList.innerHTML = '<div style="color:red; padding:20px;">Error loading student profile list.</div>';
    }
}
function openEditModal(studentId) {
    const student = window.currentUserList?.find(s => s.id == studentId);
    if (!student) return;
    editingStudentId = student.id;
    document.getElementById('regName').value = student.name || "";
    document.getElementById('regEmail').value = student.email || "";
    document.getElementById('regMatNo').value = student.matrix_no || "";
    document.getElementById('regFaculty').value = student.faculty;
    updateAdminDepartments();
    setTimeout(() => {
        const deptSelect = document.getElementById('regDept');
        if (deptSelect) deptSelect.value = student.department;
    }, 150);
    document.getElementById('regLevel').value = student.level;
    document.getElementById('regSemester').value = student.semester;
    const btn = document.getElementById("submitBtn");
    if (btn) { btn.textContent = "UPDATE STUDENT INFO"; btn.style.background = "#ffc107"; btn.style.color = "black"; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function registerUser() {
    const studentData = {
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        matrix_no: document.getElementById('regMatNo').value,
        password: document.getElementById('regPass').value,
        faculty: document.getElementById('regFaculty').value,
        department: document.getElementById('regDept').value,
        level: document.getElementById('regLevel').value,
        semester: document.getElementById('regSemester').value,
        status: 'approved'
    };
    if (editingStudentId) {
        const { error } = await sb.from('students').update(studentData).eq('id', editingStudentId);
        if (error) return alert(error.message);
        alert("Student Updated!");
    } else {
        const { error } = await sb.from('students').insert([studentData]);
        if (error) return alert(error.message);
        alert("Student Registered!");
    }
    resetForm();
    loadUsers();
}
function resetForm() {
    editingStudentId = null;
    document.querySelectorAll('input').forEach(i => i.value = "");
    const btn = document.getElementById("submitBtn");
    btn.textContent = "REGISTER USER";
    btn.style.background = "";
    btn.style.color = "";
}
async function approveStudent(id) {
    if (!confirm("Approve this student for exams?")) return;
    const { error } = await sb.from('students').update({ status: 'approved' }).eq('id', id);
    if (error) alert("Approval failed: " + error.message);
    else loadUsers();
}
async function revokeStudent(id) {
    if (!confirm("Revoke this student's access?")) return;
    const { error } = await sb.from('students').update({ status: 'pending' }).eq('id', id);
    if (error) alert("Revocation failed: " + error.message);
    else { alert("Access Revoked Successfully."); loadUsers(); }
}
async function deleteStudent(id) {
    if (!confirm("Move this student to recycle bin?")) return;
    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({ action: 'move-to-bin', table: 'students', id })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Student moved to recycle bin.");
        loadUsers();
    } catch (err) {
        alert("❌ " + err.message);
    }
}
async function adminResetPassword(studentId, studentName) {
    const newPass = prompt(`Reset password for ${studentName}.\n\nEnter a new temporary password (min 6 characters):`);
    if (!newPass) return;
    if (newPass.length < 6) { alert("Password must be at least 6 characters."); return; }
    try {
        const { error } = await sb.rpc('reset_student_password', { p_student_id: Number(studentId), p_new_password: newPass });
        if (error) throw error;
        alert(`✅ Password reset for ${studentName}.\n\nNew temporary password: ${newPass}\n\nPlease inform the student to change it after logging in.`);
    } catch (err) {
        alert("Reset failed: " + err.message);
    }
}

// ── QUESTION LIBRARY (CSP‑compliant rendering) ──────────────────────
window.allQuestions = [];
async function initQuestionPage() {
    try {
        const { data: fData } = await sb.from('faculties').select('*').order('name');
        const { data: dData } = await sb.from('departments').select('*').order('name');
        window.allFaculties = fData || [];
        window.allDepartments = dData || [];
        document.getElementById('bulk_faculty').innerHTML = '<option value="">-- Select Faculty --</option>' + window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        document.getElementById('q_faculty').innerHTML = '<option value="">-- Select Faculty --</option>' + window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
        loadAllStaticDropdowns();
        loadList();
    } catch (err) {
        console.error("Initialization failed:", err);
    }
}
function loadAllStaticDropdowns() {
    const levelHTML = LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
    const semHTML = SEMESTER_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('bulk_level').innerHTML = levelHTML;
    document.getElementById('q_level').innerHTML = levelHTML;
    document.getElementById('bulk_semester').innerHTML = semHTML;
    document.getElementById('q_semester').innerHTML = semHTML;
}
function updateBulkDepartments() { filterDeptLogic('bulk_faculty', 'bulk_dept'); }
function updateSingleDepartments() { filterDeptLogic('q_faculty', 'q_dept'); }
function filterDeptLogic(facId, deptId) {
    const facName = document.getElementById(facId).value;
    const deptSelect = document.getElementById(deptId);
    if (!facName) { deptSelect.innerHTML = '<option value="">-- Select Dept --</option>'; return; }
    const facObj = window.allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Dept --</option>' + filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}
async function loadList() {
    const qList = document.getElementById("qList");
    const countSpan = document.getElementById("count");
    const wipeBtn = document.getElementById("wipeAllBtn");
    const searchTerm = document.getElementById("qSearch")?.value.trim().toUpperCase() || "";
    try {
        let query = sb.from('questions').select('*');
        if (searchTerm) query = query.or(`course.ilike.%${searchTerm}%,questions.ilike.%${searchTerm}%`);
        const { data, error } = await query.order('id', { ascending: false });
        if (error) throw error;
        window.allQuestions = data || [];
        countSpan.textContent = data ? data.length : 0;
        if (wipeBtn) wipeBtn.style.display = (data && data.length > 0) ? "block" : "none";
        if (!data || data.length === 0) {
            qList.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.6;'>No questions found.</p>";
            return;
        }
        qList.innerHTML = data.map(item => {
            const safeCourse = sanitise(item.course || '');
            const safeQ      = sanitise(item.questions || '');
            const safeO1     = sanitise(item['Option 1'] || '');
            const safeO2     = sanitise(item['Option 2'] || '');
            const safeO3     = sanitise(item['Option 3'] || '');
            const safeO4     = sanitise(item['Option 4'] || '');
            const safeAns    = sanitise(item.answer || '');
            const safeId     = item.id;
            return `
            <div class="q-item" style="background:rgba(255,255,255,0.05); border:1px solid #444; margin-bottom:15px; padding:15px; border-radius:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="background:#00ff88; color:#000; padding:2px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">${safeCourse}</span>
                    <small style="color:#aaa;">${sanitise(item.level  || '')} | ${sanitise(item.semester || '')}</small>
                </div>
                <div style="font-size:1.05rem; margin-bottom:12px; color:#fff;"><strong>Q:</strong> ${safeQ}</div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:0.9rem; color:#ccc; margin-bottom:15px;">
                    <div>1. ${safeO1}</div><div>2. ${safeO2}</div><div>3. ${safeO3}</div><div>4. ${safeO4}</div>
                </div>
                <div style="color:#00ff88; font-weight:bold; font-size:0.85rem; margin-bottom:10px;">✅ Correct: Option ${safeAns}</div>
                <div style="display:flex; gap:10px; border-top:1px solid #444; padding-top:10px;">
                    <button class="edit-q-btn" data-question-id="${safeId}" style="flex:1; background:#f0c060; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold;">✏️ EDIT</button>
                    <button class="delete-q-btn" data-question-id="${safeId}" style="flex:1; background:#ff4444; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer; font-weight:bold;">🗑️ DELETE</button>
                </div>
            </div>`;
        }).join('');
        if (window.MathJax && window.MathJax.typeset) window.MathJax.typeset();
    } catch (err) {
        console.error("Library Load Error:", err.message);
        qList.innerHTML = "<p style='color:red;'>Error loading library.</p>";
    }
}
function prepareEdit(questionId) {
    const item = window.allQuestions.find(q => q.id == questionId);
    if (!item) return;
    document.getElementById("editId").value = item.id;
    document.getElementById("q").value = item.questions;
    document.getElementById("o1").value = item["Option 1"];
    document.getElementById("o2").value = item["Option 2"];
    document.getElementById("o3").value = item["Option 3"];
    document.getElementById("o4").value = item["Option 4"];
    document.getElementById("ans").value = item.answer;
    document.getElementById("q_course").value = item.course;
    document.getElementById("q_faculty").value = item.faculty;
    updateSingleDepartments();
    setTimeout(() => { document.getElementById("q_dept").value = item.department; }, 100);
    document.getElementById("q_level").value = item.level;
    document.getElementById("q_semester").value = item.semester;
    document.getElementById("formTitle").textContent = "Editing Question: " + sanitise(item.course);
    document.getElementById("submitBtn").textContent = "UPDATE QUESTION";
    document.getElementById("cancelBtn").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function deleteQuestion(id) {
    if (!confirm("Move this question to recycle bin?")) return;
    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({ action: 'move-to-bin', table: 'questions', id })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Question moved to recycle bin.");
        loadList();
    } catch (err) {
        alert("❌ " + err.message);
    }
}
async function wipeAllQuestions() {
    const searchTerm = document.getElementById("qSearch").value.trim();
    const isFiltered = searchTerm !== "";
    const message = isFiltered ? `⚠️ This will move only the questions matching "${searchTerm}" to the recycle bin. Proceed?`
        : "⚠️ WARNING: This will move EVERY question in your library to the recycle bin. Proceed?";
    if (!confirm(message)) return;
    if (prompt("Type 'DELETE' to confirm:") !== "DELETE") return alert("Wipe cancelled.");

    let query = sb.from('questions').select('id');
    if (isFiltered) query = query.or(`course.ilike.%${searchTerm}%,questions.ilike.%${searchTerm}%`);
    const { data: qList, error } = await query;
    if (error) return alert("Error: " + error.message);
    if (!qList || qList.length === 0) return alert("No questions found.");

    try {
        for (const q of qList) {
            await fetch(ADMIN_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': sessionStorage.getItem('adminToken') || ''
                },
                body: JSON.stringify({ action: 'move-to-bin', table: 'questions', id: q.id })
            });
        }
        alert("✅ " + qList.length + " question(s) moved to recycle bin.");
        loadList();
    } catch (err) {
        alert("❌ " + err.message);
    }
}
async function processBulk() {
    const fileInput = document.getElementById('bulkFile');
    const faculty = document.getElementById('bulk_faculty').value;
    const dept = document.getElementById('bulk_dept').value;
    const level = document.getElementById('bulk_level').value;
    const sem = document.getElementById('bulk_semester').value;
    if (!fileInput.files[0]) return alert("Please select a CSV or JSON file first!");
    if (!faculty || !dept) return alert("Please select the Target Faculty and Department.");
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        const fileName = fileInput.files[0].name;
        const fileType = fileName.split('.').pop().toLowerCase();
        let finalData = [];
        try {
            if (fileType === 'csv') {
                const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
                finalData = rows.slice(1).map(row => {
                    const values = [];
                    let current = '', inQuotes = false;
                    for (let i = 0; i < row.length; i++) {
                        let char = row[i];
                        if (char === '"') inQuotes = !inQuotes;
                        else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
                        else current += char;
                    }
                    values.push(current);
                    const clean = values.map(v => v.replace(/^"|"$/g, '').replace(/\0/g, '').trim());
                    return {
                        questions: clean[0],
                        "Option 1": clean[1], "Option 2": clean[2], "Option 3": clean[3], "Option 4": clean[4],
                        answer: parseInt(clean[5]) || 1,
                        course: (clean[6] || "GENERAL").toUpperCase(),
                        faculty, department: dept, level, semester: sem
                    };
                }).filter(q => q.questions && q.questions.length > 2);
            }
            if (finalData.length === 0) throw new Error("No valid questions found in file.");
            const { error } = await sb.from('questions').insert(finalData);
            if (error) throw error;
            alert(`✅ Success! ${finalData.length} questions uploaded and tagged for ${sanitise(dept)}.`);
            fileInput.value = "";
            if(typeof loadList === 'function') loadList();
        } catch (err) { alert("Upload Failed: " + err.message); }
    };
    reader.readAsText(fileInput.files[0]);
}

// ── RESULTS & REPORTS ───────────────────────────────────────────────
let allResults = [];
async function fetchFreshData() {
    // Get raw data
    const { data, error } = await sb.from('results').select('*').order('created_at', { ascending: false });
    if (error) return;
    let filtered = data || [];

    // Apply filters from the new dropdowns (if set)
    const selFaculty = document.getElementById('resultFilterFaculty')?.value;
    const selDept    = document.getElementById('resultFilterDept')?.value;
    const selLevel   = document.getElementById('resultFilterLevel')?.value;
    const selSem     = document.getElementById('resultFilterSemester')?.value;

    if (selFaculty) {
        filtered = filtered.filter(r => (r.faculty || '').trim().toUpperCase() === selFaculty.trim().toUpperCase());
    }
    if (selDept) {
        filtered = filtered.filter(r => (r.department || '').trim().toUpperCase() === selDept.trim().toUpperCase());
    }
    if (selLevel) {
        filtered = filtered.filter(r => String(r.level || '').trim() === selLevel.trim());
    }
    if (selSem) {
        filtered = filtered.filter(r => (r.semester || '').trim() === selSem.trim());
    }

    allResults = filtered;
    renderResultsUI();
    renderMasterUI();
}
async function deleteAllResults() {
    const input = prompt("Type 'DELETE ALL' to confirm:");
    if (!input || input.toUpperCase() !== "DELETE ALL") return;
    const { data: results } = await sb.from('results').select('id');
    if (!results || results.length === 0) return alert("No results to delete.");
    if (!confirm(`Move ${results.length} results to recycle bin?`)) return;

    try {
        for (const r of results) {
            await fetch(ADMIN_PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': sessionStorage.getItem('adminToken') || ''
                },
                body: JSON.stringify({ action: 'move-to-bin', table: 'results', id: r.id })
            });
        }
        alert("✅ All results moved to recycle bin.");
        fetchFreshData();
    } catch (err) {
        alert("❌ " + err.message);
    }
}
async function deleteResult(id, context) {
    if (!confirm(context === 'lecturer' ? "Move this result to recycle bin?" : "Move this result to recycle bin?")) return;
    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({ action: 'move-to-bin', table: 'results', id })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Result moved to recycle bin.");
        fetchFreshData();
    } catch (err) {
        alert("❌ " + err.message);
    }
}
function safeValue(val) { return sanitise(val); }

// ── INLINE SCORE ADJUSTMENT ──────────────────────────────────────────
async function saveAdjustedScore(resultId, newScore) {
    if (newScore < 0 || newScore > 100) return alert("Score must be between 0 and 100.");
    if (!confirm(`Update this score to ${newScore}%?`)) return;
    const { error } = await sb.from('results').update({ score: newScore }).eq('id', resultId);
    if (error) return alert("❌ Failed to update score: " + error.message);
    alert("✅ Score updated successfully!");
    fetchFreshData();
}
function renderResultsUI() {
    const grid = document.getElementById("adminResultsGrid");
    if (!grid) return;
    const searchTerm = document.getElementById("courseSearchInput").value.toLowerCase();
    const groupedByCourse = allResults.reduce((acc, cur) => {
        const key = cur.subject || "Unknown Course";
        if (!acc[key]) acc[key] = [];
        acc[key].push(cur);
        return acc;
    }, {});
    grid.innerHTML = Object.keys(groupedByCourse).filter(course => course.toLowerCase().includes(searchTerm)).map(course => `
        <div style="background: rgba(0,255,136,0.02); border: 1px solid #333; border-radius: 8px; margin-bottom: 25px; overflow: hidden;">
            <div style="background: #0f5132; padding: 12px; border-bottom: 1px solid #00ff88;"><h3 style="margin:0; color: #00ff88;">📚 COURSE: ${safeValue(course)}</h3></div>
            <div style="padding: 10px; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85em; color: white;">
                    <thead><tr style="text-align: left; border-bottom: 1px solid #444; color: #00ff88;"><th style="padding: 10px;">STUDENT NAME</th><th>MATRIX NO</th><th>DEPT</th><th>SEM</th><th>SCORE</th><th style="text-align: right;">ACTION</th></tr></thead>
                    <tbody>${groupedByCourse[course].map(res => `
                        <tr style="border-bottom: 1px solid #222;">
                            <td style="padding: 10px; text-transform: uppercase;">${safeValue(res.name)}</td>
                            <td>${safeValue(res.matrix_no)}</td>
                            <td>${safeValue(res.department)}</td>
                            <td>${safeValue(res.semester || '1st')}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:5px;">
                                    <input type="number" min="0" max="100" value="${res.score}"
                                        class="score-input" data-result-id="${res.id}"
                                        style="width:58px;padding:4px 6px;border-radius:4px;border:1px solid #00ff88;background:#0a2e1a;color:#00ff88;font-weight:bold;text-align:center;font-size:0.9em;">
                                    <span style="color:#00ff88;">%</span>
                                    <button class="save-score-btn" data-result-id="${res.id}"
                                        style="background:#00ff88;color:#000;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:0.75rem;">💾</button>
                                </div>
                            </td>
                            <td style="text-align: right;"><button data-result-id="${res.id}" data-context="lecturer" class="delete-result-btn" style="background:#ff4444; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;">🗑️</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`).join('');
}
function renderMasterUI() {
    const grid = document.getElementById("masterRecordsGrid");
    if (!grid) return;
    const searchTerm = document.getElementById("masterSearchInput").value.toLowerCase();
    const masterData = allResults.reduce((acc, cur) => {
        const key = cur.name.toUpperCase();
        if (!acc[key]) acc[key] = { info: cur, exams: [] };
        acc[key].exams.push(cur);
        return acc;
    }, {});
    const filteredStudents = Object.keys(masterData).filter(name => name.toLowerCase().includes(searchTerm) || masterData[name].info.matrix_no?.toLowerCase().includes(searchTerm));
    grid.innerHTML = filteredStudents.map(name => {
        const student = masterData[name];
        const totalPoints = student.exams.reduce((sum, ex) => sum + Number(ex.score), 0);
        const avgPercent = Math.round(totalPoints / student.exams.length);
        const isPassing = avgPercent >= 50;
        return `
        <div style="background:#111; margin-bottom:25px; border-radius:12px; border:1px solid #333; overflow:hidden; border-left:5px solid #00ff88;">
            <div style="background:#000; padding:15px;"><h2 style="margin:0; color:#00ff88; font-size:1.1em;">👤 ${safeValue(name)} &nbsp;<span style="color:#aaa; font-size:0.85em;">(MATRIC: ${safeValue(student.info.matrix_no)})</span></h2></div>
            <div style="padding:15px;">
                <table style="width:100%; color:white; font-size:0.9em; border-collapse:collapse;">
                    <thead><tr style="color:#00ff88; text-align:left; border-bottom:1px solid #333;"><th style="padding:8px;">COURSE</th><th>SEM</th><th>SCORE</th><th style="text-align:right;">ACTION</th></tr></thead>
                    <tbody>${student.exams.map(ex => `
                        <tr style="border-bottom:1px solid #222;">
                            <td style="padding:10px;">${safeValue(ex.subject)}</td>
                            <td>${safeValue(ex.semester || '1st')}</td>
                            <td>
                                <div style="display:flex;align-items:center;gap:5px;">
                                    <input type="number" min="0" max="100" value="${ex.score}"
                                        class="score-input" data-result-id="${ex.id}"
                                        style="width:58px;padding:4px 6px;border-radius:4px;border:1px solid #00ff88;background:#0a2e1a;color:#00ff88;font-weight:bold;text-align:center;font-size:0.9em;">
                                    <span style="color:#00ff88;">%</span>
                                    <button class="save-score-btn" data-result-id="${ex.id}"
                                        style="background:#00ff88;color:#000;border:none;padding:3px 7px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:0.75rem;">💾</button>
                                </div>
                            </td>
                            <td style="text-align:right;"><button data-result-id="${ex.id}" data-context="master" class="delete-result-btn" style="background:none; border:1px solid #ff4444; color:#ff4444; cursor:pointer; padding:4px 8px; border-radius:4px;">🗑️ DELETE</button></td>
                        </tr>`).join('')}
                    </tbody>
                </table>
                <div style="margin-top:15px; padding:12px 15px; background:#1a1a1a; border-radius:8px; border-top:2px solid #333; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                    <div style="font-size:0.9em; color:#ccc;">📊 <strong style="color:white;">Total Points:</strong> ${totalPoints}pts | <strong style="color:white;">Average:</strong> ${avgPercent}% <span style="color:#666;"> (${student.exams.length} course${student.exams.length>1?'s':''})</span></div>
                    <div style="font-size:0.95em; font-weight:bold; padding:6px 20px; border-radius:20px; background:${isPassing?'rgba(0,255,136,0.15)':'rgba(255,68,68,0.15)'}; color:${isPassing?'#00ff88':'#ff4444'}; border:2px solid ${isPassing?'#00ff88':'#ff4444'};">${isPassing?'✅ PASS':'❌ FAIL'}</div>
                </div>
            </div>
        </div>`;
    }).join('');
}
// PDF and CSV functions remain unchanged (generateBrandedPDF, printCoursePDF, printMasterPDF, exportCourseCSV, exportMasterCSV, triggerCSV)
// I'll paste them exactly as they were, but they are huge. For brevity, assume they are included fully from your original file.
// (In your final file, just keep the original functions unchanged.)

// ── PROCTORING ──────────────────────────────────────────────────────
const gunSound = new Audio('machine-gun-01.mp3');
let proctorAdminTimer = null;
let announcedCheats = new Set();
function openProctorPanel() {
    const panel = document.getElementById("proctorOverlay");
    if (!panel) return;
    panel.style.top = "0";
    refreshProctorGrid();
    if (proctorAdminTimer) clearInterval(proctorAdminTimer);
    proctorAdminTimer = setInterval(refreshProctorGrid, 5000);
}
function closeProctorPanel() {
    const panel = document.getElementById("proctorOverlay");
    if (panel) panel.style.top = "-110%";
    if (proctorAdminTimer) { clearInterval(proctorAdminTimer); proctorAdminTimer = null; }
}
async function refreshProctorGrid() {
    const grid = document.getElementById("fullProctorGrid");
    const counterDisplay = document.getElementById("totalStudentCount");
    try {
        const { data, error } = await sb.from('live_monitoring').select('*').order('last_seen', { ascending: false });
        if (error) throw error;
        if (counterDisplay) counterDisplay.textContent = `Active Students: ${data ? data.length : 0}`;
        if (!data || data.length === 0) { grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px;">Awaiting connections...</div>`; return; }
        grid.innerHTML = data.map(std => {
            const lastSeenTime = new Date(std.last_seen);
            const secondsSinceLastSeen = (new Date() - lastSeenTime) / 1000;
            const isOnline = secondsSinceLastSeen < 60;
            const shouldShowRed = std.status === 'CHEAT' && secondsSinceLastSeen < 120;
            if (std.status === 'CHEAT' && isOnline) {
                if (!announcedCheats.has(std.matrix_no)) {
                    gunSound.currentTime = 0; gunSound.play().catch(() => {});
                    announcedCheats.add(std.matrix_no);
                }
            } else if (std.status !== 'CHEAT') announcedCheats.delete(std.matrix_no);
            let borderColor = shouldShowRed ? 'red' : (isOnline ? '#00ff88' : '#333');
            let statusText = shouldShowRed ? '⚠️ TAB SWITCHED' : (isOnline ? 'ONLINE' : 'OFFLINE');
            let indicatorColor = isOnline ? '#00ff88' : 'gray';
            if (shouldShowRed) indicatorColor = 'red';
            const safeMatrix = sanitise(std.matrix_no);
            const safeName = sanitise(std.name);
            const safeSnapshot = escapeAttr(std.last_snapshot);
            return `
            <div style="background: #111; border: 3px solid ${borderColor}; border-radius: 10px; overflow: hidden; position: relative;">
<button class="kick-btn"
        data-matrix="${safeMatrix}"
        data-name="${safeName}"
        style="position: absolute; top: 5px; left: 5px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 4px; font-size: 0.6em; padding: 4px 8px; cursor: pointer; z-index: 10;">
    EXIT
</button>
                <div style="width: 100%; aspect-ratio: 4/3; background: #000;"><img src="${safeSnapshot}" style="width: 100%; height: 100%; object-fit: cover;"></div>
                <div style="padding: 8px;">
                    <div style="color: white; font-weight: bold; font-size: 0.75em;">${safeName}</div>
                    <div style="color: ${borderColor}; font-size: 0.65em; margin-top: 2px;">${statusText}</div>
                    <div style="color: #666; font-size: 0.6em;">${safeMatrix}</div>
                </div>
                <div style="position: absolute; top: 5px; right: 5px; width: 10px; height: 10px; border-radius: 50%; background: ${indicatorColor};"></div>
            </div>`;
        }).join('');
    } catch (err) { console.error(err); }
}
async function clearMonitoringTable() {
    const confirmFirst = confirm("⚠️ Are you sure you want to clear the monitoring feed?");
    if (!confirmFirst) return;
    const confirmSecond = confirm("🚨 This will delete ALL active snapshots. This cannot be undone. Proceed?");
    if (!confirmSecond) return;
    try {
        const { error } = await sb.from('live_monitoring').delete().neq('matrix_no', '___DO_NOT_DELETE___');
        if (error) throw error;
        alert("✅ Success: Monitoring table cleared.");
        const grid = document.getElementById("fullProctorGrid");
        const counter = document.getElementById("totalStudentCount");
        if (grid) grid.innerHTML = `<h3 style="color: #666; text-align: center; grid-column: 1/-1;">Feed cleared. Waiting for students...</h3>`;
        if (counter) counter.textContent = "Active Students: 0";
        refreshProctorGrid();
    } catch (err) { alert("Delete failed: " + err.message); }
}
async function kickStudent(matrix, name) {
    if (!confirm(`Force logout ${name}?`)) return;
    const { error } = await sb.from('live_monitoring').update({ status: 'FORCE_SUBMIT' }).eq('matrix_no', matrix);
    if (error) alert("Error: " + error.message);
    else refreshProctorGrid();
}

// ── PROMOTION PANEL ─────────────────────────────────────────────────
async function fetchInitialData() {
    console.log("🚀 Starting Data Fetch...");
    const { data: faculties, error: fErr } = await sb.from('faculties').select('*');
    if (fErr) { console.error("❌ Supabase Error:", fErr.message); return; }
    window.allFaculties = faculties;
    loadPromotionFaculties();
    populateMarkAdjustFaculty();

    const maLevelEl = document.getElementById('ma-level');
    if (maLevelEl) {
        maLevelEl.innerHTML = '<option value="">-- Choose Level --</option>' + 
            LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
    }

    const maSemesterEl = document.getElementById('ma-semester');
    if (maSemesterEl) {
        maSemesterEl.innerHTML = '<option value="">-- Choose Semester --</option>' + 
            SEMESTER_OPTIONS.map(sem => `<option value="${sem}">${sem}</option>`).join('');
    }
    
    // Inside initAdminUserPage() or fetchInitialData
const coFacultyEl = document.getElementById('coFaculty');
if (coFacultyEl) coFacultyEl.innerHTML = '<option value="">-- Select Faculty --</option>' +
    window.allFaculties.map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');

const coLevelEl = document.getElementById('coOrigLevel');
if (coLevelEl) coLevelEl.innerHTML = LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');
}

// Populate Mark Adjustment faculty & level dropdowns

function loadPromotionFaculties() {
    const facultySelect = document.getElementById('promoteFaculty');
    if (!facultySelect) { setTimeout(loadPromotionFaculties, 500); return; }
    facultySelect.innerHTML = '<option value="">-- Select Faculty --</option>' + (window.allFaculties || []).map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
}
function updatePromotionDepartments() {
    const facultyName = document.getElementById('promoteFaculty').value;
    const deptSelect = document.getElementById('promoteDept');
    if (!facultyName || !deptSelect) { if (deptSelect) deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facultyObj = window.allFaculties.find(f => f.name === facultyName);
    if (!facultyObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facultyObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' + (filtered.length > 0 ? filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('') : '<option value="">No Departments Found</option>');
}
async function promoteTargetedStudents() {
    const faculty = document.getElementById('promoteFaculty').value;
    const dept = document.getElementById('promoteDept').value;
    if (!faculty || !dept) return alert("⚠️ Please select both Faculty and Department.");
    const confirmMsg = `🚀 PROMOTION ACTION for ${sanitise(dept)}:\n\n- 1st Sem → 2nd Sem\n- 2nd Sem → Next Level (1st Sem)\n- All students reset to PENDING\n\nThis action cannot be undone. Proceed?`;
    if (!confirm(confirmMsg)) return;
    try {
        const { error } = await sb.rpc('promote_students_by_dept', { target_faculty: faculty, target_dept: dept });
        if (error) throw error;
        alert(`✅ Success! All students in ${sanitise(dept)} have been advanced.`);
        if (typeof loadUsers === "function") loadUsers();
    } catch (err) { alert("❌ Database Error: " + err.message); }
}

// ── RESULT RELEASE CONTROL ─────────────────────────────────────────
function updateReleaseDepartments() {
    const facultyName = document.getElementById('releaseFaculty').value;
    const deptSelect  = document.getElementById('releaseDept');
    if (!deptSelect) return;
    if (!facultyName) { deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facObj = window.allFaculties.find(f => f.name === facultyName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' + filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}
function getReleaseSelections() {
    return {
        dept: document.getElementById('releaseDept').value,
        level: document.getElementById('releaseLevel').value,
        semester: document.getElementById('releaseSemester').value
    };
}
async function setResultsRelease(released) {
    const { dept, level, semester } = getReleaseSelections();
    if (!dept || !level || !semester) return alert("⚠️ Please select Faculty, Department, Level and Semester first.");
    const label = `${sanitise(dept)} | ${sanitise(level)}L | ${sanitise(semester)} Semester`;
    const action = released ? "RELEASE" : "HIDE";
    if (!confirm(`${released ? '⚠️' : '🚨'} ${action} results for:\n\n📚 ${label}\n\n${released ? 'Students in this group will be able to download their PDF.' : 'Students will NO LONGER see their results.'}`)) return;
    const key = `${dept.trim().toUpperCase()}_${level}_${semester}`;
    try {
        const { data: row } = await sb.from('admin_settings').select('results_config').eq('id', 1).maybeSingle();
        const config = (row && row.results_config) ? row.results_config : {};
        config[key] = released;
        const { error } = await sb.from('admin_settings').upsert({ id: 1, results_config: config }, { onConflict: 'id' });
        if (error) throw error;
        const msg = document.getElementById('releaseStatusMsg');
        if (msg) { msg.style.color = released ? "#00ff88" : "#ff4444"; msg.textContent = released ? `✅ RELEASED: ${label}` : `❌ HIDDEN: ${label}`; }
        alert(released ? `✅ Results RELEASED for ${label}.` : `❌ Results HIDDEN for ${label}.`);
    } catch (err) {
        const msg = document.getElementById('releaseStatusMsg');
        if (msg) { msg.style.color = "#ff4444"; msg.textContent = "❌ Error: " + err.message; }
        alert(`❌ Failed: ${err.message}`);
    }
}
async function releaseResults() { await setResultsRelease(true); }
async function rejectResults()  { await setResultsRelease(false); }

// ── PDF & CSV EXPORT FUNCTIONS ────────────────────────────────────
function generateBrandedPDF(title, filteredData) {
    if (filteredData.length === 0) return alert("Search for a record to print first!");
    const win = window.open('', '_blank');
    const rows = filteredData.map((r, i) => `
        <tr>
            <td>${i+1}</td>
            <td style="text-transform: uppercase;">${safeValue(r.name)}</td>
            <td>${safeValue(r.matrix_no)}</td>
            <td>${safeValue(r.subject)}</td>
            <td>${safeValue(r.semester || '1st')}</td>
            <td style="font-weight:bold;">${r.score}%</td>
        </tr>`).join('');

    win.document.write(`
        <html><head><title>${safeValue(title)}</title><style>
        body { font-family: sans-serif; padding: 30px; }
        .header { text-align: center; border-bottom: 4px solid #0f5132; margin-bottom: 20px; padding-bottom: 10px; }
        h1 { color: #0f5132; margin: 0; font-size: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #0f5132; color: white; padding: 10px; text-align: left; font-size: 12px; }
        td { border: 1px solid #ddd; padding: 8px; font-size: 11px; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
        </style></head><body>
        <div class="header"><h1>🤖 BRAINS AI: ${safeValue(title)}</h1><p>OFFICIAL ACADEMIC RECORD | Generated: ${new Date().toLocaleDateString()}</p></div>
        <table><thead><tr><th>S/N</th><th>NAME</th><th>ID</th><th>COURSE</th><th>SEM</th><th>SCORE</th></tr></thead><tbody>${rows}</tbody></table>
        <div class="footer">POWERED BY MU'UJIZA DATA</div>
        </body></html>`);
    win.document.close();
    win.onload = () => win.print();
}

function printCoursePDF() {
    const term = document.getElementById("courseSearchInput").value.trim().toLowerCase();
    const filtered = term === "" ? allResults : allResults.filter(r => r.subject.toLowerCase().includes(term) || r.name.toLowerCase().includes(term));
    if (filtered.length === 0) alert("No results found for '" + term + "'.");
    else generateBrandedPDF("COURSE PERFORMANCE REPORT", filtered);
}

function printMasterPDF() {
    const term = document.getElementById("masterSearchInput").value.trim().toLowerCase();
    const filtered = term === "" ? allResults : allResults.filter(r => r.name.toLowerCase().includes(term) || (r.matrix_no && r.matrix_no.toLowerCase().includes(term)));
    if (filtered.length === 0) { alert("No records found for '" + term + "'."); return; }

    const masterData = filtered.reduce((acc, cur) => {
        const key = cur.name.toUpperCase();
        if (!acc[key]) acc[key] = { info: cur, exams: [] };
        acc[key].exams.push(cur);
        return acc;
    }, {});

    const studentBlocks = Object.keys(masterData).map(name => {
        const student = masterData[name];
        const total = student.exams.reduce((sum, ex) => sum + Number(ex.score), 0);
        const avg = Math.round(total / student.exams.length);
        const isPassing = avg >= 50;

        const qrData = encodeURIComponent([
            `NAME: ${name}`,
            `MATRIC: ${student.info.matrix_no}`,
            `DEPT: ${student.info.department || 'N/A'}`,
            `LEVEL: ${student.info.level || 'N/A'}`,
            `AVERAGE: ${avg}%`,
            `REMARK: ${isPassing ? 'PASS' : 'FAIL'}`,
            `VERIFIED BY: BRAINS ACADEMIC INTELLIGENCE`
        ].join(' | '));
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

        const courseRows = student.exams.map((ex, i) => `
            <tr class="${i % 2 === 0 ? 'even-row' : 'odd-row'}">
                <td style="width: 40px; text-align: center; padding: 10px;">${i+1}</td>
                <td style="padding: 10px; font-weight: 600;">${safeValue(ex.subject)}</td>
                <td style="text-align: center; padding: 10px;">${safeValue(ex.semester || '1st')}</td>
                <td style="text-align: center; font-weight: bold; color: ${isPassing ? '#0f5132' : '#c0392b'}; padding: 10px;">${ex.score}%</td>
            </tr>
        `).join('');

        return `
            <div class="student-card">
                <div class="student-header">
                    <div class="student-info">
                        <h2>${safeValue(name)}</h2>
                        <div class="student-details">
                            <span><strong>Matric No:</strong> ${safeValue(student.info.matrix_no)}</span>
                            <span><strong>Department:</strong> ${safeValue(student.info.department || 'N/A')}</span>
                            <span><strong>Level:</strong> ${safeValue(student.info.level || 'N/A')}L</span>
                            <span><strong>Semester:</strong> ${safeValue(student.info.semester || 'N/A')}</span>
                        </div>
                    </div>
                    <div class="qr-container">
                        <img src="${qrUrl}" alt="QR Code" width="90" height="90">
                        <div class="qr-label">VERIFY</div>
                    </div>
                </div>
                <div class="courses-table-wrapper">
                    <table class="courses-table">
                        <thead>
                            <tr>
                                <th style="width: 40px;">#</th>
                                <th>Course Code</th>
                                <th style="width: 100px;">Semester</th>
                                <th style="width: 80px;">Score (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${courseRows}
                        </tbody>
                    </table>
                </div>
                <div class="summary-section">
                    <div class="summary-stats">
                        <strong>Total Points:</strong> ${total} pts &nbsp;|&nbsp;
                        <strong>Average:</strong> ${avg}% &nbsp;
                        <span style="color:#888;">(${student.exams.length} course${student.exams.length>1?'s':''})</span>
                    </div>
                    <div class="result-badge ${isPassing ? 'pass-badge' : 'fail-badge'}">
                        ${isPassing ? 'PASS' : 'FAIL'}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student Master Records | BRAINS AI</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
                    background: #f4f7fb;
                    padding: 30px;
                    color: #1e2a3a;
                }
                .report-container {
                    max-width: 1100px;
                    margin: 0 auto;
                }
                .report-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 3px solid #0f5132;
                }
                .report-header h1 {
                    color: #0f5132;
                    font-size: 24px;
                    margin-bottom: 5px;
                }
                .report-header p {
                    color: #5a6e7a;
                    font-size: 12px;
                }
                .student-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                    margin-bottom: 30px;
                    overflow: hidden;
                    page-break-inside: avoid;
                    border: 1px solid #e2e8f0;
                }
                .student-header {
                    background: #0f5132;
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }
                .student-info h2 {
                    font-size: 18px;
                    margin: 0 0 8px 0;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .student-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    font-size: 12px;
                }
                .student-details span {
                    background: rgba(255,255,255,0.15);
                    padding: 4px 12px;
                    border-radius: 20px;
                }
                .qr-container {
                    text-align: center;
                    background: white;
                    padding: 5px;
                    border-radius: 8px;
                }
                .qr-label {
                    font-size: 8px;
                    color: #0f5132;
                    font-weight: bold;
                    margin-top: 3px;
                }
                .courses-table-wrapper {
                    padding: 0 20px 10px 20px;
                }
                .courses-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                }
                .courses-table th {
                    background: #eef2f5;
                    color: #0f5132;
                    padding: 12px 10px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 2px solid #cbd5e1;
                }
                .courses-table td {
                    padding: 10px;
                    border-bottom: 1px solid #e2e8f0;
                }
                .even-row {
                    background-color: #f9fbfd;
                }
                .odd-row {
                    background-color: white;
                }
                .summary-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 20px;
                    background: #f8fafc;
                    border-top: 2px solid #e2e8f0;
                    margin-top: 5px;
                }
                .summary-stats {
                    font-size: 13px;
                    color: #2d3e50;
                }
                .result-badge {
                    font-weight: bold;
                    font-size: 14px;
                    padding: 6px 24px;
                    border-radius: 30px;
                    letter-spacing: 1px;
                }
                .pass-badge {
                    background: #d4edda;
                    color: #0f5132;
                    border: 1px solid #0f5132;
                }
                .fail-badge {
                    background: #fde8e8;
                    color: #c0392b;
                    border: 1px solid #c0392b;
                }
                .report-footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 15px;
                    font-size: 10px;
                    color: #7f8c8d;
                    border-top: 1px solid #dce5ec;
                }
                @media print {
                    body { background: white; padding: 15px; }
                    .student-card { box-shadow: none; break-inside: avoid; }
                    .qr-container img { print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="report-header">
                    <h1>🤖 BRAINS AI – OFFICIAL ACADEMIC TRANSCRIPT</h1>
                    <p>STUDENT MASTER RECORDS | Generated: ${new Date().toLocaleDateString()} | POWERED BY MU'UJIZA DATA</p>
                </div>
                ${studentBlocks}
                <div class="report-footer">
                    BRAINS AI CBT SYSTEM © ${new Date().getFullYear()} – QR codes are verifiable through the official portal.
                </div>
            </div>
        </body>
        </html>
    `);
    win.document.close();
    win.onload = () => {
        const images = win.document.querySelectorAll('img');
        let loaded = 0;
        if (images.length === 0) { win.print(); return; }
        images.forEach(img => {
            if (img.complete) { loaded++; if (loaded === images.length) win.print(); }
            else {
                img.onload = () => { loaded++; if (loaded === images.length) win.print(); };
                img.onerror = () => { loaded++; if (loaded === images.length) win.print(); };
            }
        });
    };
}
function exportCourseCSV() {
    const term = document.getElementById("courseSearchInput").value.toLowerCase();
    const filtered = allResults.filter(r => r.subject.toLowerCase().includes(term));
    triggerCSV(filtered, "Lecturer_Report");
}

function exportMasterCSV() {
    const term = document.getElementById("masterSearchInput").value.toLowerCase();
    const filtered = allResults.filter(r => r.name.toLowerCase().includes(term));
    triggerCSV(filtered, "Student_Master_Record");
}

function triggerCSV(data, filename) {
    let csv = "NAME,ID,COURSE,SEM,SCORE\n";
    data.forEach(r => csv += `"${r.name}","${r.matrix_no}","${r.subject}","${r.semester}","${r.score}%"\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
}


// ── MARK ADJUSTMENT ──────────────────────────────────────────────────
function populateMarkAdjustFaculty() {
    const facEl = document.getElementById('ma-faculty');
    if (!facEl) return;
    facEl.innerHTML = '<option value="">-- Select Faculty --</option>' +
        (window.allFaculties || []).map(f => `<option value="${escapeAttr(f.name)}">${sanitise(f.name)}</option>`).join('');
}

function updateMarkAdjustDepartments() {
    const facName = document.getElementById('ma-faculty').value;
    const deptEl  = document.getElementById('ma-dept');
    if (!deptEl) return;
    if (!facName) {
        deptEl.innerHTML = '<option value="">-- Select Faculty First --</option>';
        return;
    }
    const facObj   = window.allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptEl.innerHTML = '<option value="">-- Select Department --</option>' +
        filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}

async function applyMarkAdjustment() {
    const faculty   = document.getElementById('ma-faculty').value;
    const dept      = document.getElementById('ma-dept').value;
    const level     = document.getElementById('ma-level').value;
    const semester  = document.getElementById('ma-semester').value;
    const courseCode = document.getElementById('ma-course').value.trim().toUpperCase(); // optional
    const threshold = parseFloat(document.getElementById('ma-threshold').value);
    const increment = parseFloat(document.getElementById('ma-increment').value);
    const msg       = document.getElementById('ma-msg');
    const btn       = document.getElementById('ma-applyBtn');
    const MAX_SCORE = 85;   // hard cap – scores will never exceed 85

    if (!faculty || !dept || !level || !semester || isNaN(threshold) || isNaN(increment) || increment <= 0) {
        msg.style.color = '#ff4444';
        msg.innerText = '⚠️ Please fill all fields correctly.';
        return;
    }

    const confirmMsg = `Add ${increment} marks to ALL ${dept} ${level}L (${semester} Sem) students scoring BELOW ${threshold}? Scores already at or above ${MAX_SCORE} will NOT be changed.`;
    if (!confirm(confirmMsg)) return;

    btn.disabled = true;
    btn.innerText = 'Processing...';
    msg.style.color = '#ffffff';
    msg.innerText = '⏳ Searching and updating scores...';

    try {
        // 1. Fetch all results matching the group (faculty can be NULL or match)
        let query = sb
    .from('results')
    .select('id, score')
    .or(`faculty.is.null,faculty.eq.${faculty}`)
    .eq('department', dept)
    .eq('level', level)
    .eq('semester', semester);

// Only filter by course if the admin typed a course code
if (courseCode) {
    query = query.or(`subject.eq.${courseCode},course.eq.${courseCode}`);
}

const { data: results, error } = await query;
        if (error) throw error;
        if (!results || results.length === 0) {
            msg.style.color = '#ffc107';
            msg.innerText = 'No results found for this group.';
            btn.disabled = false;
            btn.innerText = '🚀 APPLY MARK ADJUSTMENT';
            return;
        }

        // 2. Filter: only those below threshold AND below MAX_SCORE
        const toUpdate = results.filter(r => {
            const s = parseFloat(r.score);
            return s < threshold && s < MAX_SCORE;
        });

        if (toUpdate.length === 0) {
            msg.style.color = '#ffc107';
            msg.innerText = 'All students are already above the threshold or already at/above the cap.';
            btn.disabled = false;
            btn.innerText = '🚀 APPLY MARK ADJUSTMENT';
            return;
        }

        // 3. Update each row, capping at MAX_SCORE
        let updatedCount = 0;
        for (const row of toUpdate) {
            const current = parseFloat(row.score);
            const newScore = Math.min(MAX_SCORE, current + increment);
            const { error: updateErr } = await sb
                .from('results')
                .update({ score: newScore.toString() })
                .eq('id', row.id);
            if (!updateErr) updatedCount++;
        }

        msg.style.color = '#00ff88';
        msg.innerText = `✅ Successfully updated ${updatedCount} of ${toUpdate.length} results. Scores capped at ${MAX_SCORE}%.`;

        // Refresh results if the results section is open
        if (typeof fetchFreshData === 'function') fetchFreshData();

    } catch (err) {
        console.error("Mark Adjustment Error:", err);
        msg.style.color = '#ff4444';
        msg.innerText = '❌ Error: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = '🚀 APPLY MARK ADJUSTMENT';
    }
}

// ── CARRYOVER: UPDATE DEPARTMENTS DROPDOWN ──────────────────────
function updateCarryoverDepartments() {
    const facName = document.getElementById('coFaculty').value;
    const deptSelect = document.getElementById('coDept');
    if (!facName) {
        deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>';
        return;
    }
    const facObj = window.allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' +
        filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}

// ── CARRYOVER: CREATE SESSION ───────────────────────────────────
async function createCarryoverSession() {
    const faculty   = document.getElementById('coFaculty').value;
    const dept      = document.getElementById('coDept').value;
    const course    = document.getElementById('coCourse').value.trim().toUpperCase();
    const origLvl   = document.getElementById('coOrigLevel').value;
    const origSem   = document.getElementById('coOrigSemester').value;
    if (!faculty || !dept || !course || !origLvl || !origSem) {
        return alert("⚠️ Please fill all carryover fields.");
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => chars[b % chars.length]).join('');
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + 60);

    // Find existing carryover session by dept + carryover_course
    const { data: existing } = await sb.from('exam_sessions')
        .select('id')
        .eq('is_carryover',     true)
        .eq('carryover_course', course)
        .eq('department',       dept)
        .maybeSingle();

    let error;
    if (existing) {
        ({ error } = await sb.from('exam_sessions')
            .update({
                token_code:        token,
                is_active:         "false",
                faculty,
                level:             origLvl,
                semester:          origSem,
                end_time:          endTime.toISOString(),
                original_level:    origLvl,
                original_semester: origSem
            })
            .eq('id', existing.id));
    } else {
        ({ error } = await sb.from('exam_sessions')
            .insert({
                faculty,
                department:        dept,
                level:             origLvl,
                semester:          origSem,
                token_code:        token,
                is_active:         "false",
                end_time:          endTime.toISOString(),
                is_carryover:      true,
                carryover_course:  course,
                original_level:    origLvl,
                original_semester: origSem
            }));
    }

    if (error) {
        alert("Carryover session creation failed: " + error.message);
    } else {
        document.getElementById('coActiveToken').textContent = token;
        document.getElementById('coGateStatus').textContent = "CLOSED";
        document.getElementById('coGateStatus').style.color = "#ff4444";
        document.getElementById('coToggleGateBtn').textContent = "🔓 Open Gate";
        document.getElementById('coToggleGateBtn').style.background = "#00ff88";
        document.getElementById('coToggleGateBtn').style.color = "#0f5132";
        alert(`✅ Carryover token ${token} created for ${course} (Original: ${origLvl}L | ${origSem} Semester)`);
    }
}

// ── CARRYOVER: TOGGLE GATE ──────────────────────────────────────
async function toggleCarryoverGate() {
    const dept   = document.getElementById('coDept').value;
    const course = document.getElementById('coCourse').value.trim().toUpperCase();
    if (!dept || !course) return alert("⚠️ Please select Department and enter Course code.");

    const statusSpan = document.getElementById('coGateStatus');
    const btn = document.getElementById('coToggleGateBtn');
    const isOpening = statusSpan.textContent.includes("CLOSED");

    const { error } = await sb.from('exam_sessions')
        .update({ is_active: isOpening ? "true" : "false" })
        .eq('is_carryover', true)
        .eq('department', dept)
        .eq('carryover_course', course);

    if (!error) {
        statusSpan.textContent   = isOpening ? "OPEN" : "CLOSED";
        statusSpan.style.color   = isOpening ? "#00ff88" : "#ff4444";
        btn.textContent          = isOpening ? "🔒 Close Gate" : "🔓 Open Gate";
        btn.style.background     = isOpening ? "#ff4444" : "#00ff88";
        btn.style.color          = isOpening ? "white" : "#0f5132";
    } else {
        alert("Gate toggle error: " + error.message);
    }
}

// ── CARRYOVER: START EXAM (WITH TIMER) ──────────────────────────
let carryoverTimerInterval = null;
async function startCarryoverExam() {
    const dept   = document.getElementById('coDept').value;
    const course = document.getElementById('coCourse').value.trim().toUpperCase();
    const mins   = parseInt(document.getElementById('coDuration').value);
    const token  = document.getElementById('coActiveToken').textContent;

    if (!dept || !course || token === "----" || isNaN(mins) || mins <= 0) {
        return alert("⚠️ Please generate a token, select department/course, and enter a valid duration.");
    }

    const endTime = new Date(Date.now() + mins * 60000).toISOString();
    const { error } = await sb.from('exam_sessions')
        .update({ is_active: "true", end_time: endTime })
        .eq('is_carryover', true)
        .eq('department', dept)
        .eq('carryover_course', course);

    if (error) {
        alert("DB error: " + error.message);
        return;
    }

    document.getElementById('coGateStatus').textContent = "OPEN";
    document.getElementById('coGateStatus').style.color = "#00ff88";
    document.getElementById('coToggleGateBtn').textContent = "🔒 Close Gate";
    document.getElementById('coToggleGateBtn').style.background = "#ff4444";
    document.getElementById('coToggleGateBtn').style.color = "white";

    alert(`✅ Carryover exam for ${course} started!`);
    runCarryoverTimer(mins * 60, dept, course);
}

function runCarryoverTimer(totalSeconds, dept, course) {
    clearInterval(carryoverTimerInterval);
    const display = document.getElementById('coTimerDisplay');
    carryoverTimerInterval = setInterval(async () => {
        if (totalSeconds <= 0) {
            clearInterval(carryoverTimerInterval);
            display.textContent = "00:00";
            await autoCloseCarryoverGate(dept, course);
            return;
        }
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        totalSeconds--;
    }, 1000);
}

async function autoCloseCarryoverGate(dept, course) {
    await sb.from('exam_sessions')
        .update({ is_active: "false" })
        .eq('is_carryover', true)
        .eq('department', dept)
        .eq('carryover_course', course);

    document.getElementById('coGateStatus').textContent = "CLOSED (EXPIRED)";
    document.getElementById('coGateStatus').style.color = "#ff4444";
    document.getElementById('coActiveToken').textContent = "----";
}

// ── CARRYOVER: FORCE LOGOUT ALL ─────────────────────────────────
async function forceLogoutCarryover() {
    const dept   = document.getElementById('coDept').value;
    const course = document.getElementById('coCourse').value.trim().toUpperCase();
    if (!dept || !course) return alert("⚠️ Please select Department and enter Course code.");

    if (!confirm(`🚨 Force logout ALL students currently in carryover exam "${course}" for ${dept}?\n\nTheir answers will be lost and the gate will be closed.`)) return;

    // 1. Get matrix numbers of students currently in this carryover course
    const { data: liveRows, error: liveErr } = await sb.from('live_monitoring')
        .select('matrix_no')
        .eq('current_subject', course)
        .eq('status', 'ACTIVE');

    if (liveErr) return alert("❌ Error fetching live students: " + liveErr.message);
    if (!liveRows || liveRows.length === 0) {
        return alert("No active students currently in that carryover exam.");
    }

    const matrixNos = liveRows.map(s => s.matrix_no);

    // 2. Kick them from live monitoring
    const { error: kickErr } = await sb.from('live_monitoring')
        .update({ status: 'KICKED' })
        .in('matrix_no', matrixNos);

    if (kickErr) return alert("❌ Kick failed: " + kickErr.message);

    // 3. Close the carryover gate
    const { error: gateErr } = await sb.from('exam_sessions')
        .update({ is_active: "false" })
        .eq('is_carryover', true)
        .eq('department', dept)
        .eq('carryover_course', course);

    if (gateErr) return alert("❌ Gate close failed: " + gateErr.message);

    // 4. Reset UI fully
    document.getElementById('coGateStatus').textContent  = "CLOSED";
    document.getElementById('coGateStatus').style.color  = "#ff4444";
    document.getElementById('coActiveToken').textContent = "----";
    const coBtn = document.getElementById('coToggleGateBtn');
    if (coBtn) {
        coBtn.textContent      = "🔓 Open Gate";
        coBtn.style.background = "#00ff88";
        coBtn.style.color      = "#0f5132";
    }

    alert(`✅ Force logout completed!\n\n${matrixNos.length} student(s) kicked from ${dept} - ${course}.\nThe gate is now CLOSED.`);
}

let dashboardChartInstance = null;

async function renderDashboardChart() {
    const canvas = document.getElementById('dashboardChart');
    if (!canvas) return;

    // Read filter values
    const selFaculty  = document.getElementById('chartFilterFaculty')?.value;
    const selDept     = document.getElementById('chartFilterDept')?.value;
    const selLevel    = document.getElementById('chartFilterLevel')?.value;
    const selSemester = document.getElementById('chartFilterSemester')?.value;
    const selCourse   = document.getElementById('chartFilterCourse')?.value.trim().toUpperCase();

    // Fetch all results
    const { data, error } = await sb.from('results').select('*');
    if (error) return;

    let filtered = data || [];

    // Apply each filter
    if (selFaculty)  filtered = filtered.filter(r => (r.faculty || '').trim().toUpperCase() === selFaculty.trim().toUpperCase());
    if (selDept)     filtered = filtered.filter(r => (r.department || '').trim().toUpperCase() === selDept.trim().toUpperCase());
    if (selLevel)    filtered = filtered.filter(r => String(r.level || '').trim() === selLevel.trim());
    if (selSemester) filtered = filtered.filter(r => (r.semester || '').trim() === selSemester);
    if (selCourse)   filtered = filtered.filter(r => (r.subject || r.course || '').toUpperCase() === selCourse);

    // ── Compute stats ──────────────────────────────────────────
    const total   = filtered.length;
    const passed  = filtered.filter(r => parseFloat(r.score) >= 50);
    const failed  = filtered.filter(r => parseFloat(r.score) < 50);

    const passMin = passed.length ? Math.min(...passed.map(r => parseFloat(r.score))) : null;
    const passMax = passed.length ? Math.max(...passed.map(r => parseFloat(r.score))) : null;
    const failMin = failed.length ? Math.min(...failed.map(r => parseFloat(r.score))) : null;
    const failMax = failed.length ? Math.max(...failed.map(r => parseFloat(r.score))) : null;

    // ── Update text stats ──────────────────────────────────────
    const statsDiv = document.getElementById('chartStats');
    document.getElementById('statTotal').textContent    = total;
    document.getElementById('statPassed').textContent   = passed.length;
    document.getElementById('statFailed').textContent   = failed.length;
    document.getElementById('statPassMin').textContent  = passMin !== null ? passMin : '—';
    document.getElementById('statPassMax').textContent  = passMax !== null ? passMax : '—';
    document.getElementById('statFailMin').textContent  = failMin !== null ? failMin : '—';
    document.getElementById('statFailMax').textContent  = failMax !== null ? failMax : '—';

    if (total > 0) {
        statsDiv.style.display = 'block';
    } else {
        statsDiv.style.display = 'none';
    }

    // ── Doughnut chart (pass vs fail) ──────────────────────────
    const ctx = canvas.getContext('2d');
    if (dashboardChartInstance) dashboardChartInstance.destroy();

    if (total === 0) {
        canvas.parentElement.style.display = 'none';
        const noData = document.getElementById('chartNoData');
        if (noData) noData.style.display = 'block';
        return;
    }
    canvas.parentElement.style.display = 'block';
    const noData = document.getElementById('chartNoData');
    if (noData) noData.style.display = 'none';

    dashboardChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
                data: [passed.length, failed.length],
                backgroundColor: ['#00ff88', '#ff4444'],
                borderColor: ['#00ff88', '#ff4444'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// ── RECYCLE BIN ──────────────────────────────────────────────────────
function updateRBFilterDepartments() {
    const facName = document.getElementById('rbFaculty').value;
    const deptSel = document.getElementById('rbDept');
    if (!facName) {
        deptSel.innerHTML = '<option value="">-- All Departments --</option>';
        return;
    }
    const facObj = window.allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = window.allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSel.innerHTML = '<option value="">-- All Departments --</option>' +
        filtered.map(d => `<option value="${escapeAttr(d.name)}">${sanitise(d.name)}</option>`).join('');
}

async function loadRecycleBin() {
    const container = document.getElementById('rbList');
    const search   = document.getElementById('rbSearch')?.value.trim() || '';
    const faculty  = document.getElementById('rbFaculty')?.value || '';
    const dept     = document.getElementById('rbDept')?.value || '';
    const level    = document.getElementById('rbLevel')?.value || '';
    const semester = document.getElementById('rbSemester')?.value || '';

    container.innerHTML = '<p style="color:gray;">Loading...</p>';

    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({
                action: 'fetch-bin',
                faculty, department: dept, level, semester, search
            })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);

        const entries = result.bin;
        if (!entries || entries.length === 0) {
            container.innerHTML = '<p style="color:gray; padding:20px;">Recycle bin is empty.</p>';
            return;
        }

        container.innerHTML = entries.map(e => {
            const typeBadge = e.original_table === 'students' ? '🟢 Student' :
                              e.original_table === 'questions' ? '🟠 Question' : '🔵 Result';
            const details = e.original_table === 'students' ? `${e.student_name || ''} (${e.matrix_no || ''})` :
                            e.original_table === 'questions' ? `${e.course || 'Q'} – ${(e.data && e.data.questions ? e.data.questions.substring(0,40) : '')}` :
                            `${e.course || 'Subject'} – ${e.student_name || ''}`;
            return `
            <div style="background:#111; padding:12px 15px; border-radius:8px; margin-bottom:8px; border-left:5px solid ${e.original_table==='students'?'#00ff88': e.original_table==='questions'?'#ff9800':'#4fc3f7'}; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div>
                    <span style="color:white; font-weight:bold;">${typeBadge}</span>
                    <span style="color:#aaa; margin-left:10px;">${details}</span>
                    <small style="color:#666; display:block;">Deleted: ${new Date(e.deleted_at).toLocaleString()}</small>
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="restore-btn" data-bin-id="${e.id}" style="background:#00ff88; color:black; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">♻️ Restore</button>
                    <button class="perm-delete-btn" data-bin-id="${e.id}" style="background:#ff4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">🗑️ Delete Forever</button>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error loading recycle bin: ${err.message}</p>`;
    }
}

async function restoreFromBin(binId) {
    if (!confirm("Restore this item back to its original table?")) return;
    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({ action: 'restore', binId })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Item restored.");
        loadRecycleBin();
        // Optionally refresh the relevant list
        if (document.getElementById('sec-students').classList.contains('active')) loadUsers();
        else if (document.getElementById('sec-questions').classList.contains('active')) loadList();
        else if (document.getElementById('sec-results').classList.contains('active')) fetchFreshData();
    } catch (err) {
        alert("❌ " + err.message);
    }
}

async function permanentDeleteBin(binId) {
    if (!confirm("PERMANENTLY delete this item from the recycle bin? This cannot be undone.")) return;
    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({ action: 'permanent-delete', binId })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Permanently deleted.");
        loadRecycleBin();
    } catch (err) {
        alert("❌ " + err.message);
    }
}

async function wipeAllBin() {
    if (!confirm("⚠️ Permanently delete ALL items currently shown in the recycle bin? This cannot be undone.")) return;
    const faculty  = document.getElementById('rbFaculty')?.value || '';
    const dept     = document.getElementById('rbDept')?.value || '';
    const level    = document.getElementById('rbLevel')?.value || '';
    const semester = document.getElementById('rbSemester')?.value || '';

    try {
        const resp = await fetch(ADMIN_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': sessionStorage.getItem('adminToken') || ''
            },
            body: JSON.stringify({ action: 'wipe-all', faculty, department: dept, level, semester })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ All currently visible entries permanently deleted.");
        loadRecycleBin();
    } catch (err) {
        alert("❌ " + err.message);
    }
}