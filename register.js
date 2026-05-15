// ── XSS PROTECTION ──────────────────────────────────────────────────
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

// ── MAINTENANCE CHECK ─────────────────────────────────────────────────
async function securityCheck() {
    try {
        const response = await fetch('https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy', {
            method: 'POST',
            body: JSON.stringify({ action: 'check-system-status' })
        });
        const result = await response.json();
        if (response.status === 503 || result.error === "MAINTENANCE_MODE") {
            document.body.innerHTML = `
                <div style="background:#1a1a1a; color:white; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:sans-serif;">
                    <h1 style="color:#ff4444;">⚠️ SYSTEM LOCKED</h1>
                    <p>Administrative lockdown is active. Please contact the BRAINS ICT department.</p>
                </div>`;
            window.stop();
        }
    } catch (e) {
        console.log("Security check failed, but proceeding with caution.");
    }
}
securityCheck();

// ── CUSTOM MODAL (replaces alert) ───────────────────────────────────
function showModal(title, message, isError = false) {
    const modal = document.getElementById('customModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    if (!modal || !modalTitle || !modalMessage) return;
    
    modalTitle.textContent = title;
    modalMessage.innerHTML = message; // supports HTML
    if (isError) {
        modalTitle.style.color = '#ff4444';
    } else {
        modalTitle.style.color = 'var(--green, #00ff88)';
    }
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('customModal');
    if (modal) modal.style.display = 'none';
}

function initModal() {
    const closeBtn = document.getElementById('closeModalBtn');
    const okBtn = document.getElementById('modalOkBtn');
    const modal = document.getElementById('customModal');
    
    if (closeBtn) closeBtn.addEventListener('click', hideModal);
    if (okBtn) okBtn.addEventListener('click', hideModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });
    }
}

// ── CONFIGURATION ──
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY);

const LEVEL_OPTIONS    = ["100","200","300","400","500","600","700","800","900","1000"];
const SEMESTER_OPTIONS = ["1st","2nd"];

let allFaculties   = [];
let allDepartments = [];
let currentStep    = 1;

// ── DOM ELEMENTS ──
const regFaculty = document.getElementById('regFaculty');
const regDept    = document.getElementById('regDept');
const regLevel   = document.getElementById('regLevel');
const regSemester= document.getElementById('regSemester');
const nextBtn1   = document.getElementById('nextBtn1');
const nextBtn2   = document.getElementById('nextBtn2');
const backBtn2   = document.getElementById('backBtn2');
const backBtn3   = document.getElementById('backBtn3');
const submitBtn  = document.getElementById('submitBtn');
const goToLoginBtn = document.getElementById('goToLoginBtn');

// ── Helper to show validation errors ──
function showErr(id, show) {
    const el = document.getElementById(id);
    if (el) {
        if (show) {
            el.classList.add('show');
        } else {
            el.classList.remove('show');
        }
    }
}

// ── Ensure error message CSS exists ──
function ensureErrorStyles() {
    if (document.getElementById('error-styles')) return;
    const style = document.createElement('style');
    style.id = 'error-styles';
    style.textContent = `
        .field-error {
            display: none;
            color: #ff4444;
            font-size: 0.8rem;
            margin-top: 4px;
        }
        .field-error.show {
            display: block;
        }
    `;
    document.head.appendChild(style);
}
ensureErrorStyles();

// ── INIT ──
async function init() {
    console.log("Initializing registration...");
    try {
        const { data: fData, error: fErr } = await sb.from('faculties').select('*').order('name');
        const { data: dData, error: dErr } = await sb.from('departments').select('*').order('name');
        if (fErr || dErr) throw (fErr || dErr);

        allFaculties   = fData || [];
        allDepartments = dData || [];

        regFaculty.innerHTML = '<option value="">-- Choose Faculty --</option>' +
            allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');

        regLevel.innerHTML = '<option value="">-- Level --</option>' +
            LEVEL_OPTIONS.map(l => `<option value="${l}">${l}</option>`).join('');

        regSemester.innerHTML = '<option value="">-- Semester --</option>' +
            SEMESTER_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('');

        // Event listeners
        regFaculty.addEventListener('change', loadDynamicDepartments);
        nextBtn1.addEventListener('click', goToStep2);
        nextBtn2.addEventListener('click', goToStep3);
        backBtn2.addEventListener('click', () => goToStep(1));
        backBtn3.addEventListener('click', () => goToStep(2));
        submitBtn.addEventListener('click', handleRegistration);
        goToLoginBtn.addEventListener('click', () => window.location.href = 'student_login.html');

        const passInput = document.getElementById('regPass');
        const confirmInput = document.getElementById('regPassConfirm');
        passInput.addEventListener('input', (e) => checkStrength(e.target.value));
        document.getElementById('togglePassBtn').addEventListener('click', () => toggleEye('regPass'));
        document.getElementById('toggleConfirmBtn').addEventListener('click', () => toggleEye('regPassConfirm'));

        // Enable button after data loaded
        nextBtn1.disabled = false;
        nextBtn1.innerText = "NEXT → ACADEMIC INFO";
        console.log("Registration ready.");
        
        // Initialize modal event listeners
        initModal();
    } catch (err) {
        console.error("Init error:", err);
        showModal('Loading Error', 'Failed to load registration data. Check your connection.', true);
    }
}

// ── DEPT FILTER ──
function loadDynamicDepartments() {
    const facName  = regFaculty.value;
    if (!facName) { regDept.innerHTML = '<option value="">-- Select Faculty First --</option>'; return; }
    const facObj   = allFaculties.find(f => f.name === facName);
    if (!facObj) return;
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    regDept.innerHTML = '<option value="">-- Select Department --</option>' +
        filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('');
}

// ── STEP NAVIGATION ──
function goToStep(n) {
    console.log("goToStep", n);
    document.getElementById(`section${currentStep}`).classList.remove('active');
    document.getElementById(`step${currentStep}-ind`).classList.remove('active');
    document.getElementById(`step${currentStep}-ind`).classList.add('done');
    currentStep = n;
    document.getElementById(`section${n}`).classList.add('active');

    for (let i = 1; i <= 3; i++) {
        const ind = document.getElementById(`step${i}-ind`);
        if (ind) {
            ind.classList.remove('active','done');
            if (i < n) ind.classList.add('done');
            if (i === n) ind.classList.add('active');
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2() {
    console.log("Validating step 1...");
    let valid = true;
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const matric = document.getElementById('regMatric').value.trim();
    const pass = document.getElementById('regPass').value;
    const confirm = document.getElementById('regPassConfirm').value;

    showErr('err-name', !name);
    if (!name) valid = false;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    showErr('err-email', !emailOk);
    if (!emailOk) valid = false;

    showErr('err-matric', !matric);
    if (!matric) valid = false;

    showErr('err-pass', pass.length < 6);
    if (pass.length < 6) valid = false;

    showErr('err-confirm', pass !== confirm);
    if (pass !== confirm) valid = false;

    if (valid) {
        console.log("Validation passed");
        goToStep(2);
    } else {
        console.log("Validation failed");
        const firstError = document.querySelector('.field-error.show');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function goToStep3() {
    console.log("Validating step 2...");
    let valid = true;
    if (!regFaculty.value)  { showErr('err-faculty', true); valid = false; } else showErr('err-faculty', false);
    if (!regDept.value)     { showErr('err-dept',    true); valid = false; } else showErr('err-dept',    false);
    if (!regLevel.value || !regSemester.value) valid = false;

    if (!valid) {
        console.log("Step 2 validation failed");
        return;
    }

    document.getElementById('rev-name').innerText   = document.getElementById('regName').value.trim();
    document.getElementById('rev-email').innerText  = document.getElementById('regEmail').value.trim();
    document.getElementById('rev-matric').innerText = document.getElementById('regMatric').value.trim().toUpperCase();
    document.getElementById('rev-faculty').innerText = regFaculty.value;
    document.getElementById('rev-dept').innerText   = regDept.value;
    document.getElementById('rev-level').innerText  = `${regLevel.value}L — ${regSemester.value} Semester`;

    goToStep(3);
}

function toggleEye(inputId) {
    const inp = document.getElementById(inputId);
    const btn = document.querySelector(`#${inputId} ~ .eye-btn, .field-wrap #${inputId} + .eye-btn`);
    if (inp.type === 'password') {
        inp.type = 'text';
        if (btn) btn.innerText = '🙈';
    } else {
        inp.type = 'password';
        if (btn) btn.innerText = '👁';
    }
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
        if (el) {
            el.className = 'bar';
            if (i < cfg.filled) el.classList.add(cfg.cls);
        }
    });
    if (label) {
        label.innerText = cfg.text;
        label.style.color = score >= 3 ? 'var(--green)' : score === 2 ? 'var(--warning)' : 'var(--error)';
    }
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
    const faculty  = regFaculty.value;
    const dept     = regDept.value;
    const level    = regLevel.value;
    const semester = regSemester.value;

    try {
        const { data, error } = await sb.rpc('register_student', {
            p_name:       name,
            p_email:      email,
            p_phone:      phone,
            p_matrix:     matric,
            p_password:   password,
            p_faculty:    faculty,
            p_department: dept,
            p_level:      level,
            p_semester:   semester
        });

        if (error) throw error;

        if (!data.success) {
            showModal('Registration Error', data.error || 'Registration failed', true);
            btn.disabled = false;
            btn.innerText = "SUBMIT REGISTRATION";
            return;
        }

        document.getElementById('section3').classList.remove('active');
        document.getElementById('successScreen').style.display = 'block';

    } catch (err) {
        showModal('Error', "An unexpected error occurred: " + safeErr(err), true);
        btn.disabled = false;
        btn.innerText = "SUBMIT REGISTRATION";
    }
}

// Start everything
init();