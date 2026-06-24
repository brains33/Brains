// ═══════════════════════════════════════════════════════════════════════
// lecturer.js — BRAINS AI Lecturer Portal
// ═══════════════════════════════════════════════════════════════════════

function sanitise(str) {
    if (str === null || str === undefined) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
}
function safeErr(err) {
    return ((err && err.message) ? String(err.message) : 'Unexpected error').substring(0, 120);
}

// Maintenance check
(async function brainsSecurity() {
    try {
        const r = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy',
            { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ action:'check-system-status' }) }
        );
        const d = await r.json();
        if (r.status === 503 || d.error === 'MAINTENANCE_MODE') {
            document.documentElement.innerHTML =
                '<html><body style="background:#060d08;color:white;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">' +
                '<div style="text-align:center"><h1 style="color:#ff4444">System Locked</h1>' +
                '<p style="color:#aaa">BRAINS AI is under maintenance. Contact the ICT department.</p></div></body></html>';
        }
    } catch(e) { /* skip */ }
}());

// Config
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';

const sb = supabase.createClient(S_URL, S_KEY, {
    global: { headers: { 'x-lecturer-token': sessionStorage.getItem('lecturerToken') || '' } }
});

// Auth guard
(function() {
    if (sessionStorage.getItem('lecturerLoggedIn') !== 'true' ||
        !sessionStorage.getItem('lecturerToken')) {
        window.location.replace('lecturer_login.html');
    }
}());

// Global state
let lecturerData   = null;
let _students      = [];
let _currentFilter = { faculty:'', dept:'', level:'', semester:'', courseCode:'', courseTitle:'' };

// ═════════════════ INIT ═════════════════
window.addEventListener('DOMContentLoaded', () => {
    try { lecturerData = JSON.parse(sessionStorage.getItem('lecturerData') || 'null'); }
    catch { lecturerData = null; }

    if (!lecturerData) {
        sessionStorage.clear();
        window.location.replace('lecturer_login.html');
        return;
    }

    initSidebar();
    populateWelcome();
    buildDropdowns('lf');
    buildDropdowns('pdf');
    populateProfile();
    bindEvents();
});

// ═════════════════ SIDEBAR ═════════════════
function initSidebar() {
    const navItems  = document.querySelectorAll('.nav-item[data-page]');
    const hamburger = document.getElementById('hamburger');
    const sidebar   = document.getElementById('sidebar');
    const overlay   = document.getElementById('sidebarOverlay');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const t = document.getElementById('page-' + item.getAttribute('data-page'));
            if (t) t.classList.add('active');
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    });

    hamburger?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });
    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.replace('lecturer_login.html');
    });
}

// ═════════════════ WELCOME BAR ═════════════════
function populateWelcome() {
    const groups = Array.isArray(lecturerData.assigned_courses) ? lecturerData.assigned_courses : [];
    document.getElementById('sbLecName').textContent  = lecturerData.name || 'Lecturer';
    document.getElementById('welcomeName').textContent = 'Welcome, ' + lecturerData.name;
    document.getElementById('welcomeSub').textContent  =
        groups.length + ' assignment group' + (groups.length !== 1 ? 's' : '') + ' assigned to you';
    document.getElementById('grpBadge').textContent =
        groups.length + ' group' + (groups.length !== 1 ? 's' : '');
}

// ═════════════════ CASCADING DROPDOWNS ═════════════════
function buildDropdowns(prefix) {
    const groups = Array.isArray(lecturerData.assigned_courses) ? lecturerData.assigned_courses : [];

    // Unique faculties
    const faculties = [...new Set(groups.map(g => g.faculty).filter(Boolean))].sort();
    const facSel = document.getElementById(prefix + 'Faculty');
    facSel.innerHTML = '<option value="">-- Select Faculty --</option>' +
        faculties.map(f => '<option value="' + sanitise(f) + '">' + sanitise(f) + '</option>').join('');

    _resetDrop(prefix + 'Dept',     '-- Select Faculty First --');
    _resetDrop(prefix + 'Level',    '-- Select Dept First --');
    _resetDrop(prefix + 'Semester', '-- Select Level First --');
    _resetDrop(prefix + 'Course',   '-- Select Semester First --');

    // Faculty → Dept
    facSel.addEventListener('change', function() {
        const fac   = this.value;
        const depts = [...new Set(groups.filter(g => g.faculty === fac).map(g => g.department))].sort();
        const dSel  = document.getElementById(prefix + 'Dept');
        dSel.innerHTML = '<option value="">-- Select Department --</option>' +
            depts.map(d => '<option value="' + sanitise(d) + '">' + sanitise(d) + '</option>').join('');
        dSel.disabled = false;
        _resetDrop(prefix + 'Level',    '-- Select Dept First --');
        _resetDrop(prefix + 'Semester', '-- Select Level First --');
        _resetDrop(prefix + 'Course',   '-- Select Semester First --');
    });

    // Dept → Level
    document.getElementById(prefix + 'Dept').addEventListener('change', function() {
        const fac    = facSel.value;
        const dept   = this.value;
        // Normalize: strip trailing 'L' so value is always '100', display is always '100L'
        const levels = [...new Set(
            groups.filter(g => g.faculty === fac && g.department === dept)
                  .map(g => String(g.level).replace(/L$/i, ''))
        )].sort((a, b) => parseInt(a) - parseInt(b));
        const lSel = document.getElementById(prefix + 'Level');
        lSel.innerHTML = '<option value="">-- Select Level --</option>' +
            levels.map(l => '<option value="' + sanitise(l) + '">' + sanitise(l) + 'L</option>').join('');
        lSel.disabled = false;
        _resetDrop(prefix + 'Semester', '-- Select Level First --');
        _resetDrop(prefix + 'Course',   '-- Select Semester First --');
    });

    // Level → Semester
    document.getElementById(prefix + 'Level').addEventListener('change', function() {
        const fac   = facSel.value;
        const dept  = document.getElementById(prefix + 'Dept').value;
        const level = this.value; // always clean '100' now
        const sems  = [...new Set(
            // Match against both '100' and '100L' in case old data has either format
            groups.filter(g => g.faculty === fac && g.department === dept &&
                               String(g.level).replace(/L$/i, '') === level)
                  .map(g => g.semester)
        )].sort();
        const sSel = document.getElementById(prefix + 'Semester');
        sSel.innerHTML = '<option value="">-- Select Semester --</option>' +
            sems.map(s => '<option value="' + sanitise(s) + '">' + sanitise(s) + ' Semester</option>').join('');
        sSel.disabled = false;
        _resetDrop(prefix + 'Course', '-- Select Semester First --');
    });

    // Semester → Course
    document.getElementById(prefix + 'Semester').addEventListener('change', function() {
        const fac      = facSel.value;
        const dept     = document.getElementById(prefix + 'Dept').value;
        const level    = document.getElementById(prefix + 'Level').value; // clean '100'
        const semester = this.value;
        const group    = groups.find(g =>
            g.faculty === fac && g.department === dept &&
            String(g.level).replace(/L$/i, '') === level && g.semester === semester
        );
        const courses = (group && Array.isArray(group.courses)) ? group.courses : [];
        const cSel = document.getElementById(prefix + 'Course');
        cSel.innerHTML = '<option value="">-- Select Course --</option>' +
            courses.map(c => {
                const code  = typeof c === 'string' ? c : (c.code  || '');
                const title = typeof c === 'string' ? '' : (c.title || '');
                return '<option value="' + sanitise(code) + '" data-title="' + sanitise(title) + '">' +
                    sanitise(title ? code + ' \u2014 ' + title : code) + '</option>';
            }).join('');
        cSel.disabled = false;
    });
}

function _resetDrop(id, placeholder) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">' + placeholder + '</option>';
    el.disabled  = true;
}

// ═════════════════ GRADE HELPER ═════════════════
function computeGrade(total) {
    if (total >= 70) return { grade:'A', remark:'Excellent', color:'#00ff88' };
    if (total >= 60) return { grade:'B', remark:'Very Good', color:'#4ade80' };
    if (total >= 50) return { grade:'C', remark:'Good',      color:'#facc15' };
    if (total >= 40) return { grade:'D', remark:'Pass',      color:'#fb923c' };
    return                   { grade:'F', remark:'Fail',     color:'#ff4444' };
}

// ═════════════════ LOAD STUDENTS ═════════════════
async function loadStudents() {
    const faculty   = document.getElementById('lfFaculty').value;
    const dept      = document.getElementById('lfDept').value;
    const level     = document.getElementById('lfLevel').value;
    const semester  = document.getElementById('lfSemester').value;
    const cSel      = document.getElementById('lfCourse');
    const courseCode  = cSel.value;
    const courseTitle = cSel.options[cSel.selectedIndex]?.getAttribute('data-title') || '';
    const msgEl     = document.getElementById('lfStatusMsg');

    msgEl.className = 'msg'; msgEl.innerText = '';

    if (!faculty || !dept || !level || !semester || !courseCode) {
        msgEl.className = 'msg error';
        msgEl.innerText = '⚠️ Please select all fields.';
        return;
    }

    // Normalize: strip trailing L ('100L'→'100'), strip 'Semester' suffix from semester
    const deptQ     = dept.trim();
    const levelQ    = level.trim().replace(/L$/i, '');
    const semesterQ = semester.trim().replace(/\s*Semester$/i, '');

    _currentFilter = { faculty, dept: deptQ, level: levelQ, semester: semesterQ, courseCode, courseTitle };

    const loadBtn = document.getElementById('lfLoadBtn');
    loadBtn.disabled = true; loadBtn.textContent = 'Loading...';

    try {
        const { data: students, error: stuErr } = await sb
            .from('students')
            .select('matrix_no, name')
            .eq('department', deptQ)
            .eq('level', levelQ)
            .eq('semester', semesterQ)
            .order('name');

        if (stuErr) throw stuErr;

        if (!students || !students.length) {
            msgEl.className = 'msg error';
            msgEl.innerText = '⚠️ No students found for this cohort.';
            document.getElementById('scoresTableWrap').innerHTML =
                '<div class="state-msg"><span class="si">🔍</span>No students found.</div>';
            document.getElementById('actionBar').style.display   = 'none';
            document.getElementById('cohortStrip').style.display = 'none';
            return;
        }

        const { data: scores, error: scoreErr } = await sb
            .from('results')
            .select('matrix_no, score, is_ca')
            .in('matrix_no', students.map(s => s.matrix_no))
            .eq('subject', courseCode);
        if (scoreErr) throw scoreErr;

        const caMap = {}, examMap = {};
        (scores || []).forEach(r => {
            if (r.is_ca) caMap[r.matrix_no]   = r.score;
            else          examMap[r.matrix_no] = r.score;
        });

        _students = students.map(s => ({
            matrix_no:  s.matrix_no,
            name:       s.name,
            caScore:    caMap[s.matrix_no]   !== undefined ? caMap[s.matrix_no]   : '',
            examScore:  examMap[s.matrix_no] !== undefined ? examMap[s.matrix_no] : ''
        }));

        renderScoreTable();

        const label = courseTitle ? courseCode + ' \u2014 ' + courseTitle : courseCode;
        document.getElementById('tableCourseName').textContent = label;
        document.getElementById('stripCourse').textContent = label;
        document.getElementById('stripDept').textContent   = dept;
        document.getElementById('stripLevel').textContent  = level;
        document.getElementById('stripSem').textContent    = semester;
        document.getElementById('cohortStrip').style.display = 'block';
        document.getElementById('actionBar').style.display   = 'flex';

        msgEl.className = 'msg success';
        msgEl.innerText = '✅ ' + _students.length + ' student(s) loaded. Existing scores shown.';

    } catch (err) {
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ ' + safeErr(err);
    } finally {
        loadBtn.disabled = false; loadBtn.textContent = '📋 Load Students';
    }
}

// ═════════════════ RENDER SCORE TABLE ═════════════════
function renderScoreTable() {
    const wrap = document.getElementById('scoresTableWrap');
    if (!_students.length) {
        wrap.innerHTML = '<div class="state-msg"><span class="si">🔍</span>No students.</div>';
        return;
    }

    const mkInp = (cls, idx, val, max, borderCol) =>
        '<input type="number" class="score-input ' + cls + '" data-idx="' + idx + '"' +
        ' value="' + (val !== '' && val !== null ? val : '') + '"' +
        ' min="0" max="' + max + '" step="0.5" oninput="recalcRow(' + idx + ')"' +
        ' style="border-color:' + borderCol + '44;">';

    const rows = _students.map((s, idx) => {
        const ca  = s.caScore   !== '' && s.caScore   !== null ? parseFloat(s.caScore)   : null;
        const ex  = s.examScore !== '' && s.examScore !== null ? parseFloat(s.examScore) : null;
        const tot = (ca !== null || ex !== null) ? Math.min(100, (ca ?? 0) + (ex ?? 0)) : null;
        const { grade, remark, color } = tot !== null ? computeGrade(tot) : { grade:'—', remark:'—', color:'#555' };
        return '<tr>' +
            '<td style="font-size:0.8rem; text-align:center;">' + (idx+1) + '</td>' +
            '<td style="font-size:0.8rem; white-space:nowrap;">' + sanitise(s.matrix_no) + '</td>' +
            '<td style="font-size:0.8rem;">' + sanitise(s.name) + '</td>' +
            '<td>' + mkInp('lf-ca-input',   idx, ca, 30, '#4ade80') + '</td>' +
            '<td>' + mkInp('lf-exam-input', idx, ex, 70, '#00ff88') + '</td>' +
            '<td class="lf-total-' + idx + '" style="font-weight:bold; color:' + color + ';">' + (tot !== null ? tot : '—') + '</td>' +
            '<td class="lf-grade-' + idx + '" style="font-weight:bold; color:' + color + ';">' + grade + '</td>' +
            '<td class="lf-remark-' + idx + '" style="font-size:0.78rem; color:' + color + '; white-space:nowrap;">' + remark + '</td>' +
            '</tr>';
    }).join('');

    wrap.innerHTML =
        '<div style="overflow-x:auto;">' +
        '<table class="score-table">' +
        '<thead><tr>' +
        '<th style="text-align:center; width:36px;">#</th>' +
        '<th style="text-align:left;">Matrix No</th>' +
        '<th style="text-align:left;">Name</th>' +
        '<th>CA<br><span style="color:#4ade80;font-size:0.68rem;">/30</span></th>' +
        '<th>Exam<br><span style="color:#00ff88;font-size:0.68rem;">/70</span></th>' +
        '<th>Total<br><span style="color:var(--muted);font-size:0.68rem;">/100</span></th>' +
        '<th>Grade</th><th>Remark</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
        '<p style="margin-top:8px;font-size:0.72rem;color:var(--muted);">' +
        'CA 0\u201330 \u00b7 Exam 0\u201370 \u00b7 Total = CA + Exam \u00b7 Grade updates live as you type.</p>';
}

// Live recalc row
function recalcRow(idx) {
    const caEl = document.querySelector('.lf-ca-input[data-idx="' + idx + '"]');
    const exEl = document.querySelector('.lf-exam-input[data-idx="' + idx + '"]');
    if (!caEl || !exEl) return;
    const ca  = caEl.value.trim() !== '' ? Math.min(30, Math.max(0, parseFloat(caEl.value))) : null;
    const ex  = exEl.value.trim() !== '' ? Math.min(70, Math.max(0, parseFloat(exEl.value))) : null;
    const tot = (ca !== null || ex !== null) ? Math.min(100, (ca ?? 0) + (ex ?? 0)) : null;
    const { grade, remark, color } = tot !== null ? computeGrade(tot) : { grade:'—', remark:'—', color:'#555' };
    const set = (sel, val, c) => { const el = document.querySelector(sel); if (el) { el.textContent = val; el.style.color = c; } };
    set('.lf-total-'  + idx, tot !== null ? tot : '—', color);
    set('.lf-grade-'  + idx, grade,  color);
    set('.lf-remark-' + idx, remark, color);
    if (_students[idx]) {
        _students[idx].caScore   = ca !== null ? ca : '';
        _students[idx].examScore = ex !== null ? ex : '';
    }
}

// Bulk set exam
function bulkSetExam() {
    const raw = parseFloat(document.getElementById('bulkExamVal').value);
    if (isNaN(raw)) return;
    const val = Math.min(70, Math.max(0, raw));
    document.querySelectorAll('.lf-exam-input').forEach(inp => {
        inp.value = val;
        recalcRow(parseInt(inp.getAttribute('data-idx')));
    });
}

// ═════════════════ SAVE SCORES ═════════════════
async function saveScores() {
    const { faculty, dept, level, semester, courseCode } = _currentFilter;
    const msgEl   = document.getElementById('saveStatusMsg');
    const saveBtn = document.getElementById('saveScoresBtn');

    if (!courseCode || !_students.length) {
        msgEl.className = 'msg error'; msgEl.innerText = '⚠️ Load students first.'; return;
    }

    const updates = [];
    document.querySelectorAll('.lf-ca-input').forEach(inp => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        const s   = _students[idx]; if (!s) return;
        const v   = inp.value.trim(); if (v === '') return;
        const score = Math.min(30, Math.max(0, parseFloat(v))); if (isNaN(score)) return;
        updates.push({ matrix_no:s.matrix_no, name:s.name, subject:courseCode, course:courseCode,
                       score, is_ca:true, department:dept, level, semester, faculty });
    });
    document.querySelectorAll('.lf-exam-input').forEach(inp => {
        const idx = parseInt(inp.getAttribute('data-idx'));
        const s   = _students[idx]; if (!s) return;
        const v   = inp.value.trim(); if (v === '') return;
        const score = Math.min(70, Math.max(0, parseFloat(v))); if (isNaN(score)) return;
        updates.push({ matrix_no:s.matrix_no, name:s.name, subject:courseCode, course:courseCode,
                       score, is_ca:false, department:dept, level, semester, faculty });
    });

    if (!updates.length) {
        msgEl.className = 'msg error'; msgEl.innerText = '⚠️ No scores entered.'; return;
    }

    saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
    msgEl.className = 'msg'; msgEl.innerText = '';

    try {
        for (const rec of updates) {
            const { error } = await sb.from('results')
                .upsert(rec, { onConflict: 'matrix_no, subject, is_ca' });
            if (error) throw error;
        }
        msgEl.className = 'msg success';
        msgEl.innerText = '✅ ' + updates.length + ' score(s) saved for ' + courseCode + '.';
        await loadStudents();
    } catch (err) {
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ ' + safeErr(err);
    } finally {
        saveBtn.disabled = false; saveBtn.textContent = '💾 Save Scores';
    }
}

// ═════════════════ PDF SCORE SHEET ═════════════════
async function generateScoreSheetPDF(opts) {
    const { faculty, dept, level, semester, courseCode, courseTitle } = opts;
    const msgEl = opts.msgEl || document.getElementById('pdfStatusMsg');

    if (!faculty || !dept || !level || !semester || !courseCode) {
        msgEl.className = 'msg error'; msgEl.innerText = '⚠️ Please select all fields.'; return;
    }

    msgEl.className = 'msg'; msgEl.innerText = '⏳ Fetching data...';

    // Normalize: strip trailing L ('100L'→'100'), strip 'Semester' suffix from semester
    const deptQ     = dept.trim();
    const levelQ    = level.trim().replace(/L$/i, '');
    const semesterQ = semester.trim().replace(/\s*Semester$/i, '');

    try {
        const { data: students, error: stuErr } = await sb
            .from('students').select('matrix_no, name')
            .eq('department', deptQ).eq('level', levelQ).eq('semester', semesterQ).order('name');
        if (stuErr) throw stuErr;
        if (!students || !students.length) {
            msgEl.className = 'msg error'; msgEl.innerText = '⚠️ No students found.'; return;
        }

        const { data: scores, error: scoreErr } = await sb
            .from('results').select('matrix_no, score, is_ca')
            .in('matrix_no', students.map(s => s.matrix_no)).eq('subject', courseCode);
        if (scoreErr) throw scoreErr;

        const caMap = {}, examMap = {};
        (scores || []).forEach(r => {
            if (r.is_ca) caMap[r.matrix_no] = r.score; else examMap[r.matrix_no] = r.score;
        });

        const rows = students.map((s, i) => {
            const ca  = caMap[s.matrix_no]   !== undefined ? parseFloat(caMap[s.matrix_no])   : null;
            const ex  = examMap[s.matrix_no] !== undefined ? parseFloat(examMap[s.matrix_no]) : null;
            const tot = (ca !== null || ex !== null) ? Math.min(100, (ca ?? 0) + (ex ?? 0)) : null;
            const { grade, remark } = tot !== null ? computeGrade(tot) : { grade:'—', remark:'—' };
            return [i+1, s.name, s.matrix_no, courseCode, courseTitle||'—',
                    ca!==null?ca:'—', ex!==null?ex:'—', tot!==null?tot:'—', grade, remark];
        });

        const { jsPDF } = window.jspdf;
        const doc  = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const today = new Date().toLocaleDateString('en-NG', { day:'2-digit', month:'long', year:'numeric' });

        // Header
        doc.setFontSize(14); doc.setTextColor(0,180,100);
        doc.text('BRAINS AI \u2014 MASTER SCORE SHEET', pageW/2, 16, { align:'center' });
        doc.setFontSize(9); doc.setTextColor(120,160,130);
        doc.text("POWERED BY MU'UJIZA DATA", pageW/2, 22, { align:'center' });

        // Info block
        doc.setFontSize(9); doc.setTextColor(30,30,30);
        doc.text('Lecturer: ' + lecturerData.name,         14, 30);
        doc.text('Faculty: '  + faculty,                   14, 35);
        doc.text('Department: ' + dept,                     14, 40);
        doc.text('Level: ' + level + 'L  |  Semester: ' + semester + ' Semester', pageW/2, 30, { align:'center' });
        doc.text('Course: ' + courseCode + (courseTitle ? ' \u2014 ' + courseTitle : ''), pageW/2, 35, { align:'center' });
        doc.text('Date: ' + today,             pageW-14, 30, { align:'right' });
        doc.text('Students: ' + students.length, pageW-14, 35, { align:'right' });
        doc.setDrawColor(0,180,100); doc.setLineWidth(0.4);
        doc.line(14, 44, pageW-14, 44);

        doc.autoTable({
            startY: 48,
            head: [['S/N','Name','Matrix No','Course Code','Course Title','CA /30','Exam /70','Total /100','Grade','Remark']],
            body: rows,
            styles:     { fontSize:8, cellPadding:2.5, valign:'middle' },
            headStyles: { fillColor:[0,100,50], textColor:[255,255,255], fontStyle:'bold', halign:'center' },
            columnStyles: {
                0:{ halign:'center', cellWidth:10 }, 1:{ cellWidth:44 },
                2:{ halign:'center', cellWidth:28 }, 3:{ halign:'center', cellWidth:22 },
                4:{ cellWidth:38 },
                5:{ halign:'center', cellWidth:16 }, 6:{ halign:'center', cellWidth:18 },
                7:{ halign:'center', cellWidth:20 }, 8:{ halign:'center', cellWidth:14 },
                9:{ halign:'center', cellWidth:22 }
            },
            alternateRowStyles: { fillColor:[240,248,243] },
            margin: { left:14, right:14 }
        });

        const totalPages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            doc.setPage(p);
            doc.setFontSize(7); doc.setTextColor(160,160,160);
            doc.text("BRAINS AI CBT SYSTEM  |  POWERED BY MU'UJIZA DATA  |  Page " + p + ' of ' + totalPages,
                pageW/2, doc.internal.pageSize.getHeight()-6, { align:'center' });
        }

        const fileName = 'ScoreSheet_' + courseCode + '_' + dept + '_' + level + 'L_' + semester + '.pdf';
        doc.save(fileName);
        msgEl.className = 'msg success';
        msgEl.innerText = '✅ Downloaded: ' + fileName;

    } catch (err) {
        msgEl.className = 'msg error'; msgEl.innerText = '❌ ' + safeErr(err);
    }
}

function generatePdfFromTable() {
    generateScoreSheetPDF({ ..._currentFilter, msgEl: document.getElementById('saveStatusMsg') });
}
function generatePdfFromDropdowns() {
    const cSel = document.getElementById('pdfCourse');
    generateScoreSheetPDF({
        faculty:     document.getElementById('pdfFaculty').value,
        dept:        document.getElementById('pdfDept').value,
        level:       document.getElementById('pdfLevel').value,
        semester:    document.getElementById('pdfSemester').value,
        courseCode:  cSel.value,
        courseTitle: cSel.options[cSel.selectedIndex]?.getAttribute('data-title') || '',
        msgEl: document.getElementById('pdfStatusMsg')
    });
}

// ═════════════════ PROFILE ═════════════════
function populateProfile() {
    document.getElementById('profName').textContent  = lecturerData.name  || '—';
    document.getElementById('profPhone').textContent = lecturerData.phone || '—';

    const groups = Array.isArray(lecturerData.assigned_courses) ? lecturerData.assigned_courses : [];
    const container = document.getElementById('profileAssignments');

    if (!groups.length) {
        container.innerHTML = '<div class="state-msg"><span class="si">📋</span>No courses assigned yet.</div>';
        return;
    }

    container.innerHTML = groups.map(g => {
        const courses = Array.isArray(g.courses) ? g.courses : [];
        const pills   = courses.map(c => {
            const code  = typeof c === 'string' ? c : (c.code  || '');
            const title = typeof c === 'string' ? '' : (c.title || '');
            return '<span style="background:rgba(0,255,136,0.1);border:1px solid var(--border);' +
                   'padding:3px 9px;border-radius:6px;font-size:0.75rem;color:var(--text);">' +
                   sanitise(code) + (title ? ' \u2014 ' + sanitise(title) : '') + '</span>';
        }).join('');
        return '<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;background:rgba(0,255,136,0.02);">' +
            '<strong style="color:var(--green);font-size:0.9rem;display:block;margin-bottom:4px;">' +
            sanitise(g.department) + ' \u2014 ' + sanitise(g.level) + 'L \u2014 ' + sanitise(g.semester) + ' Semester</strong>' +
            '<div style="color:var(--muted);font-size:0.76rem;margin-bottom:8px;">Faculty: <strong style="color:var(--text);">' + sanitise(g.faculty) + '</strong></div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:6px;">' + pills + '</div></div>';
    }).join('');
}

// ═════════════════ BIND EVENTS ═════════════════
function bindEvents() {
    document.getElementById('lfLoadBtn')?.addEventListener('click', loadStudents);
    document.getElementById('bulkSetBtn')?.addEventListener('click', bulkSetExam);
    document.getElementById('saveScoresBtn')?.addEventListener('click', saveScores);
    document.getElementById('downloadPdfBtn')?.addEventListener('click', generatePdfFromTable);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePdfFromDropdowns);
}

window.recalcRow = recalcRow;
