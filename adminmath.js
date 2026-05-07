// ── XSS PROTECTION ──────────────────────────────────────────────────
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
// ─────────────────────────────────────────────────────────────────────

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

// --- 1. CONFIG & GLOBAL STATE (must be defined before the auth guard) ---
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: {
        headers: {
            'x-admin-token': sessionStorage.getItem('adminToken') || ''
        }
    }
});

// ── AUTH GUARD ──────────────────────────────────────────────────────
// Now runs after S_URL, S_KEY and sb are defined
(async function() {
    const token = sessionStorage.getItem("adminToken");
    if (sessionStorage.getItem("adminLoggedIn") !== "true" || !token) {
        window.location.replace("index.html");
        return;
    }
    const { data: isValid, error } = await sb.rpc('verify_admin_token', { submitted_token: token });
    if (error || !isValid) {
        sessionStorage.clear();
        window.location.replace("index.html");
    }
})();

// --- 2. GLOBAL VARIABLES FOR QUESTION ENTRY ---
let allFaculties = [];
let allDepartments = [];

// --- 3. INITIALIZE DYNAMIC DATA ---
async function initUploadPage() {
    try {
        const { data: fData, error: fErr } = await sb.from('faculties').select('*').order('name');
        const { data: dData, error: dErr } = await sb.from('departments').select('*').order('name');
        if (fErr || dErr) throw new Error("Database connection failed");
        allFaculties = fData || [];
        allDepartments = dData || [];
        renderFacultyDropdown();
        renderStaticDropdowns();
    } catch (err) {
        console.error("Initialization Error:", err);
    }
}

function renderFacultyDropdown() {
    const facSelect = document.getElementById('faculty');
    if (!facSelect) return;
    facSelect.innerHTML = '<option value="">-- Select Faculty --</option>' + 
        allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
}

function renderStaticDropdowns() {
    const LEVEL_OPTIONS = ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000"];
    const SEMESTER_OPTIONS = ["1st", "2nd"];
    const levelSelect = document.getElementById('level');
    const semSelect = document.getElementById('semester');
    if (levelSelect) {
        levelSelect.innerHTML = '<option value="">-- Level --</option>' + 
            LEVEL_OPTIONS.map(l => `<option value="${sanitise(l)}">${sanitise(l)}</option>`).join('');
    }
    if (semSelect) {
        semSelect.innerHTML = '<option value="">-- Semester --</option>' + 
            SEMESTER_OPTIONS.map(s => `<option value="${sanitise(s)}">${sanitise(s)}</option>`).join('');
    }
}

function updateDepts() {
    const selectedFacName = document.getElementById('faculty').value;
    const deptDropdown = document.getElementById('dept');
    const facultyObj = allFaculties.find(f => f.name === selectedFacName);
    if (!facultyObj) {
        deptDropdown.innerHTML = '<option value="">-- Select Faculty First --</option>';
        return;
    }
    const filteredDepts = allDepartments.filter(d => d.faculty_id === facultyObj.id);
    deptDropdown.innerHTML = filteredDepts.length > 0 
        ? filteredDepts.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('')
        : '<option value="">No Departments Found</option>';
}

// --- 4. UI HELPERS (secure versions) ---
function handleMediaPreview() {
    const file = document.getElementById('imageFile').files[0];
    const previewBox = document.getElementById('mediaPreviewBox');
    const fileNameDisplay = document.getElementById('fileName');
    
    if (!file) {
        if (previewBox) {
            previewBox.innerHTML = '<p id="previewPlaceholder" style="color: #666;">Preview will appear here</p>';
        }
        return;
    }

    if (fileNameDisplay) fileNameDisplay.textContent = file.name;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    previewBox.innerHTML = '';
    if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.muted = true;
        video.style.maxWidth = '100%';
        video.style.maxHeight = '250px';
        previewBox.appendChild(video);
    } else {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '250px';
        img.style.objectFit = 'contain';
        previewBox.appendChild(img);
    }
    updatePreview();
}

function updatePreview() {
    const q = document.getElementById("qText").value;
    const o1 = document.getElementById("op1").value;
    const o2 = document.getElementById("op2").value;
    const o3 = document.getElementById("op3").value;
    const o4 = document.getElementById("op4").value;
    const p = document.getElementById("preview");
    const mediaPreviewBox = document.getElementById('mediaPreviewBox');

    if (!p) return;

    let mediaPreviewHTML = '';
    if (mediaPreviewBox) {
        const hasMedia = mediaPreviewBox.querySelector('video, img');
        if (hasMedia) mediaPreviewHTML = mediaPreviewBox.innerHTML;
    }

    p.textContent = '';
    const container = document.createElement('div');
    container.style.background = '#111';
    container.style.padding = '15px';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #333';

    if (mediaPreviewHTML) {
        const mediaDiv = document.createElement('div');
        mediaDiv.style.marginBottom = '10px';
        mediaDiv.innerHTML = mediaPreviewHTML;
        container.appendChild(mediaDiv);
    }

    const questionDiv = document.createElement('div');
    questionDiv.style.fontWeight = 'bold';
    questionDiv.style.marginBottom = '10px';
    questionDiv.style.color = 'white';
    questionDiv.textContent = q || 'Question preview...';
    container.appendChild(questionDiv);

    const optionsDiv = document.createElement('div');
    optionsDiv.style.fontSize = '0.9em';
    optionsDiv.style.paddingLeft = '10px';
    optionsDiv.style.borderLeft = '2px solid #00ff88';
    optionsDiv.style.color = '#ccc';
    optionsDiv.innerHTML = `A. ${sanitise(o1) || '...'} <br> B. ${sanitise(o2) || '...'} <br> C. ${sanitise(o3) || '...'} <br> D. ${sanitise(o4) || '...'}`;
    container.appendChild(optionsDiv);

    p.appendChild(container);
    if (window.MathJax) MathJax.typesetPromise([p]);
}

// --- 5. UPLOAD LOGIC ---
async function uploadEverything() {
    const btn = document.getElementById("uploadBtn");
    try {
        const faculty = document.getElementById('faculty').value;
        const dept = document.getElementById('dept').value;
        const level = document.getElementById('level').value;
        const semester = document.getElementById('semester').value;
        const course = document.getElementById('course').value.trim();
        const correctAns = document.getElementById('correctAns').value;
        const qContent = document.getElementById("qText").value.trim();

        if (!faculty || !dept || !level || !course || !correctAns || !qContent) {
            return alert("⚠️ Please fill all required fields, including the Question text!");
        }

        btn.disabled = true;
        btn.textContent = "UPLOADING MEDIA...";

        const file = document.getElementById("imageFile").files[0];
        let finalImageUrl = null;

        if (file) {
            const ext = file.name.split('.').pop();
            const fileName = `osce-${Date.now()}.${ext}`;
            const { error: uploadError } = await sb.storage.from('question-images').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = sb.storage.from('question-images').getPublicUrl(fileName);
            finalImageUrl = data.publicUrl;
        }

        btn.textContent = "SAVING DATA...";

        const { error } = await sb.from('questions').insert([{
            questions: qContent,
            "Option 1": document.getElementById("op1").value,
            "Option 2": document.getElementById("op2").value,
            "Option 3": document.getElementById("op3").value,
            "Option 4": document.getElementById("op4").value,
            answer: parseInt(correctAns),
            image_url: finalImageUrl,
            faculty: faculty,
            department: dept,
            course: course.toUpperCase(),
            level: level,
            semester: semester
        }]);

        if (error) throw error;
        alert("✅ OSCE Question Saved Successfully!");
        location.reload();

    } catch (err) {
        console.error("Upload failed:", err);
        alert("Error: " + err.message);
        btn.disabled = false;
        btn.textContent = "UPLOAD TO DATABASE";
    }
}

// ── ASSIGNMENT MANAGEMENT ──────────────────────────────────────────
let _assignmentData = [];

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
        listDiv.innerHTML = '<p style="text-align:center; color:#aaa; padding:20px;">No submissions found.</p>';
        return;
    }

    _assignmentData = data;

    listDiv.innerHTML = data.map(a => `
        <div style="background:#fafafa; color:#333; border:1px solid #e2e8f0; border-radius:10px; padding:15px; margin-bottom:12px; border-left:5px solid ${a.status === 'graded' ? '#00ff88' : '#f59e0b'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;">
                <div style="flex:1;">
                    <strong style="font-size:1rem;">${sanitise(a.student_name)}</strong>
                    <span style="background:#0f5132; color:#00ff88; padding:2px 8px; border-radius:10px; font-size:0.7rem; margin-left:8px;">${sanitise(a.matrix_no)}</span>
                    <br>
                    <small style="color:#666;">${sanitise(a.course_code)} • ${sanitise(a.department || '')} • ${sanitise(a.level || '')} Level • ${sanitise(a.faculty || '')}</small>
                    <br>
                    <span style="color:#555; font-size:0.9rem; font-style:italic;">"${sanitise(a.title)}"</span>
                </div>
                <div style="text-align:right;">
                    <span style="font-weight:bold; color:${a.status === 'graded' ? '#0f5132' : '#f59e0b'};">
                        ${a.status === 'graded' ? `${a.score}/${a.max_score}` : 'PENDING'}
                    </span>
                    <br>
                    <small style="color:#aaa;">${new Date(a.submitted_at).toLocaleDateString()}</small>
                    <br>
                    <button data-id="${a.id}" class="grade-btn" style="margin-top:8px; background:#0f5132; color:#00ff88; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">${a.status === 'graded' ? '✏️ EDIT SCORE' : '🎯 GRADE'}</button>
                    ${a.status === 'graded' ? `<button data-id="${a.id}" class="delete-assign-btn" style="margin-top:8px; margin-left:4px; background:#ff4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">🗑️</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
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
    const msg      = document.getElementById('gradingMsg');
    const btn      = document.getElementById('sendScoreBtn');

    if (isNaN(score) || score < 0) {
        msg.style.color = '#ff4444';
        msg.innerText = '⚠️ Please enter a valid score.';
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Sending...';

    try {
        const { error } = await sb.from('assignments').update({
            score,
            max_score: maxScore,
            feedback,
            status: 'graded',
            graded_at: new Date().toISOString()
        }).eq('id', id);

        if (error) throw error;

        msg.style.color = '#00aa55';
        msg.innerText = '✅ Score sent! Student will see it immediately.';

        setTimeout(() => {
            document.getElementById('gradingModal').style.display = 'none';
            const filter = document.getElementById('assignFilter')?.value || 'all';
            const search = document.getElementById('assignSearch')?.value.trim() || '';
            loadAssignments(filter, search);
        }, 1500);

    } catch (err) {
        msg.style.color = '#ff4444';
        msg.innerText = '❌ Failed: ' + err.message;
    } finally {
        btn.disabled = false;
        btn.innerText = '📤 SEND SCORE TO STUDENT';
    }
}

async function deleteAssignment(id) {
    if (!confirm('Delete this graded assignment? This cannot be undone.')) return;
    const { error } = await sb.from('assignments').delete().eq('id', id);
    if (error) {
        alert('Delete failed: ' + error.message);
    } else {
        const filter = document.getElementById('assignFilter')?.value || 'all';
        const search = document.getElementById('assignSearch')?.value.trim() || '';
        loadAssignments(filter, search);
    }
}

// --- 6. EVENT LISTENERS (CSP‑compliant) ---
document.addEventListener('DOMContentLoaded', function() {
    // ── Question entry events ──
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

    // ── Assignment management events ──
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
        if (btn.classList.contains('grade-btn')) {
            openGradingModal(id);
        } else if (btn.classList.contains('delete-assign-btn')) {
            deleteAssignment(id);
        }
    });

    document.getElementById('closeGradingModal')?.addEventListener('click', () => {
        document.getElementById('gradingModal').style.display = 'none';
    });

    document.getElementById('sendScoreBtn')?.addEventListener('click', sendScoreToStudent);

    // Initialize the page (faculties, departments, etc.)
    initUploadPage();
    loadAssignments();
});