// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML; // browser escapes <>&" automatically
}
function safeErr(err) {
    const msg = (err && err.message) ? String(err.message) : 'An unexpected error occurred.';
    return msg.substring(0, 120);
}
// ─────────────────────────────────────────────────────────────────────

// Add to the very top of student_login.js, dashboard.js, exam.js, and staphy.js
async function securityCheck() {
    try {
        const response = await fetch('https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy', {
            method: 'POST',
            body: JSON.stringify({ action: 'check-system-status' })
        });
        
        const result = await response.json();
        
        if (response.status === 503 || result.error === "MAINTENANCE_MODE") {
            // Redirect to a maintenance page or just clear the screen
            document.body.innerHTML = `
                <div style="background:#1a1a1a; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
                    <h1 style="color:#ff4444;">⚠️ SYSTEM LOCKED</h1>
                    <p>Administrative lockdown is active. Please contact the BRAINS ICT department.</p>
                </div>`;
            window.stop(); // Stop any other scripts from running
        }
    } catch (e) {
        console.log("Security check failed, but proceeding with caution.");
    }
}

// Run the check immediately when the page loads
securityCheck();
// ── CONFIGURATION ──
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
// register.js — no token needed, only reads public faculties/departments
// and calls register_student RPC which has its own validation
const sb    = supabase.createClient(S_URL, S_KEY);

const LEVEL_OPTIONS    = ["100","200","300","400","500","600","700","800","900","1000"];
const SEMESTER_OPTIONS = ["1st","2nd"];

let allFaculties   = [];
let allDepartments = [];
let currentStep    = 1;

// ── INIT ──
window.onload = async function() {
    try {
        const { data: fData, error: fErr } = await sb.from('faculties').select('*').order('name');
        const { data: dData, error: dErr } = await sb.from('departments').select('*').order('name');
        if (fErr || dErr) throw (fErr || dErr);

        allFaculties   = fData || [];
        allDepartments = dData || [];

        const facEl = document.getElementById('regFaculty');
        facEl.innerHTML = '<option value="">-- Choose Faculty --</option>' +
            allFaculties.map(f => {
                const safe = sanitise(f.name);
                return `<option value="${safe}">${safe}</option>`;
            }).join('');

        document.getElementById('regLevel').innerHTML =
            '<option value="">-- Level --</option>' +
            LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');

        document.getElementById('regSemester').innerHTML =
            '<option value="">-- Semester --</option>' +
            SEMESTER_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('');

    } catch (err) {
        alert("Failed to load registration data. Check your connection.");
    }
};

// ── DEPT FILTER ──
function loadDynamicDepartments() {
    const facName  = document.getElementById('regFaculty').value;
    const deptSel  = document.getElementById('regDept');
    if (!facName) { deptSel.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facObj   = allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSel.innerHTML = '<option value="">-- Select Department --</option>' +
        filtered.map(d => {
            const safe = sanitise(d.name);
            return `<option value="${safe}">${safe}</option>`;
        }).join('');
}

// ── STEP NAVIGATION ──
function goToStep(n) {
    document.getElementById(`section${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep}-ind`).classList.remove('active');
    document.getElementById(`step${currentStep}-ind`).classList.add('done');
    currentStep = n;
    document.getElementById(`section${n}`).classList.add('active');

    // Update step indicators
    for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById(`step${i}-ind`);
        ind.classList.remove('active','done');
        if (i < n) ind.classList.add('done');
        if (i === n) ind.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2() {
    // Validate step 1 fields
    let valid = true;

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const matric = document.getElementById('regMatric').value.trim();
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;

    // Name
    showErr('err-name', !name);
    if (!name) valid = false;

    // Email
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    showErr('err-email', !emailOk);
    if (!emailOk) valid = false;

    // Matric
    showErr('err-matric', !matric);
    if (!matric) valid = false;

    // Password length
    showErr('err-pass', pass.length < 6);
    if (pass.length < 6) valid = false;

    // Confirm
    showErr('err-confirm', pass !== confirm);
    if (pass !== confirm) valid = false;

    if (valid) goToStep(2);
}

function goToStep3() {
    let valid = true;
    if (!document.getElementById('regFaculty').value)  { showErr('err-faculty', true); valid = false; } else showErr('err-faculty', false);
    if (!document.getElementById('regDept').value)     { showErr('err-dept',    true); valid = false; } else showErr('err-dept',    false);
    if (!document.getElementById('regLevel').value || !document.getElementById('regSemester').value) valid = false;

    if (!valid) return;

    // Populate review
    document.getElementById('rev-name').innerText   = document.getElementById('regName').value.trim();
    document.getElementById('rev-email').innerText  = document.getElementById('regEmail').value.trim();
    document.getElementById('rev-matric').innerText = document.getElementById('regMatric').value.trim().toUpperCase();
    document.getElementById('rev-faculty').innerText = document.getElementById('regFaculty').value;
    document.getElementById('rev-dept').innerText   = document.getElementById('regDept').value;
    document.getElementById('rev-level').innerText  = `${document.getElementById('regLevel').value}L — ${document.getElementById('regSemester').value} Semester`;

    goToStep(3);
}

// ── HELPERS ──
function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('show', show);
}

function toggleEye(inputId, btn) {
    const inp = document.getElementById(inputId);
    if (inp.type === 'password') { inp.type = 'text';     btn.innerText = '🙈'; }
    else                         { inp.type = 'password'; btn.innerText = '👁';  }
}

function checkStrength(val) {
    const bars   = ['bar1','bar2','bar3','bar4'];
    const label  = document.getElementById('strengthLabel');
    let score    = 0;

    if (val.length >= 6)                              score++;
    if (val.length >= 10)                             score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val))      score++;
    if (/[^A-Za-z0-9]/.test(val))                    score++;

    const configs = [
        { filled: 0, cls: '',        text: 'Enter a password' },
        { filled: 1, cls: 'weak',    text: 'Weak — too short' },
        { filled: 2, cls: 'fair',    text: 'Fair — add numbers or capitals' },
        { filled: 3, cls: 'strong',  text: 'Strong' },
        { filled: 4, cls: 'vstrong', text: 'Very Strong ✓' }
    ];

    const cfg = configs[score];
    bars.forEach((b, i) => {
        const el = document.getElementById(b);
        el.className = 'bar';
        if (i < cfg.filled) el.classList.add(cfg.cls);
    });
    label.innerText = cfg.text;
    label.style.color = score >= 3 ? 'var(--green)' : score === 2 ? 'var(--warning)' : 'var(--error)';
}

// ── MAIN REGISTRATION ──
async function handleRegistration() {
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerText = "SUBMITTING...";

    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const phone    = document.getElementById('regPhone').value.trim();
    const matric   = document.getElementById('regMatric').value.trim().toUpperCase();
    const password = document.getElementById('regPass').value;
    const faculty  = document.getElementById('regFaculty').value;
    const dept     = document.getElementById('regDept').value;
    const level    = document.getElementById('regLevel').value;
    const semester = document.getElementById('regSemester').value;

    try {
        // ── STEP 1: Check for existing matric or email (fast duplicate check) ──
        const { data: existing } = await sb
            .from('students')
            .select('id, matrix_no, email')
            .or(`matrix_no.eq.${matric},email.eq.${email}`)
            .maybeSingle();

        if (existing) {
            const msg = existing.matrix_no === matric
                ? "❌ This Matrix Number is already registered."
                : "❌ This Email address is already in use.";
            alert(msg);
            btn.disabled = false;
            btn.innerText = "SUBMIT REGISTRATION";
            return;
        }

        // ── STEP 2: ✅ HASH PASSWORD via Supabase RPC ──
        // Password NEVER stored as plaintext — crypt() with bcrypt salt runs server-side
        const { data: regResult, error: regError } = await sb.rpc('register_student', {
            p_name:       name,
            p_email:      email,
            p_phone:      phone,
            p_matrix:     matric,
            p_password:   password,   // RPC hashes this before inserting
            p_faculty:    faculty,
            p_department: dept,
            p_level:      level,
            p_semester:   semester
        });

        if (regError) {
            if (regError.message.includes('23505')) {
                alert("❌ Duplicate record detected. Check your Matrix Number or Email.");
            } else {
                alert("❌ Registration Error: " + safeErr(regError));
            }
            btn.disabled = false;
            btn.innerText = "SUBMIT REGISTRATION";
            return;
        }

        // ── STEP 3: Show success screen ──
        document.getElementById('section3').classList.remove('active');
        document.getElementById('successScreen').style.display = 'block';

    } catch (err) {
        alert("An unexpected error occurred: " + safeErr(err));
        btn.disabled = false;
        btn.innerText = "SUBMIT REGISTRATION";
    }
}
