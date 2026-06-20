

// ── XSS PROTECTION ───────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
function safeErr(err) {
    const msg = (err && err.message) ? String(err.message) : 'An unexpected error occurred.';
    return msg.substring(0, 120);
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


// ── CONFIG ────────────────────────────────────────────────────────────



const S_URL   = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY   = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const PROXY   = `${S_URL}/functions/v1/busa-proxy`;
const AUTH_PROXY = `${S_URL}/functions/v1/auth-proxy`;

const sb = supabase.createClient(S_URL, S_KEY, {
    global: {
        headers: { 'x-admin-token': sessionStorage.getItem('adminToken') || '' }
    }
});

// ── AUTH GUARD ────────────────────────────────────────────────────────
(async function () {
    const token = sessionStorage.getItem('adminToken');
    if (sessionStorage.getItem('adminLoggedIn') !== 'true' || !token) {
        window.location.replace('index.html');
        return;
    }
    const { data: isValid, error } = await sb.rpc('verify_admin_token', { submitted_token: token });
    if (error || !isValid) {
        sessionStorage.clear();
        window.location.replace('index.html');
    }
})();

// ── GLOBAL STATE ──────────────────────────────────────────────────────
let allFaculties   = [];
let allDepartments = [];
let _assignmentData = [];
let _scheduleEntries = [];

// ═══════════════════════════════════════════════════════════════════════
// SIDEBAR NAVIGATION
// ═══════════════════════════════════════════════════════════════════════

function initSidebar() {
    const navItems  = document.querySelectorAll('.nav-item[data-page]');
    const hamburger = document.getElementById('hamburger');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');
    const logoutBtn = document.getElementById('logoutBtn');
    const goAdminBtn = document.getElementById('goAdminBtn');

    // Page switching
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page === 'admin') { window.location.href = 'admin.html'; return; }

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const target = document.getElementById(`page-${page}`);
            if (target) target.classList.add('active');

            // Lazy load data when tab is first opened
            if (page === 'bursary') loadBursarStaff();
            if (page === 'cagatekeeper') initCaGatekeeperPage();
            if (page === 'paperscores') initPaperScoresPage();
            if (page === 'assignments') loadAssignments();
            if (page === 'examcard') initExamCardPage();
            if (page === 'examscheduler') initExamSchedulerPage();

            // Close sidebar on mobile
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    });

    // Hamburger
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = 'index.html';
    });

    if (goAdminBtn) {
        goAdminBtn.addEventListener('click', () => { window.location.href = 'admin.html'; });
    }
}

// ═══════════════════════════════════════════════════════════════════════
// QUESTION UPLOAD
// ═══════════════════════════════════════════════════════════════════════

async function initUploadPage() {
    try {
        const { data: fData, error: fErr } = await sb.from('faculties').select('*').order('name');
        const { data: dData, error: dErr } = await sb.from('departments').select('*').order('name');
        if (fErr || dErr) throw new Error('Database connection failed');
        allFaculties   = fData || [];
        allDepartments = dData || [];
        
        renderFacultyDropdown();      // for question upload page
        renderStaticDropdowns();      // for question upload page
        populatePsFaculties();        // ✅ for paper exam scores page (faculty)
        updatePsDepartments();        // ✅ ensure department dropdown is reset
    } catch (err) {
        console.error('Init error:', err);
    }
}


function renderFacultyDropdown() {
    const facSelect = document.getElementById('faculty');
    if (!facSelect) return;
    facSelect.innerHTML = '<option value="">-- Select Faculty --</option>' +
        allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
}

function renderStaticDropdowns() {
    const LEVELS    = ['100','200','300','400','500','600','700','800','900','1000'];
    const SEMESTERS = ['1st','2nd'];
    const lvl = document.getElementById('level');
    const sem = document.getElementById('semester');
    if (lvl) lvl.innerHTML = '<option value="">-- Level --</option>' + LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');
    if (sem) sem.innerHTML = '<option value="">-- Semester --</option>' + SEMESTERS.map(s => `<option value="${s}">${s}</option>`).join('');
}

function updateDepts() {
    const selectedFac = document.getElementById('faculty').value;
    const deptEl      = document.getElementById('dept');
    const facObj      = allFaculties.find(f => f.name === selectedFac);
    if (!facObj) { deptEl.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    deptEl.innerHTML = filtered.length > 0
        ? filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('')
        : '<option value="">No Departments Found</option>';
}

function handleMediaPreview() {
    const file         = document.getElementById('imageFile').files[0];
    const previewBox   = document.getElementById('mediaPreviewBox');
    const fileNameDisp = document.getElementById('fileName');
    if (!file) { previewBox.innerHTML = '<p style="color:#555;">Preview will appear here</p>'; return; }
    if (fileNameDisp) fileNameDisp.textContent = file.name;
    const url     = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    previewBox.innerHTML = '';
    if (isVideo) {
        const vid = document.createElement('video');
        vid.src = url; vid.controls = true; vid.muted = true;
        vid.style.cssText = 'max-width:100%; max-height:250px;';
        previewBox.appendChild(vid);
    } else {
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = 'max-width:100%; max-height:250px; object-fit:contain;';
        previewBox.appendChild(img);
    }
    updatePreview();
}

function updatePreview() {
    const q   = document.getElementById('qText').value;
    const o1  = document.getElementById('op1').value;
    const o2  = document.getElementById('op2').value;
    const o3  = document.getElementById('op3').value;
    const o4  = document.getElementById('op4').value;
    const p   = document.getElementById('preview');
    const box = document.getElementById('mediaPreviewBox');
    if (!p) return;

    p.textContent = '';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'background:#111; padding:14px; border-radius:8px; border:1px solid #333;';

    if (box && box.querySelector('video,img')) {
        const md = document.createElement('div');
        md.style.marginBottom = '10px';
        md.innerHTML = box.innerHTML;
        wrap.appendChild(md);
    }
    const qDiv = document.createElement('div');
    qDiv.style.cssText = 'font-weight:bold; margin-bottom:10px; color:white;';
    qDiv.textContent = q || 'Question preview...';
    wrap.appendChild(qDiv);

    const opDiv = document.createElement('div');
    opDiv.style.cssText = 'font-size:0.9em; padding-left:10px; border-left:2px solid #00ff88; color:#ccc;';
    opDiv.innerHTML = `A. ${sanitise(o1)||'...'} <br> B. ${sanitise(o2)||'...'} <br> C. ${sanitise(o3)||'...'} <br> D. ${sanitise(o4)||'...'}`;
    wrap.appendChild(opDiv);
    p.appendChild(wrap);
    if (window.MathJax) MathJax.typesetPromise([p]);
}

async function uploadEverything() {
    const btn = document.getElementById('uploadBtn');
    try {
        const faculty    = document.getElementById('faculty').value;
        const dept       = document.getElementById('dept').value;
        const level      = document.getElementById('level').value;
        const semester   = document.getElementById('semester').value;
        const course     = document.getElementById('course').value.trim();
        const correctAns = document.getElementById('correctAns').value;
        const qContent   = document.getElementById('qText').value.trim();

        if (!faculty || !dept || !level || !course || !correctAns || !qContent) {
            return alert('⚠️ Please fill all required fields!');
        }

        btn.disabled = true;
        btn.textContent = 'UPLOADING MEDIA...';

        const file = document.getElementById('imageFile').files[0];
        let finalImageUrl = null;

        if (file) {
            const ext = file.name.split('.').pop();
            const fileName = `osce-${Date.now()}.${ext}`;
            const { error: uploadError } = await sb.storage.from('question-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = sb.storage.from('question-images').getPublicUrl(fileName);
            finalImageUrl = data.publicUrl;
        }

        btn.textContent = 'SAVING DATA...';

        const { error } = await sb.from('questions').insert([{
            questions: qContent,
            'Option 1': document.getElementById('op1').value,
            'Option 2': document.getElementById('op2').value,
            'Option 3': document.getElementById('op3').value,
            'Option 4': document.getElementById('op4').value,
            answer:     parseInt(correctAns),
            image_url:  finalImageUrl,
            faculty, department: dept, course: course.toUpperCase(), level, semester
        }]);

        if (error) throw error;
        alert('✅ Question Saved Successfully!');
        location.reload();

    } catch (err) {
        alert('Error: ' + safeErr(err));
        btn.disabled = false;
        btn.textContent = 'UPLOAD TO DATABASE';
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BURSARY STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

async function loadBursarStaff() {
    const listDiv = document.getElementById('bursarStaffList');
    listDiv.innerHTML = '<p style="color:var(--muted);">Loading...</p>';

    try {
        const adminToken = sessionStorage.getItem('adminToken') || '';
        // ✅ Change AUTH_PROXY to PROXY
        const resp = await fetch(PROXY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken
            },
            body: JSON.stringify({ action: 'get-bursary-staff' })
        });

        // Fallback removed because proxy should always handle it
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        renderBursarTable(result.staff || []);

    } catch (err) {
        listDiv.innerHTML = `<p style="color:var(--error);">❌ ${safeErr(err)}</p>`;
    }
}


function renderBursarTable(staff) {
    const listDiv = document.getElementById('bursarStaffList');
    if (!staff.length) {
        listDiv.innerHTML = '<p style="color:var(--muted); text-align:center; padding:20px;">No bursary staff found.</p>';
        return;
    }

    listDiv.innerHTML = `
        <table class="staff-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Failed Attempts</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${staff.map(s => {
                    const isLocked = s.locked_until && new Date(s.locked_until) > new Date();
                    return `
                    <tr>
                        <td><strong>${sanitise(s.name)}</strong></td>
                        <td style="color:var(--muted);">${sanitise(s.email)}</td>
                        <td>
                            <span class="badge ${isLocked ? 'badge-red' : 'badge-green'}">
                                ${isLocked ? '🔒 LOCKED' : '✅ ACTIVE'}
                            </span>
                        </td>
                        <td style="text-align:center;">${s.failed_attempts || 0}</td>
                        <td style="display:flex; gap:6px; flex-wrap:wrap;">
                            <button class="btn btn-orange reset-pass-btn"
                                    data-id="${s.id}" data-name="${sanitise(s.name)}"
                                    style="font-size:0.75rem; padding:6px 10px;">
                                🔑 Reset Password
                            </button>
                            ${isLocked ? `
                            <button class="btn btn-green unlock-btn"
                                    data-id="${s.id}"
                                    style="font-size:0.75rem; padding:6px 10px;">
                                🔓 Unlock
                            </button>` : ''}
                            <button class="btn btn-red delete-bursar-btn"
                                    data-id="${s.id}" data-name="${sanitise(s.name)}"
                                    style="font-size:0.75rem; padding:6px 10px;">
                                🗑️ Delete
                            </button>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>`;
}


async function createBursarAccount() {
    const name        = document.getElementById('newBursarName').value.trim();
    const email       = document.getElementById('newBursarEmail').value.trim().toLowerCase();
    const pass        = document.getElementById('newBursarPass').value;
    const passConfirm = document.getElementById('newBursarPassConfirm').value;
    const msgEl       = document.getElementById('createBursarMsg');
    const btn         = document.getElementById('createBursarBtn');

    if (!name || !email || !pass) {
        msgEl.className = 'msg error';
        msgEl.innerText = 'All fields are required.';
        return;
    }
    if (pass.length < 8) {
        msgEl.className = 'msg error';
        msgEl.innerText = 'Password must be at least 8 characters.';
        return;
    }
    if (pass !== passConfirm) {
        msgEl.className = 'msg error';
        msgEl.innerText = 'Passwords do not match.';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Creating...';
    msgEl.className = 'msg';
    msgEl.innerText = '';

    try {
        // Use admin token instead of bursa token
        const adminToken = sessionStorage.getItem('adminToken');
        if (!adminToken) throw new Error('Admin session expired. Please log in again.');

        console.log('Sending request to:', PROXY);

        const resp = await fetch(PROXY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken    // ← changed from x-busa-token
            },
            body: JSON.stringify({
                action: 'create-bursar',
                name: name,
                email: email,
                password: pass
            })
        });

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || `HTTP ${resp.status}`);

        msgEl.className = 'msg success';
        msgEl.innerText = `✅ Bursar account created for ${name}!`;
        document.getElementById('newBursarName').value = '';
        document.getElementById('newBursarEmail').value = '';
        document.getElementById('newBursarPass').value = '';
        document.getElementById('newBursarPassConfirm').value = '';
        if (typeof loadBursarStaff === 'function') loadBursarStaff();

    } catch (err) {
        console.error('Create bursar error:', err);
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ ' + (err.message || 'Failed to connect to server');
    } finally {
        btn.disabled = false;
        btn.innerText = '➕ CREATE BURSAR ACCOUNT';
    }
}

function openResetModal(id, name) {
    document.getElementById('resetBursarId').value   = id;
    document.getElementById('resetBursarName').value = name;
    document.getElementById('resetNewPass').value    = '';
    document.getElementById('resetConfirmPass').value = '';
    document.getElementById('resetPassMsg').className = 'msg';
    document.getElementById('resetPassMsg').innerText  = '';
    document.getElementById('resetPassModal').style.display = 'block';
}

async function confirmResetPassword() {
    const id          = document.getElementById('resetBursarId').value;
    const newPass     = document.getElementById('resetNewPass').value;
    const confirmPass = document.getElementById('resetConfirmPass').value;
    const msgEl       = document.getElementById('resetPassMsg');
    const btn         = document.getElementById('confirmResetBtn');

    if (newPass.length < 8) {
        msgEl.className = 'msg error';
        msgEl.innerText = 'Password must be at least 8 characters.';
        return;
    }
    if (newPass !== confirmPass) {
        msgEl.className = 'msg error';
        msgEl.innerText = 'Passwords do not match.';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Resetting...';
    msgEl.className = 'msg';
    msgEl.innerText = '';

    try {
        // Use admin token (admins have full rights to manage bursars)
        const adminToken = sessionStorage.getItem('adminToken');
        if (!adminToken) throw new Error('Admin session expired. Please log in again.');

        const resp = await fetch(PROXY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken    // ← changed from x-busa-token
            },
            body: JSON.stringify({
                action: 'reset-bursar-password',
                bursarId: parseInt(id),
                newPassword: newPass
            })
        });

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || `HTTP ${resp.status}`);

        msgEl.className = 'msg success';
        msgEl.innerText = '✅ Password reset successfully!';
        setTimeout(() => {
            const modal = document.getElementById('resetPassModal');
            if (modal) modal.style.display = 'none';
        }, 1500);

    } catch (err) {
        console.error('Reset password error:', err);
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ ' + (err.message || 'Failed to connect to server');
    } finally {
        btn.disabled = false;
        btn.innerText = '🔑 RESET PASSWORD';
    }
}


async function deleteBursar(id, name) {
    if (!confirm(`⚠️ Permanently delete bursar "${name}"?\n\nThis action cannot be undone.`)) return;

    try {
        const adminToken = sessionStorage.getItem('adminToken');
        if (!adminToken) throw new Error('Admin session expired');

        const resp = await fetch(PROXY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken
            },
            body: JSON.stringify({
                action: 'delete-bursar',
                bursarId: parseInt(id)
            })
        });

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || 'Delete failed');

        alert(`✅ Bursar "${name}" deleted successfully.`);
        loadBursarStaff(); // Refresh list
    } catch (err) {
        console.error('Delete error:', err);
        alert('❌ ' + err.message);
    }
}

async function unlockBursar(id) {
    if (!confirm('Unlock this bursar account?')) return;

    try {
        const adminToken = sessionStorage.getItem('adminToken');
        if (!adminToken) throw new Error('Admin session expired');

        const resp = await fetch(PROXY, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-token': adminToken
            },
            body: JSON.stringify({
                action: 'unlock-bursar',
                bursarId: parseInt(id)
            })
        });

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || 'Unlock failed');

        alert('✅ Account unlocked');
        loadBursarStaff();
    } catch (err) {
        console.error('Unlock error:', err);
        alert('❌ ' + err.message);
    }
}
// ═══════════════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════

async function loadAssignments(filter = 'all', searchTerm = '') {
    const listDiv = document.getElementById('assignmentList');
    listDiv.innerHTML = 'Loading...';

    let query = sb.from('assignments').select('*').order('submitted_at', { ascending: false });
    if (filter === 'pending') query = query.eq('status', 'pending');
    else if (filter === 'graded') query = query.eq('status', 'graded');
    if (searchTerm) {
        query = query.or(`matrix_no.ilike.%${searchTerm}%,student_name.ilike.%${searchTerm}%,course_code.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:var(--muted); padding:20px;">No submissions found.</p>';
        return;
    }

    _assignmentData = data;
    listDiv.innerHTML = data.map(a => `
        <div class="assign-item ${a.status === 'graded' ? 'graded' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div style="flex:1;">
                    <strong>${sanitise(a.student_name)}</strong>
                    <span class="badge badge-green" style="margin-left:8px;">${sanitise(a.matrix_no)}</span>
                    <br>
                    <small style="color:var(--muted);">${sanitise(a.course_code)} • ${sanitise(a.department||'')} • ${sanitise(a.level||'')}L • ${sanitise(a.faculty||'')}</small>
                    <br>
                    <span style="color:var(--muted); font-size:0.85rem; font-style:italic;">"${sanitise(a.title)}"</span>
                </div>
                <div style="text-align:right;">
                    <span style="font-weight:bold; color:${a.status === 'graded' ? 'var(--green)' : 'var(--warn)'};">
                        ${a.status === 'graded' ? `${a.score}/${a.max_score}` : 'PENDING'}
                    </span>
                    <br>
                    <small style="color:var(--muted);">${new Date(a.submitted_at).toLocaleDateString()}</small>
                    <br>
                    <button data-id="${a.id}" class="btn btn-green grade-btn"
                            style="margin-top:6px; font-size:0.75rem; padding:6px 12px;">
                        ${a.status === 'graded' ? '✏️ EDIT SCORE' : '🎯 GRADE'}
                    </button>
                    ${a.status === 'graded' ? `
                    <button data-id="${a.id}" class="btn btn-red delete-assign-btn"
                            style="margin-top:6px; font-size:0.75rem; padding:6px 10px; margin-left:4px;">
                        🗑️
                    </button>` : ''}
                </div>
            </div>
        </div>`).join('');
}

function openGradingModal(assignmentId) {
    const a = _assignmentData.find(x => x.id == assignmentId);
    if (!a) return;
    document.getElementById('grdName').innerText    = a.student_name;
    document.getElementById('grdMatrix').innerText  = a.matrix_no;
    document.getElementById('grdDept').innerText    = a.department || '—';
    document.getElementById('grdLevel').innerText   = a.level || '—';
    document.getElementById('grdFaculty').innerText = a.faculty || '—';
    document.getElementById('grdCourse').innerText  = a.course_code;
    document.getElementById('grdContent').innerText = a.content;
    document.getElementById('grdScore').value       = a.score || '';
    document.getElementById('grdMaxScore').value    = a.max_score || 100;
    document.getElementById('grdFeedback').value    = a.feedback || '';
    document.getElementById('grdAssignmentId').value = a.id;
    document.getElementById('gradingMsg').innerText  = '';
    document.getElementById('gradingModal').style.display = 'block';
}

async function sendScoreToStudent() {
    const id       = document.getElementById('grdAssignmentId').value;
    const score    = parseFloat(document.getElementById('grdScore').value);
    const maxScore = parseFloat(document.getElementById('grdMaxScore').value);
    const feedback = document.getElementById('grdFeedback').value.trim();
    const msgEl    = document.getElementById('gradingMsg');
    const btn      = document.getElementById('sendScoreBtn');

    if (isNaN(score) || score < 0) {
        msgEl.className = 'msg error';
        msgEl.innerText = '⚠️ Please enter a valid score.';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Sending...';

    try {
        const { error } = await sb.from('assignments').update({
            score, max_score: maxScore, feedback,
            status: 'graded', graded_at: new Date().toISOString()
        }).eq('id', id);

        if (error) throw error;
        msgEl.className = 'msg success';
        msgEl.innerText = '✅ Score sent! Student will see it immediately.';
        setTimeout(() => {
            document.getElementById('gradingModal').style.display = 'none';
            loadAssignments(
                document.getElementById('assignFilter')?.value || 'all',
                document.getElementById('assignSearch')?.value.trim() || ''
            );
        }, 1500);
    } catch (err) {
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ ' + safeErr(err);
    } finally {
        btn.disabled = false;
        btn.innerText = '📤 SEND SCORE TO STUDENT';
    }
}

async function deleteAssignment(id) {
    if (!confirm('Delete this graded assignment? This cannot be undone.')) return;
    const { error } = await sb.from('assignments').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    loadAssignments(
        document.getElementById('assignFilter')?.value || 'all',
        document.getElementById('assignSearch')?.value.trim() || ''
    );
}

// ═══════════════════════════════════════════════════════════════════════
// EXAM CARD RELEASE
// ═══════════════════════════════════════════════════════════════════════

let _ecInitDone = false;

async function initExamCardPage() {
    if (_ecInitDone) return;   // only populate dropdowns once
    _ecInitDone = true;

    const LEVELS = ['100','200','300','400','500','600','700','800','900','1000'];

    // Populate faculty (reuse allFaculties if already loaded)
    const faculties = allFaculties.length ? allFaculties : await (async () => {
        const { data } = await sb.from('faculties').select('*').order('name');
        return data || [];
    })();
    allFaculties = faculties;

    const ecFac = document.getElementById('ecFaculty');
    if (ecFac) {
        ecFac.innerHTML = '<option value="">-- Select Faculty --</option>' +
            faculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
    }

    const ecLvl = document.getElementById('ecLevel');
    if (ecLvl) {
        ecLvl.innerHTML = '<option value="">-- Choose Level --</option>' +
            LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');
    }
}

function updateEcDepts() {
    const facName = document.getElementById('ecFaculty').value;
    const deptEl  = document.getElementById('ecDept');
    if (!facName) { deptEl.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facObj  = allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    deptEl.innerHTML = filtered.length
        ? filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('')
        : '<option value="">No Departments Found</option>';
}

async function setExamCardRelease(released) {
    const faculty  = document.getElementById('ecFaculty').value;
    const dept     = document.getElementById('ecDept').value;
    const level    = document.getElementById('ecLevel').value;
    const semester = document.getElementById('ecSemester').value;
    const msgEl    = document.getElementById('ecStatusMsg');

    if (!faculty || !dept || !level || !semester) {
        msgEl.className = 'msg error';
        msgEl.innerText = '⚠️ Please select Faculty, Department, Level and Semester.';
        return;
    }

    const key    = `${dept.trim().toUpperCase()}_${level}_${semester}`;
    const label  = `${dept} | ${level}L | ${semester} Semester`;
    const action = released ? 'RELEASED' : 'REJECTED';

    try {
        // Read current config
        const { data: row } = await sb.from('admin_settings')
            .select('exam_card_config')
            .eq('id', 1)
            .maybeSingle();

        const config = (row && row.exam_card_config) ? row.exam_card_config : {};
        config[key] = released;

        const { error } = await sb.from('admin_settings')
            .upsert({ id: 1, exam_card_config: config }, { onConflict: 'id' });

        if (error) throw error;

        msgEl.className = released ? 'msg success' : 'msg error';
        msgEl.innerText = `${released ? '✅' : '❌'} Exam cards ${action} for ${label}.`;
    } catch (err) {
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ Failed: ' + safeErr(err);
    }
}


// ═══════════════════════════════════════════════════════════════════════
// EXAM SCHEDULER
// ═══════════════════════════════════════════════════════════════════════

let _scheduleInitDone = false;

function initExamSchedulerPage() {
    if (_scheduleInitDone) return;
    _scheduleInitDone = true;

    const LEVELS = ['100','200','300','400','500','600','700','800','900','1000'];

    // Fetch faculties/depts if not already loaded by question upload page
    (async () => {
        if (!allFaculties.length) {
            const { data: fData } = await sb.from('faculties').select('*').order('name');
            allFaculties = fData || [];
        }
        if (!allDepartments.length) {
            const { data: dData } = await sb.from('departments').select('*').order('name');
            allDepartments = dData || [];
        }

        const facSelect = document.getElementById('scheduleFaculty');
        if (facSelect) {
            facSelect.innerHTML = '<option value="">-- Select Faculty --</option>' +
                allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
        }
        const levelSelect = document.getElementById('scheduleLevel');
        if (levelSelect) {
            levelSelect.innerHTML = '<option value="">-- Choose Level --</option>' +
                LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');
        }
    })();
}

function updateScheduleDepartments() {
    const faculty = document.getElementById('scheduleFaculty').value;
    const deptSelect = document.getElementById('scheduleDept');
    if (!faculty) {
        deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>';
        return;
    }
    const facObj = allFaculties.find(f => f.name === faculty);
    if (!facObj) return;
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = filtered.length
        ? filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('')
        : '<option value="">No Departments Found</option>';
}
async function loadExamSchedule() {
    const faculty = document.getElementById('scheduleFaculty').value;
    const dept    = document.getElementById('scheduleDept').value;
    const level   = document.getElementById('scheduleLevel').value;
    const semester = document.getElementById('scheduleSemester').value;

    if (!faculty || !dept || !level || !semester) {
        alert("Please select Faculty, Department, Level and Semester.");
        return;
    }

    console.log("Loading schedule for:", { faculty, dept, level, semester });

    try {
        // Use ilike for faculty and department to avoid case / space issues
        const { data, error } = await sb
            .from('exam_schedules')
            .select('*')
            .ilike('faculty', faculty)
            .ilike('department', dept)
            .eq('level', level)
            .eq('semester', semester)
            .order('exam_date', { ascending: true });

        if (error) {
            console.error("Load schedule DB error:", error);
            alert("Database error: " + error.message);
            return;
        }

        renderScheduleList(data || []);
    } catch (err) {
        console.error("Load schedule exception:", err);
        alert("Failed to load schedule. Check console for details.");
    }
}
function renderScheduleList(entries) {
    const container = document.getElementById('scheduleEntriesList');
    if (!entries.length) {
        container.innerHTML = '<p style="color:#aaa;">No exam entries for this group.</p>';
        return;
    }
    container.innerHTML = entries.map(e => `
        <div style="border:1px solid #444; padding:10px; margin-bottom:8px; border-radius:6px; background:#1a1a1a;">
            <strong>${sanitise(e.course_code)}</strong><br>
            📅 ${new Date(e.exam_date).toLocaleDateString()} at ${e.exam_time.substring(0,5)} 
            ${e.venue ? `📍 ${sanitise(e.venue)}` : ''}
            <button data-id="${e.id}" class="delete-schedule-btn" style="float:right; background:#ff4444; border:none; padding:4px 8px; border-radius:4px; color:white;">Delete</button>
        </div>
    `).join('');
    // Attach delete handlers
    document.querySelectorAll('.delete-schedule-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteSchedule);
        btn.addEventListener('click', handleDeleteSchedule);
    });
}

async function handleDeleteSchedule(e) {
    const id = e.target.getAttribute('data-id');
    if (!confirm("Delete this exam entry?")) return;
    const { error } = await sb.from('exam_schedules').delete().eq('id', id);
    if (error) alert(error.message);
    else loadExamSchedule();
}

async function addScheduleEntry() {
    const faculty = document.getElementById('scheduleFaculty').value;
    const dept    = document.getElementById('scheduleDept').value;
    const level   = document.getElementById('scheduleLevel').value;
    const semester = document.getElementById('scheduleSemester').value;
    if (!faculty || !dept || !level || !semester) {
        alert("Please select full group first.");
        return;
    }
    const courseCode = document.getElementById('newCourseCode').value.trim().toUpperCase();
    const examDate   = document.getElementById('newExamDate').value;
    const examTime   = document.getElementById('newExamTime').value;
    const venue      = document.getElementById('newVenue').value.trim();
    if (!courseCode || !examDate || !examTime) {
        alert("Course code, date, and time are required.");
        return;
    }
    const { error } = await sb.from('exam_schedules').insert({
        faculty, department: dept, level, semester,
        course_code: courseCode, exam_date: examDate, exam_time: examTime, venue: venue || null
    });
    if (error) { alert(error.message); return; }
    alert("Entry added.");
    document.getElementById('newCourseCode').value = '';
    document.getElementById('newExamDate').value = '';
    document.getElementById('newExamTime').value = '';
    document.getElementById('newVenue').value = '';
    loadExamSchedule();
}

async function releaseExamSchedule() {
    const faculty = document.getElementById('scheduleFaculty').value;
    const dept    = document.getElementById('scheduleDept').value;
    const level   = document.getElementById('scheduleLevel').value;
    const semester = document.getElementById('scheduleSemester').value;
    if (!faculty || !dept || !level || !semester) {
        alert("Select full group first.");
        return;
    }
    const key = `${dept.trim().toUpperCase()}_${level}_${semester}`;
    if (!confirm(`Release exam schedule for ${dept} ${level}L ${semester}? Students will see the scheduled exams in their dashboard.`)) return;
    const { data: row } = await sb.from('admin_settings').select('exam_schedule_config').eq('id', 1).maybeSingle();
    let config = row?.exam_schedule_config || {};
    config[key] = true;
    const { error } = await sb.from('admin_settings').upsert({ id: 1, exam_schedule_config: config }, { onConflict: 'id' });
    if (error) { alert(error.message); return; }
    const msg = document.getElementById('scheduleReleaseMsg');
    msg.textContent = `✅ Exam schedule released for ${dept} ${level}L ${semester} Semester.`;
    msg.style.color = "#00ff88";
    setTimeout(() => msg.textContent = '', 4000);
}


let _psStudents = [];   // { matrix_no, name, currentScore }
let _psCurrentFilters = { faculty: '', dept: '', level: '', semester: '', course: '' };

let _caInitDone = false;

function initCaGatekeeperPage() {
    if (_caInitDone) return;
    _caInitDone = true;

    const LEVELS = ['100','200','300','400','500','600','700','800','900','1000'];

    // Populate faculty dropdown
    const caFacEl = document.getElementById('caFaculty');
    if (caFacEl) {
        caFacEl.innerHTML = '<option value="">-- Select Faculty --</option>' +
            allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
        caFacEl.addEventListener('change', updateCaDepartments);
    }

    const caLvlEl = document.getElementById('caLevel');
    if (caLvlEl) {
        caLvlEl.innerHTML = '<option value="">-- Choose Level --</option>' +
            LEVELS.map(l => `<option value="${l}">${l}</option>`).join('');
    }
}

function updateCaDepartments() {
    const facName  = document.getElementById('caFaculty').value;
    const deptEl   = document.getElementById('caDept');
    if (!facName) { deptEl.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facObj   = allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    deptEl.innerHTML = filtered.length
        ? '<option value="">-- Select Department --</option>' + filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('')
        : '<option value="">No Departments Found</option>';
}

async function createCaSession() {
    const faculty  = document.getElementById('caFaculty').value;
    const dept     = document.getElementById('caDept').value;
    const level    = document.getElementById('caLevel').value;
    const semester = document.getElementById('caSemester').value;
    const course   = document.getElementById('caCourse').value.trim().toUpperCase();

    if (!faculty || !dept || !level || !semester) return alert('⚠️ Please select Faculty, Department, Level and Semester.');
    if (!course) return alert('⚠️ Please enter a Course Code before generating a token.');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map(b => chars[b % chars.length]).join('');
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + 60);

    try {
        // Upsert: find existing CA session matching ALL 4 key fields
        const { data: existing } = await sb.from('exam_sessions')
            .select('id')
            .eq('is_ca', true)
            .eq('department', dept)
            .eq('course', course)
            .eq('level', level)
            .eq('semester', semester)
            .maybeSingle();

        let error;
        if (existing) {
            ({ error } = await sb.from('exam_sessions')
                .update({
                    token_code: token,
                    is_active:  'false',
                    faculty,
                    level,
                    semester,
                    end_time:   endTime.toISOString()
                })
                .eq('id', existing.id));
        } else {
            ({ error } = await sb.from('exam_sessions')
                .insert({
                    faculty,
                    department: dept,
                    level,
                    semester,
                    course,
                    token_code: token,
                    is_active:  'false',
                    is_ca:      true,
                    is_carryover: false,
                    end_time:   endTime.toISOString()
                }));
        }

        if (error) throw error;

        document.getElementById('caActiveToken').textContent  = token;
        document.getElementById('caActiveCourse').textContent = course;
        document.getElementById('caGateStatus').textContent   = 'CA GATE: CLOSED';
        document.getElementById('caGateStatus').style.color   = '#ff4444';
        document.getElementById('caToggleGateBtn').textContent  = '🔓 Open Gate';
        document.getElementById('caToggleGateBtn').style.background = 'var(--green)';
        document.getElementById('caToggleGateBtn').style.color = '#0f5132';
        alert(`✅ CA Token ${token} created for ${course} | ${dept} | ${level}L | ${semester} Semester`);
    } catch (err) {
        alert('❌ ' + safeErr(err));
    }
}

async function toggleCaGate() {
    const dept     = document.getElementById('caDept').value;
    const course   = document.getElementById('caCourse').value.trim().toUpperCase();
    const level    = document.getElementById('caLevel').value;
    const semester = document.getElementById('caSemester').value;
    if (!dept || !course || !level || !semester) return alert('⚠️ Please select Department, Level, Semester and enter Course code.');

    const statusSpan = document.getElementById('caGateStatus');
    const btn        = document.getElementById('caToggleGateBtn');
    const isOpening  = statusSpan.textContent.includes('CLOSED');

    const { error } = await sb.from('exam_sessions')
        .update({ is_active: isOpening ? 'true' : 'false' })
        .eq('is_ca', true)
        .eq('department', dept)
        .eq('course', course)
        .eq('level', level)
        .eq('semester', semester);

    if (!error) {
        statusSpan.textContent        = isOpening ? 'CA GATE: OPEN' : 'CA GATE: CLOSED';
        statusSpan.style.color        = isOpening ? 'var(--green)' : '#ff4444';
        btn.textContent               = isOpening ? '🔒 Close Gate' : '🔓 Open Gate';
        btn.style.background          = isOpening ? '#ff4444' : 'var(--green)';
        btn.style.color               = isOpening ? 'white' : '#0f5132';
    } else {
        alert('Gate toggle error: ' + safeErr(error));
    }
}

let _caTimerInterval = null;

async function startCaExam() {
    const dept     = document.getElementById('caDept').value;
    const course   = document.getElementById('caCourse').value.trim().toUpperCase();
    const level    = document.getElementById('caLevel').value;
    const semester = document.getElementById('caSemester').value;
    const mins     = parseInt(document.getElementById('caDuration').value);
    const token    = document.getElementById('caActiveToken').textContent;

    if (!dept || !course || !level || !semester || token === '----' || isNaN(mins) || mins <= 0) {
        return alert('⚠️ Generate a token, select all fields, and enter a valid duration.');
    }

    const endTime = new Date(Date.now() + mins * 60000).toISOString();
    const { error } = await sb.from('exam_sessions')
        .update({ is_active: 'true', end_time: endTime })
        .eq('is_ca', true)
        .eq('department', dept)
        .eq('course', course)
        .eq('level', level)
        .eq('semester', semester);

    if (error) { alert('DB error: ' + safeErr(error)); return; }

    document.getElementById('caGateStatus').textContent        = 'CA GATE: OPEN';
    document.getElementById('caGateStatus').style.color        = 'var(--green)';
    document.getElementById('caToggleGateBtn').textContent     = '🔒 Close Gate';
    document.getElementById('caToggleGateBtn').style.background = '#ff4444';
    document.getElementById('caToggleGateBtn').style.color     = 'white';

    alert(`✅ CA started for ${course} | ${dept} | ${level}L | ${semester} Semester!`);
    runCaTimer(mins * 60, dept, course, level, semester);
}

function runCaTimer(totalSeconds, dept, course, level, semester) {
    clearInterval(_caTimerInterval);
    const display = document.getElementById('caTimerDisplay');
    _caTimerInterval = setInterval(async () => {
        if (totalSeconds <= 0) {
            clearInterval(_caTimerInterval);
            if (display) display.textContent = '00:00';
            await autoCloseCaGate(dept, course, level, semester);
            return;
        }
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        if (display) display.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        totalSeconds--;
    }, 1000);
}

async function autoCloseCaGate(dept, course, level, semester) {
    await sb.from('exam_sessions')
        .update({ is_active: 'false' })
        .eq('is_ca', true)
        .eq('department', dept)
        .eq('course', course)
        .eq('level', level)
        .eq('semester', semester);

    document.getElementById('caGateStatus').textContent        = 'CA GATE: CLOSED (EXPIRED)';
    document.getElementById('caGateStatus').style.color        = '#ff4444';
    document.getElementById('caActiveToken').textContent       = '----';
    document.getElementById('caActiveCourse').textContent      = '---';
    document.getElementById('caToggleGateBtn').textContent     = '🔓 Open Gate';
    document.getElementById('caToggleGateBtn').style.background = 'var(--green)';
    document.getElementById('caToggleGateBtn').style.color     = '#0f5132';
}

async function forceLogoutCa() {
    const dept     = document.getElementById('caDept').value;
    const course   = document.getElementById('caCourse').value.trim().toUpperCase();
    const level    = document.getElementById('caLevel').value;
    const semester = document.getElementById('caSemester').value;
    if (!dept || !course || !level || !semester) return alert('⚠️ Please select all fields and enter Course code.');

    if (!confirm(`🚨 Force logout ALL students currently in CA "${course}" for ${dept} ${level}L ${semester}?\n\nTheir answers will be lost and the gate will be closed.`)) return;

    // Get students currently active in this CA course
    const { data: liveRows, error: liveErr } = await sb.from('live_monitoring')
        .select('matrix_no')
        .eq('current_subject', course)
        .eq('status', 'ACTIVE');

    if (liveErr) return alert('❌ Error fetching live students: ' + safeErr(liveErr));
    if (!liveRows || liveRows.length === 0) {
        return alert('No active students currently in that CA exam.');
    }

    const matrixNos = liveRows.map(s => s.matrix_no);

    const { error: kickErr } = await sb.from('live_monitoring')
        .update({ status: 'KICKED' })
        .in('matrix_no', matrixNos);
    if (kickErr) return alert('❌ Kick error: ' + safeErr(kickErr));

    const { error: gateErr } = await sb.from('exam_sessions')
        .update({ is_active: 'false' })
        .eq('is_ca', true)
        .eq('department', dept)
        .eq('course', course)
        .eq('level', level)
        .eq('semester', semester);
    if (gateErr) return alert('❌ Gate close error: ' + safeErr(gateErr));

    clearInterval(_caTimerInterval);
    document.getElementById('caTimerDisplay').textContent      = '00:00';
    document.getElementById('caGateStatus').textContent        = 'CA GATE: CLOSED';
    document.getElementById('caGateStatus').style.color        = '#ff4444';
    document.getElementById('caToggleGateBtn').textContent     = '🔓 Open Gate';
    document.getElementById('caToggleGateBtn').style.background = 'var(--green)';
    document.getElementById('caToggleGateBtn').style.color     = '#0f5132';

    alert(`✅ ${matrixNos.length} student(s) kicked. CA gate closed for ${course} | ${dept}.`);
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

    initSidebar();
    initUploadPage();
    loadAssignments();

    // ── CA Gatekeeper ──
    document.getElementById('caGenerateTokenBtn')?.addEventListener('click', createCaSession);
    document.getElementById('caToggleGateBtn')?.addEventListener('click', toggleCaGate);
    document.getElementById('caStartExamBtn')?.addEventListener('click', startCaExam);
    document.getElementById('caForceLogoutBtn')?.addEventListener('click', forceLogoutCa);

    // ── Question upload ──
    document.getElementById('faculty')?.addEventListener('change', updateDepts);
    document.getElementById('chooseFileBtn')?.addEventListener('click', () => {
        document.getElementById('imageFile').click();
    });
    document.getElementById('imageFile')?.addEventListener('change', handleMediaPreview);
    document.getElementById('qText')?.addEventListener('input', updatePreview);
    document.getElementById('op1')?.addEventListener('input', updatePreview);
    document.getElementById('op2')?.addEventListener('input', updatePreview);
    document.getElementById('op3')?.addEventListener('input', updatePreview);
    document.getElementById('op4')?.addEventListener('input', updatePreview);
    document.getElementById('uploadBtn')?.addEventListener('click', uploadEverything);
    
    // ── Paper Exam Scores ──
document.getElementById('psFaculty')?.addEventListener('change', updatePsDepartments);
document.getElementById('psLoadStudentsBtn')?.addEventListener('click', loadStudentsForPaperScores);
document.getElementById('psSaveScoresBtn')?.addEventListener('click', savePaperScores);
document.getElementById('psBulkSetBtn')?.addEventListener('click', bulkSetScores);
document.getElementById('psReleaseBtn')?.addEventListener('click', () => setPaperResultsRelease(true));
document.getElementById('psHideBtn')?.addEventListener('click', () => setPaperResultsRelease(false));
    
    // ── Exam Card Release ──
    document.getElementById('ecFaculty')?.addEventListener('change', updateEcDepts);
    document.getElementById('ecReleaseBtn')?.addEventListener('click', () => setExamCardRelease(true));
    document.getElementById('ecRejectBtn')?.addEventListener('click', () => setExamCardRelease(false));
    
    // ── Exam Scheduler ──
document.getElementById('scheduleFaculty')?.addEventListener('change', updateScheduleDepartments);
document.getElementById('loadScheduleBtn')?.addEventListener('click', loadExamSchedule);
document.getElementById('addScheduleEntryBtn')?.addEventListener('click', addScheduleEntry);
document.getElementById('releaseScheduleBtn')?.addEventListener('click', releaseExamSchedule);

    // ── Bursary staff ──
document.getElementById('createBursarBtn')?.addEventListener('click', createBursarAccount);

document.getElementById('bursarStaffList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id   = btn.getAttribute('data-id');
    const name = btn.getAttribute('data-name');
    
    if (btn.classList.contains('reset-pass-btn')) {
        openResetModal(id, name);
    } else if (btn.classList.contains('unlock-btn')) {
        unlockBursar(id);
    } else if (btn.classList.contains('delete-bursar-btn')) {
        deleteBursar(id, name);
    }
});

    // ── Assignments ──
    document.getElementById('assignSearchBtn')?.addEventListener('click', () => {
        loadAssignments(
            document.getElementById('assignFilter').value,
            document.getElementById('assignSearch').value.trim()
        );
    });
    document.getElementById('assignmentList')?.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        if (btn.classList.contains('grade-btn')) openGradingModal(id);
        else if (btn.classList.contains('delete-assign-btn')) deleteAssignment(id);
    });
    document.getElementById('closeGradingModal')?.addEventListener('click', () => {
        document.getElementById('gradingModal').style.display = 'none';
    });
    document.getElementById('sendScoreBtn')?.addEventListener('click', sendScoreToStudent);



    // ── Reset password modal ──
    document.getElementById('closeResetModal')?.addEventListener('click', () => {
        document.getElementById('resetPassModal').style.display = 'none';
    });
    document.getElementById('confirmResetBtn')?.addEventListener('click', confirmResetPassword);

    // Close modals on backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });
});

// ── PAPER EXAM SCORES ─────────────────────────────────────────────────
async function loadStudentsForPaperScores() {
    const faculty = document.getElementById('psFaculty').value;
    const dept    = document.getElementById('psDept').value;
    const level   = document.getElementById('psLevel').value;
    const semester = document.getElementById('psSemester').value;
    const course   = document.getElementById('psCourse').value.trim().toUpperCase();

    const msgDiv = document.getElementById('psStatusMsg');
    if (!faculty || !dept || !level || !semester || !course) {
        msgDiv.className = 'msg error';
        msgDiv.innerText = '⚠️ Please fill all fields and enter a course name.';
        return;
    }

    // Store current filters for release/hide
    _psCurrentFilters = { faculty, dept, level, semester, course };

    document.getElementById('psCourseDisplay').innerText = course;
    msgDiv.className = 'msg';
    msgDiv.innerText = 'Loading students...';

    try {
        // 1. Fetch students in this cohort
        const { data: students, error: stuErr } = await sb
            .from('students')
            .select('matrix_no, name')
            .eq('department', dept)
            .eq('level', level)
            .eq('semester', semester);
        if (stuErr) throw stuErr;
        if (!students.length) {
            msgDiv.className = 'msg error';
            msgDiv.innerText = 'No students found for this cohort.';
            document.getElementById('psScoresTable').innerHTML = '<p style="color:var(--muted);">No students.</p>';
            return;
        }

        // 2. Fetch existing exam scores and CA scores for this course
        const matrixList = students.map(s => s.matrix_no);
        const { data: scores, error: scoreErr } = await sb
            .from('results')
            .select('matrix_no, score, is_ca')
            .in('matrix_no', matrixList)
            .eq('subject', course);
        if (scoreErr) throw scoreErr;

        const examScoreMap = {};
        const caScoreMap   = {};
        scores.forEach(s => {
            if (s.is_ca) caScoreMap[s.matrix_no]   = s.score;
            else          examScoreMap[s.matrix_no] = s.score;
        });

        _psStudents = students.map(s => ({
            matrix_no:    s.matrix_no,
            name:         s.name,
            currentScore: examScoreMap[s.matrix_no] !== undefined ? examScoreMap[s.matrix_no] : '',
            caScore:      caScoreMap[s.matrix_no]   !== undefined ? caScoreMap[s.matrix_no]   : ''
        }));

        renderPsScoreTable();
        msgDiv.className = 'msg success';
        msgDiv.innerText = `✅ Loaded ${_psStudents.length} student(s). Existing scores shown.`;
    } catch (err) {
        console.error(err);
        msgDiv.className = 'msg error';
        msgDiv.innerText = '❌ ' + safeErr(err);
    }
}

// ── GRADING HELPER ────────────────────────────────────────────────────
function computeGrade(total) {
    if (total >= 70) return { grade: 'A', remark: 'Excellent',  color: '#00ff88' };
    if (total >= 60) return { grade: 'B', remark: 'Very Good',  color: '#4ade80' };
    if (total >= 50) return { grade: 'C', remark: 'Good',       color: '#facc15' };
    if (total >= 40) return { grade: 'D', remark: 'Pass',       color: '#fb923c' };
    return            { grade: 'F', remark: 'Fail',       color: '#ff4444' };
}

function renderPsScoreTable() {
    const container = document.getElementById('psScoresTable');
    if (!_psStudents.length) {
        container.innerHTML = '<p style="color:var(--muted);">No students loaded.</p>';
        return;
    }

    const mkInp = (cls, idx, val, max, color) =>
        `<input type="number" class="${cls}" data-idx="${idx}"
                value="${val !== null && val !== '' ? val : ''}"
                min="0" max="${max}" step="0.5"
                oninput="recalcPsRow(${idx})"
                style="width:56px;padding:5px 3px;border-radius:6px;background:#0a1a10;
                       border:1px solid ${color}44;color:${color};text-align:center;font-size:0.85rem;">`;

    const rows = _psStudents.map((s, idx) => {
        const ca  = s.caScore      !== undefined && s.caScore      !== '' ? parseFloat(s.caScore)      : null;
        const ex  = s.currentScore !== undefined && s.currentScore !== '' ? parseFloat(s.currentScore) : null;
        const tot = (ca !== null || ex !== null) ? Math.min(100, (ca ?? 0) + (ex ?? 0)) : null;
        const { grade, remark, color } = tot !== null ? computeGrade(tot) : { grade: '—', remark: '—', color: '#555' };
        return `
        <tr style="border-bottom:1px solid #1a2a1a;">
            <td style="padding:8px;font-size:0.82rem;white-space:nowrap;">${sanitise(s.matrix_no)}</td>
            <td style="padding:8px;font-size:0.82rem;white-space:nowrap;">${sanitise(s.name)}</td>
            <td style="padding:6px 4px;text-align:center;">${mkInp('ps-ca-input',   idx, ca, 30, '#4ade80')}</td>
            <td style="padding:6px 4px;text-align:center;">${mkInp('ps-exam-input', idx, ex, 70, '#00ff88')}</td>
            <td class="ps-total-${idx}"  style="padding:8px 4px;text-align:center;font-weight:bold;color:${color};">${tot !== null ? tot : '—'}</td>
            <td class="ps-grade-${idx}"  style="padding:8px 4px;text-align:center;font-weight:bold;color:${color};">${grade}</td>
            <td class="ps-remark-${idx}" style="padding:8px 4px;text-align:center;font-size:0.78rem;color:${color};white-space:nowrap;">${remark}</td>
        </tr>`;
    }).join('');

    container.innerHTML = `
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;min-width:540px;">
            <thead>
                <tr style="color:#00ff88;border-bottom:2px solid #2a4a2a;font-size:0.8rem;text-align:center;">
                    <th style="padding:10px 8px;text-align:left;">Matrix No</th>
                    <th style="padding:10px 8px;text-align:left;">Name</th>
                    <th style="padding:10px 4px;">CA<br><span style="color:#4ade80;font-size:0.7rem;">/30</span></th>
                    <th style="padding:10px 4px;">Exam<br><span style="color:#00ff88;font-size:0.7rem;">/70</span></th>
                    <th style="padding:10px 4px;">Total<br><span style="font-size:0.7rem;color:var(--muted);">/100</span></th>
                    <th style="padding:10px 4px;">Grade</th>
                    <th style="padding:10px 4px;">Remark</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        </div>
        <p style="margin-top:8px;font-size:0.72rem;color:var(--muted);">
            CA 0–30 · Exam 0–70 · Total = CA + Exam · Grade updates live as you type.
        </p>`;
}

function recalcPsRow(idx) {
    const caEl = document.querySelector('.ps-ca-input[data-idx="' + idx + '"]');
    const exEl = document.querySelector('.ps-exam-input[data-idx="' + idx + '"]');
    if (!caEl || !exEl) return;

    const ca  = caEl.value.trim() !== '' ? Math.min(30, Math.max(0, parseFloat(caEl.value))) : null;
    const ex  = exEl.value.trim() !== '' ? Math.min(70, Math.max(0, parseFloat(exEl.value))) : null;
    const tot = (ca !== null || ex !== null) ? Math.min(100, (ca ?? 0) + (ex ?? 0)) : null;
    const { grade, remark, color } = tot !== null ? computeGrade(tot) : { grade: '—', remark: '—', color: '#555' };

    const set = (sel, val, c) => { const el = document.querySelector(sel); if (el) { el.textContent = val; el.style.color = c; } };
    set('.ps-total-'  + idx, tot !== null ? tot : '—', color);
    set('.ps-grade-'  + idx, grade,  color);
    set('.ps-remark-' + idx, remark, color);

    if (_psStudents[idx]) {
        _psStudents[idx].caScore      = ca !== null ? ca : '';
        _psStudents[idx].currentScore = ex !== null ? ex : '';
    }
}

async function savePaperScores() {
    const course = _psCurrentFilters.course;
    const dept   = _psCurrentFilters.dept;
    const level  = _psCurrentFilters.level;
    const semester = _psCurrentFilters.semester;
    const faculty = _psCurrentFilters.faculty;
    const msgDiv = document.getElementById('psStatusMsg');

    if (!course || !_psStudents.length) {
        msgDiv.className = 'msg error';
        msgDiv.innerText = '⚠️ Load students first.';
        return;
    }

    const updates = [];

    // CA scores (0-30 direct)
    document.querySelectorAll('.ps-ca-input').forEach(inp => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        const s = _psStudents[idx];
        if (!s) return;
        const v = inp.value.trim();
        if (v === '') return;
        const score = Math.min(30, Math.max(0, parseFloat(v)));
        if (isNaN(score)) return;
        updates.push({ matrix_no: s.matrix_no, name: s.name, subject: course, course, score,
                       is_ca: true, department: dept, level, semester, faculty });
    });

    // Exam scores (0-70 direct)
    document.querySelectorAll('.ps-exam-input').forEach(inp => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        const s = _psStudents[idx];
        if (!s) return;
        const v = inp.value.trim();
        if (v === '') return;
        const score = Math.min(70, Math.max(0, parseFloat(v)));
        if (isNaN(score)) return;
        updates.push({ matrix_no: s.matrix_no, name: s.name, subject: course, course, score,
                       is_ca: false, department: dept, level, semester, faculty });
    });

    if (updates.length === 0) {
        msgDiv.className = 'msg error';
        msgDiv.innerText = 'No scores entered.';
        return;
    }

    const saveBtn = document.getElementById('psSaveScoresBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        for (const rec of updates) {
            const { error } = await sb
                .from('results')
                .upsert(rec, { onConflict: 'matrix_no, subject, is_ca' });
            if (error) throw error;
        }
        msgDiv.className = 'msg success';
        msgDiv.innerText = `✅ Saved ${updates.length} score(s) for ${course}.`;
        await loadStudentsForPaperScores(); // refresh table
    } catch (err) {
        console.error(err);
        msgDiv.className = 'msg error';
        msgDiv.innerText = '❌ ' + safeErr(err);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save Scores';
    }
}


function bulkSetScores() {
    const bulkVal = document.getElementById('psBulkValue').value;
    if (bulkVal === '') return;
    const raw = parseFloat(bulkVal);
    if (isNaN(raw)) return;
    // Bulk-fill exam inputs only (Exam /70)
    document.querySelectorAll('.ps-exam-input').forEach((inp, i) => {
        inp.value = Math.min(70, Math.max(0, raw));
        recalcPsRow(parseInt(inp.getAttribute('data-idx')));
    });
}

async function setPaperResultsRelease(released) {
    const { faculty, dept, level, semester } = _psCurrentFilters;
    if (!faculty || !dept || !level || !semester) {
        document.getElementById('psStatusMsg').innerHTML = '<span class="error">⚠️ Load students first to set release.</span>';
        return;
    }

    const key = `${dept.trim().toUpperCase()}_${level}_${semester}`;
    const action = released ? 'RELEASED' : 'HIDDEN';
    const msgDiv = document.getElementById('psStatusMsg');

    try {
        // Read current config from admin_settings (use 'results_released_config' column)
        let { data: row } = await sb.from('admin_settings').select('results_released_config').eq('id', 1).maybeSingle();
        let config = (row && row.results_released_config) ? row.results_released_config : {};
        config[key] = released;

        const { error } = await sb.from('admin_settings').upsert(
            { id: 1, results_released_config: config },
            { onConflict: 'id' }
        );
        if (error) throw error;

        msgDiv.className = `msg ${released ? 'success' : 'error'}`;
        msgDiv.innerText = `✅ Results ${action} for ${dept} ${level}L ${semester} Semester.`;
    } catch (err) {
        msgDiv.className = 'msg error';
        msgDiv.innerText = '❌ ' + safeErr(err);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// PAPER EXAM SCORES DROPDOWN ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════

function initPaperScoresPage() {
    populatePsFaculties();
    
    // Add event listener so that when a Faculty changes, the Department dropdown updates automatically
    const psFacEl = document.getElementById('psFaculty');
    if (psFacEl) {
        psFacEl.removeEventListener('change', updatePsDepartments); // Prevent double attachment
        psFacEl.addEventListener('change', updatePsDepartments);
    }
}

function populatePsFaculties() {
    const psFacSelect = document.getElementById('psFaculty');
    if (!psFacSelect) return;
    
    // Use the already downloaded allFaculties global array
    psFacSelect.innerHTML = '<option value="">-- Select Faculty --</option>' +
        allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
}

function updatePsDepartments() {
    const selectedFac = document.getElementById('psFaculty').value;
    const psDeptEl    = document.getElementById('psDept');
    if (!psDeptEl) return;
    
    if (!selectedFac) { 
        psDeptEl.innerHTML = '<option value="">-- Select Faculty First --</option>'; 
        return; 
    }
    
    // Find matching faculty ID
    const facObj = allFaculties.find(f => f.name === selectedFac);
    if (!facObj) return;
    
    // Filter departments belonging to this specific faculty
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    
    psDeptEl.innerHTML = filtered.length > 0
        ? '<option value="">-- Select Department --</option>' + filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('')
        : '<option value="">No Departments Found</option>';
}