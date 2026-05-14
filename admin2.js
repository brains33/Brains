    // ── CSP-COMPLIANT ADMIN2 (Classroom + Snap Test) ────────────────────

// --- XSS PROTECTION ---
function sanitise(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}
function safeErr(err) {
    const msg = (err && err.message) ? String(err.message) : 'Unknown error';
    return '❌ ' + msg.substring(0, 120);
}

// --- SECURITY CHECK ---
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

// --- AUTH GUARD (moved from inline script) ---
const S_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const S_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const sb = supabase.createClient(S_URL, S_KEY, {
    global: { headers: { 'x-admin-token': sessionStorage.getItem('adminToken') || '' } }
});

(async function() {
    if (sessionStorage.getItem("adminLoggedIn") !== "true") { window.location.replace("index.html"); return; }
    const token = sessionStorage.getItem("adminToken");
    if (!token) { window.location.replace("index.html"); return; }
    const { data: isValid, error } = await sb.rpc('verify_admin_token', { submitted_token: token });
    if (error || !isValid) { sessionStorage.clear(); window.location.replace("index.html"); }
})();

// --- ANNOUNCEMENTS ---
async function postAnnouncement() {
    const text = document.getElementById('newsInput').value.trim();
    if(!text) return alert("Enter text!");
    const { error } = await sb.from('exam_sessions').update({ announcement: text }).eq('id', 1);
    if (error) alert("Error: " + error.message);
    else alert("Stream Updated!");
}

async function clearAnnouncement() {
    const { error } = await sb.from('exam_sessions').update({ announcement: "" }).eq('id', 1);
    if (!error) {
        document.getElementById('newsInput').value = "";
        alert("Announcement Cleared!");
    }
}

// --- RESOURCE / MATERIAL MANAGEMENT ---
async function handlePublish() {
    const course = document.getElementById('resCourse').value.trim().toUpperCase();
    const title = document.getElementById('resTitle').value.trim();
    const fileInput = document.getElementById('resFile');
    const noteText = document.getElementById('resNote').value.trim();
    const btn = document.getElementById('publishMaterialBtn');

    if (!course || !title) return alert("Please enter Course Code and Title");

    btn.textContent = "PROCESSING...";
    btn.disabled = true;

    let finalUrl = "";
    try {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const fileName = `resources/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            const { error: uploadError } = await sb.storage.from('materials').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = sb.storage.from('materials').getPublicUrl(fileName);
            finalUrl = urlData.publicUrl;
        }

        const { error: dbError } = await sb.from('resources').insert([{
            course: course,
            title: title, 
            file_url: finalUrl, 
            note_content: noteText
        }]);
        
        if (dbError) throw dbError;
        alert(`Published to ${course}!`);
        location.reload();
    } catch (err) { 
        alert("Error: " + err.message); 
    } finally { 
        btn.disabled = false; 
        btn.textContent = "PUBLISH TO DASHBOARD"; 
    }
}

async function loadResources() {
    const { data, error } = await sb.from('resources').select('*').order('created_at', { ascending: false });
    const listDiv = document.getElementById('adminResourceList');
    if (error || !listDiv) return;
    
    listDiv.innerHTML = data.map(item => `
        <div class="resource-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
            <div>
                <strong style="color:#2b6cb0;">[${sanitise(item.course || 'GEN')}]</strong> 
                <span>${sanitise(item.title)}</span>
            </div>
            <button class="deleteResourceBtn" data-resource-id="${item.id}" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">Delete</button>
        </div>
    `).join('');
}

async function deleteResource(id) {
    if(confirm("Are you sure you want to delete this material?")) {
        const { error } = await sb.from('resources').delete().eq('id', id);
        if (error) alert("Delete failed: " + error.message);
        loadResources();
    }
}

// --- LIVE CLASS (JITSI) ---
let jitsiApi = null;

async function launchMeeting() {
    const course = document.getElementById('courseInput').value.toUpperCase().trim();
    if(!course) return alert("Please enter a course code!");

    const uniqueRoom = "BRAINS_" + course.replace(/\s+/g, '_') + "_" + Date.now();

    const { error } = await sb.from('live_classes').upsert({ 
        id: 1, 
        course_code: course,
        room_id: uniqueRoom,
        is_active: true 
    });

    if(error) return alert("Sync Error: " + error.message);

    const options = {
        roomName: uniqueRoom,
        parentNode: document.querySelector('#meetContainer'),
        width: '100%',
        height: 500,
        userInfo: { displayName: 'LECTURER (BRAINS AI Admin)' }
    };

    jitsiApi = new JitsiMeetExternalAPI("meet.jit.si", options);
    document.getElementById('statusText').textContent = "Status: LIVE - " + course;
    document.getElementById('statusText').style.color = "#48bb78";
    document.getElementById('startClassBtn').style.display = "none";
    document.getElementById('stopClassBtn').style.display = "block";
}

async function closeMeeting() {
    if(confirm("Are you sure you want to end this session?")) {
        if(jitsiApi) jitsiApi.dispose();
        await sb.from('live_classes').update({ is_active: false }).eq('id', 1);
        document.getElementById('meetContainer').textContent = "Class ended.";
        document.getElementById('statusText').textContent = "Status: Offline";
        document.getElementById('startClassBtn').style.display = "block";
        document.getElementById('stopClassBtn').style.display = "none";
    }
}

// --- STATE MANAGEMENT ---
let allFaculties = [];
let allDepartments = [];
let activeFacultyId = null;

async function initSystemManager() {
    console.log("Fetching System Data...");
    const { data: fData } = await sb.from('faculties').select('*').order('name', { ascending: true });
    const { data: dData } = await sb.from('departments').select('*').order('name', { ascending: true });
    allFaculties = fData || [];
    allDepartments = dData || [];
    document.getElementById('facultySearch').value = ""; 
    renderFaculties();
    populateSnapFaculty();
}

async function addFaculty() {
    const name = document.getElementById('newFacultyInput').value.trim();
    if (!name) return alert("Enter faculty name");
    const { error } = await sb.from('faculties').insert({ name });
    if (error) return alert(error.message);
    document.getElementById('newFacultyInput').value = '';
    await initSystemManager();
}

async function addDepartment() {
    if (!activeFacultyId) return alert("Select a faculty on the left first!");
    const name = document.getElementById('newDeptInput').value.trim();
    if (!name) return alert("Enter department name");
    const { error } = await sb.from('departments').insert({ name, faculty_id: activeFacultyId });
    if (error) return alert(error.message);
    document.getElementById('newDeptInput').value = '';
    await initSystemManager();
    renderDepartments(activeFacultyId);
}

// --- RENDER FUNCTIONS (CSP‑safe: use data-* + delegation) ---
function renderFaculties() {
    const container = document.getElementById('facultyList');
    if (!container) return;
    if (allFaculties.length === 0) {
        container.innerHTML = '<p style="color:gray; padding:10px;">No faculties found.</p>';
        return;
    }
    container.innerHTML = allFaculties.map(f => `
        <div class="list-item faculty-item ${activeFacultyId === f.id ? 'active' : ''}" data-faculty-id="${sanitise(f.id)}" data-faculty-name="${sanitise(f.name).replace(/'/g, "\\'")}" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor:pointer;">
            <span class="f-name" style="flex: 1;">${sanitise(f.name)}</span>
            <button class="deleteFacultyBtn" data-faculty-id="${sanitise(f.id)}" style="background: #ff4444; color: white; border:none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor:pointer;">DELETE</button>
        </div>
    `).join('');
}

function selectFaculty(id, name) {
    activeFacultyId = id;
    document.getElementById('activeFacultyName').textContent = name;
    const deptPanel = document.getElementById('deptPanel');
    deptPanel.style.opacity = "1";
    deptPanel.style.pointer_events = "all";
    renderFaculties();
    renderDepartments(id);
}

function renderDepartments(fId) {
    const container = document.getElementById('deptList');
    const filtered = allDepartments.filter(d => d.faculty_id === fId);
    container.innerHTML = filtered.length > 0 
        ? filtered.map(d => `
            <div class="list-item">
                <span style="flex:1;">${sanitise(d.name)}</span>
                <button class="deleteDeptBtn" data-dept-id="${sanitise(d.id)}" style="color:red; background:none; border:none; cursor:pointer;">✕</button>
            </div>`).join('')
        : '<p class="empty-msg" style="padding:10px; color:gray;">No departments found for this faculty.</p>';
}

async function deleteDepartment(id) {
    if (!confirm("Delete this department?")) return;
    const { error } = await sb.from('departments').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else {
        await initSystemManager();
        renderDepartments(activeFacultyId);
    }
}

function filterFaculties() {
    const term = document.getElementById('facultySearch').value.toLowerCase();
    const container = document.getElementById('facultyList');
    const filtered = allFaculties.filter(f => f.name.toLowerCase().includes(term));
    container.innerHTML = filtered.map(f => `
        <div class="list-item faculty-item ${activeFacultyId === f.id ? 'active' : ''}" data-faculty-id="${sanitise(f.id)}" data-faculty-name="${sanitise(f.name).replace(/'/g, "\\'")}" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; cursor:pointer;">
            <span class="f-name" style="flex: 1;">${sanitise(f.name)}</span>
            <button class="deleteFacultyBtn" data-faculty-id="${sanitise(f.id)}" style="background: #ff4444; color: white; border:none; border-radius: 4px; padding: 4px 8px; font-size: 10px;">DELETE</button>
        </div>
    `).join('');
}

async function deleteFaculty(id) {
    if (!confirm("CRITICAL: Deleting this faculty will delete ALL its departments. Proceed?")) return;
    const { error } = await sb.from('faculties').delete().eq('id', id);
    if (error) alert("Delete failed: " + error.message);
    else {
        if (activeFacultyId === id) activeFacultyId = null;
        await initSystemManager();
    }
}

// --- SNAP TEST ---
let snapQuestions   = [];
let snapToken       = null;
let snapSessionId   = null;

function populateSnapFaculty() {
    const el = document.getElementById('snapFaculty');
    if (!el) return;
    el.innerHTML = '<option value="">-- Select Faculty --</option>' +
        allFaculties.map(f => `<option value="${sanitise(f.name)}">${sanitise(f.name)}</option>`).join('');
}

function updateSnapDepartments() {
    const facultyName = document.getElementById('snapFaculty').value;
    const deptSelect  = document.getElementById('snapDept');
    if (!deptSelect) return;
    if (!facultyName) {
        deptSelect.innerHTML = '<option value="">-- Select Faculty First --</option>';
        return;
    }
    const facObj   = allFaculties.find(f => f.name === facultyName);
    if (!facObj) return;
    const filtered = allDepartments.filter(d => d.faculty_id === facObj.id);
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' +
        filtered.map(d => `<option value="${sanitise(d.name)}">${sanitise(d.name)}</option>`).join('');
}

async function generateSnapTest() {
    const topic    = document.getElementById('snapTopic').value.trim();
    const count    = document.getElementById('snapCount').value;
    const course   = document.getElementById('snapCourse').value.trim().toUpperCase();
    const faculty  = document.getElementById('snapFaculty').value;
    const dept     = document.getElementById('snapDept').value;
    const level    = document.getElementById('snapLevel').value;
    const semester = document.getElementById('snapSemester').value;

    if (!topic)   return alert("⚠️ Enter a topic or instruction for the AI.");
    if (!course)  return alert("⚠️ Enter a course code.");
    if (!faculty) return alert("⚠️ Select a faculty.");
    if (!dept)    return alert("⚠️ Select a department.");

    const btn = document.getElementById('snapGenerateBtn');
    btn.disabled = true;
    btn.textContent = "🤖 Generating questions...";
    setBadge("GENERATING", "#f0c060", "#000");

    try {
        const { data: aiData, error: invokeError } = await sb.functions.invoke("hyper-api", {
            body: {
                prompt: `You are a university exam question generator for Nigerian Allied Health Science students.
Generate exactly ${count} multiple choice questions on: "${topic}".
Course: ${course} | Department: ${dept} | Level: ${level}L | Semester: ${semester}.

STRICT FORMAT — Return ONLY a valid JSON array, no extra text, no markdown:
[
  {
    "question": "Full question text here?",
    "option1": "First option",
    "option2": "Second option", 
    "option3": "Third option",
    "option4": "Fourth option",
    "answer": 2
  }
]
The "answer" field must be the NUMBER (1-4) of the correct option.
OUTPUT NOTHING ELSE – only the JSON array, no explanation, no markdown.`,
                courseCode: course,
                isLecturer: true
            }
        });

        // 1. Check for invoke error first
        if (invokeError) {
            console.error("Hyper API Invoke Error:", invokeError);
            throw new Error(invokeError.message || "Failed to connect to AI service.");
        }

        // 2. Check if aiData actually exists
        if (!aiData || typeof aiData !== 'object') {
            console.error("AI returned no data. Raw response:", aiData);
            throw new Error("AI returned an empty response. Please try again.");
        }

        // 3. Check if aiData has an answer property
        if (!aiData.answer || typeof aiData.answer !== 'string') {
            console.error("AI response missing 'answer' field:", aiData);
            throw new Error("AI response was empty. Try a more detailed topic description.");
        }

        let rawText = aiData.answer;

        // 4. Strip Markdown code fences
        let cleaned = rawText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        // 5. Find the JSON array boundaries
        const startIdx = cleaned.indexOf('[');
        const endIdx   = cleaned.lastIndexOf(']');

        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
            console.error("Could not find JSON array in AI response. Cleaned text:", cleaned.substring(0, 300));
            throw new Error("AI did not return a valid question format. Please rephrase your topic and try again.");
        }

        const jsonStr = cleaned.substring(startIdx, endIdx + 1);

        // 6. Try to parse the JSON
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseErr) {
            console.error("JSON Parse Error:", parseErr.message);
            console.error("Attempted to parse:", jsonStr.substring(0, 200));
            throw new Error("AI returned malformed questions. Please rephrase your topic and try again.");
        }

        // 7. Validate the structure
        if (!Array.isArray(parsed) || parsed.length === 0) {
            console.error("Parsed JSON is not a valid array:", parsed);
            throw new Error("AI returned an empty question set. Please try a more specific topic.");
        }

        snapQuestions = parsed;

        renderSnapPreview(snapQuestions);
        document.getElementById('snapStep2').style.display = "block";
        document.getElementById('snapStep1').style.display = "none";

        snapToken = Math.floor(1000 + Math.random() * 9000).toString();
        document.getElementById('snapTokenDisplay').textContent = snapToken;
        setBadge("READY TO LAUNCH", "#00ff88", "#0f5132");

    } catch (err) {
        console.error("Snap Test Error:", err);
        alert("❌ AI Error: " + (err.message || "Unknown error occurred. Please check your internet connection."));
        setBadge("ERROR", "#ff4444", "white");
    } finally {
        btn.disabled = false;
        btn.textContent = "🤖 GENERATE QUESTIONS WITH AI";
    }
}

function renderSnapPreview(questions) {
    const container = document.getElementById('snapPreviewList');
    container.innerHTML = questions.map((q, i) => `
        <div style="background:rgba(255,255,255,0.05); border:1px solid #444; border-radius:8px; padding:12px; margin-bottom:10px;">
            <div style="color:white; font-weight:bold; margin-bottom:8px;">
                <span style="color:#00ff88;">${i + 1}.</span> ${sanitise(q.question)}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.85em;">
                ${[1,2,3,4].map(n => `
                    <div style="padding:6px 10px; border-radius:5px; background:${q.answer == n ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.05)'}; border:1px solid ${q.answer == n ? '#00ff88' : '#333'}; color:${q.answer == n ? '#00ff88' : '#ccc'};">
                        ${n}. ${sanitise(q['option'+n] || '')}
                        ${q.answer == n ? ' ✅' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function launchSnapTest() {
    const course    = document.getElementById('snapCourse').value.trim().toUpperCase();
    const faculty   = document.getElementById('snapFaculty').value;
    const dept      = document.getElementById('snapDept').value;
    const level     = document.getElementById('snapLevel').value;
    const semester  = document.getElementById('snapSemester').value;
    const duration  = parseInt(document.getElementById('snapDuration').value) || 10;

    const btn = document.getElementById('snapLaunchBtn');
    btn.disabled = true;
    btn.textContent = "🚀 Saving & Opening Gate...";

    try {
        const questionsToInsert = snapQuestions.map(q => ({
            questions:    q.question,
            "Option 1":   q.option1,
            "Option 2":   q.option2,
            "Option 3":   q.option3,
            "Option 4":   q.option4,
            answer:       parseInt(q.answer),
            course:       course,
            faculty:      faculty,
            department:   dept,
            level:        level,
            semester:     semester
        }));

        const { error: qErr } = await sb.from('questions').insert(questionsToInsert);
        if (qErr) throw qErr;

        const endTime = new Date(Date.now() + duration * 60000).toISOString();

        const { data: existing } = await sb
            .from('exam_sessions')
            .select('id')
            .eq('department', dept)
            .eq('level',      level)
            .eq('semester',   semester)
            .maybeSingle();

        let sessionErr;
        if (existing) {
            ({ error: sessionErr } = await sb.from('exam_sessions')
                .update({ token_code: snapToken, is_active: "true", faculty, end_time: endTime })
                .eq('id', existing.id));
            snapSessionId = existing.id;
        } else {
            const { data: newSession, error: insertErr } = await sb.from('exam_sessions')
                .insert({ faculty, department: dept, level, semester, token_code: snapToken, is_active: "true", end_time: endTime })
                .select('id')
                .single();
            sessionErr    = insertErr;
            snapSessionId = newSession?.id;
        }

        if (sessionErr) throw sessionErr;

        document.getElementById('snapLiveStatus').style.display = "block";
        document.getElementById('snapLiveInfo').textContent =
            `${snapQuestions.length} questions | Token: ${snapToken} | ${dept} ${level}L | ${duration} mins | Gate is OPEN`;
        setBadge("🟢 LIVE", "#00ff88", "#0f5132");

        setTimeout(async () => {
            await closeSnapGate();
            alert(`⏰ Snap Test for ${dept} ${level}L has ended. Gate closed automatically.`);
        }, duration * 60000);

        alert(`✅ ${snapQuestions.length} questions saved!\nToken: ${snapToken}\nGate is OPEN for ${dept} ${level}L.\nTell students to enter token: ${snapToken}`);

    } catch (err) {
        console.error("Launch Error:", err);
        alert("❌ Launch failed: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "🚀 SAVE TO DB & OPEN GATE NOW";
    }
}

async function closeSnapGate() {
    if (!snapSessionId) return alert("No active snap test session found.");
    const { error } = await sb.from('exam_sessions')
        .update({ is_active: "false" })
        .eq('id', snapSessionId);
    if (!error) {
        setBadge("GATE CLOSED", "#ff4444", "white");
        document.getElementById('snapLiveStatus').style.display = "none";
        alert("🔒 Snap Test gate closed.");
    }
}

function resetSnapTest() {
    snapQuestions = [];
    snapToken     = null;
    snapSessionId = null;
    document.getElementById('snapStep1').style.display = "block";
    document.getElementById('snapStep2').style.display = "none";
    document.getElementById('snapLiveStatus').style.display = "none";
    document.getElementById('snapTopic').value = "";
    setBadge("IDLE", "#333", "#aaa");
}

function setBadge(text, bg, color) {
    const badge = document.getElementById('snapStatusBadge');
    if (!badge) return;
    badge.textContent = text;
    badge.style.background = bg;
    badge.style.color = color;
}

// --- EVENT BINDING (CSP‑compliant) ---
document.addEventListener('DOMContentLoaded', function() {
    // Basic buttons
    document.getElementById('pushAnnouncementBtn')?.addEventListener('click', postAnnouncement);
    document.getElementById('clearAnnouncementBtn')?.addEventListener('click', clearAnnouncement);
    document.getElementById('publishMaterialBtn')?.addEventListener('click', handlePublish);

    // Live classroom
    document.getElementById('startClassBtn')?.addEventListener('click', launchMeeting);
    document.getElementById('stopClassBtn')?.addEventListener('click', closeMeeting);

    // Snap test
    document.getElementById('snapGenerateBtn')?.addEventListener('click', generateSnapTest);
    document.getElementById('resetSnapTestBtn')?.addEventListener('click', resetSnapTest);
    document.getElementById('snapLaunchBtn')?.addEventListener('click', launchSnapTest);
    document.getElementById('closeSnapGateBtn')?.addEventListener('click', closeSnapGate);
    document.getElementById('snapFaculty')?.addEventListener('change', updateSnapDepartments);

    // System structure
    document.getElementById('addFacultyBtn')?.addEventListener('click', addFaculty);
    document.getElementById('addDeptBtn')?.addEventListener('click', addDepartment);
    document.getElementById('facultySearch')?.addEventListener('keyup', filterFaculties);

    // Event delegation for resource list
    const resourceList = document.getElementById('adminResourceList');
    if (resourceList) {
        resourceList.addEventListener('click', (e) => {
            const btn = e.target.closest('.deleteResourceBtn');
            if (btn) {
                const id = btn.getAttribute('data-resource-id');
                if (id) deleteResource(id);
            }
        });
    }

    // Event delegation for faculty list
    const facultyContainer = document.getElementById('facultyList');
    if (facultyContainer) {
        facultyContainer.addEventListener('click', (e) => {
            // Delete faculty button
            const deleteBtn = e.target.closest('.deleteFacultyBtn');
            if (deleteBtn) {
                e.stopPropagation();
                const id = deleteBtn.getAttribute('data-faculty-id');
                if (id) deleteFaculty(id);
                return;
            }
            // Select faculty (click on list item or its child)
            const listItem = e.target.closest('.faculty-item');
            if (listItem) {
                const id = listItem.getAttribute('data-faculty-id');
                const name = listItem.getAttribute('data-faculty-name');
                if (id && name) selectFaculty(id, name);
            }
        });
    }

    // Event delegation for department list
    const deptContainer = document.getElementById('deptList');
    if (deptContainer) {
        deptContainer.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.deleteDeptBtn');
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-dept-id');
                if (id) deleteDepartment(id);
            }
        });
    }

    // Initialize data
    initSystemManager();
    loadResources();
});