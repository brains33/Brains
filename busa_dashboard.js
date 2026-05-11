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
    global: { headers: { 'x-busa-token': sessionStorage.getItem('busaToken') || '' } }
});

const PROXY_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy';

// ── AUTH GUARD ──────────────────────────────────────────────────────
(async function () {
    const token = sessionStorage.getItem('busaToken');
    if (sessionStorage.getItem('busaLoggedIn') !== 'true' || !token) {
        window.location.replace("busa_login.html");
        return;
    }
    const busaData = JSON.parse(sessionStorage.getItem('busaData') || '{}');
    document.getElementById('bursarName').innerText = `Welcome, ${busaData.name || 'Bursar'}`;
    loadBursaryStudents();
})();

// ── LOGOUT ──────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = "busa_login.html";
});

// ── LOAD STUDENTS ────────────────────────────────────────────────────
async function loadBursaryStudents() {
    const listDiv = document.getElementById('busStudentList');
    const searchTerm = document.getElementById('bussearch')?.value.trim() || "";
    const showPaidOnly = document.getElementById('filterPaidOnly')?.checked || false;
    const token = sessionStorage.getItem('busaToken');

    if (!token) {
        window.location.replace("busa_login.html");
        return;
    }

    try {
        let query = sb.from('students').select('*', {
            headers: { 'x-busa-token': token }
        }).order('name');

        if (searchTerm) {
            query = query.or(`name.ilike.%${searchTerm}%,matrix_no.ilike.%${searchTerm}%`);
        }

        if (showPaidOnly) {
            query = query.eq('payment_status', 'paid').is('clearance_code', null);
        }

        const { data: students, error } = await query;
        if (error) throw error;

        // ── Render list (or show empty message) ──────────────────────
        if (!students || students.length === 0) {
            listDiv.innerHTML = '<p style="color:gray; padding:20px;">No students found.</p>';
        } else {
            listDiv.innerHTML = students.map(s => {
                const safeName   = sanitise(s.name || '');
                const safeMatrix = sanitise(s.matrix_no || '');
                const safeStatus = sanitise(s.status || '');
                const safeCode   = sanitise(s.clearance_code || '');
                const safeId     = s.id;
                const hasEmail   = s.email && s.email.trim() !== '';

                const paidAmount = s.payment_amount ? `₦${Number(s.payment_amount).toLocaleString()}` : '';
                const paymentInfo = s.payment_status === 'paid'
                    ? `<span style="color:#0f5132; font-weight:bold;">✅ PAID ${paidAmount}</span>`
                    : `<span style="color:#856404; font-weight:bold;">⏳ UNPAID</span>`;

                const codeDisplay = s.clearance_code ? `
                    <span style="color:#00ff88; font-weight:bold; font-size:1.1rem; letter-spacing:2px;">Token: ${safeCode}</span>
                    <button class="copy-code-btn" data-code="${safeCode}" style="margin-left:8px; background:#333; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem;">📋 Copy</button>
                ` : '<span style="color:#ffc107;">No token yet</span>';

                const generateBtn = !s.clearance_code
                    ? `<button class="generate-code-btn" data-student-id="${safeId}" style="background:#00ff88; color:#000; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">🎟️ Generate Token</button>`
                    : `<button class="regenerate-code-btn" data-student-id="${safeId}" style="background:#f0c060; color:#000; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">🔄 Regenerate</button>`;

                const emailBtn = s.clearance_code && hasEmail
                    ? `<button class="send-email-btn" data-student-id="${safeId}" style="background:#007bff; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold; margin-left:4px;">📧 Send Email</button>`
                    : '';

                return `
                <div style="background:white; padding:15px; border-radius:10px; margin-bottom:12px; border-left:5px solid ${s.status === 'approved' ? '#00ff88' : '#f0c060'}; color:#333;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong>${safeName.toUpperCase()}</strong>
                        <span style="font-size:0.8rem; color:#888;">${safeMatrix}</span>
                    </div>
                    <div style="margin:10px 0; display:flex; justify-content:space-between; align-items:center;">
                        <span>Status: <strong style="color:${s.status === 'approved' ? '#0f5132' : '#856404'}">${safeStatus.toUpperCase()}</strong></span>
                        <div>${codeDisplay}</div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        ${paymentInfo}
                        ${s.payment_ref ? `<small style="color:#888;">Ref: ${sanitise(s.payment_ref)}</small>` : ''}
                    </div>
                    <div style="display:flex; gap:8px; justify-content:flex-end;">
                        ${generateBtn}
                        ${emailBtn}
                    </div>
                </div>`;
            }).join('');
        }

        // ── UPDATE STATISTICS ──────────────────────────────────────
        // 1. Overall paid stats (all paid students in the database)
        const { data: paidStudents, error: paidErr } = await sb
            .from('students')
            .select('payment_amount')
            .eq('payment_status', 'paid');

        if (!paidErr && paidStudents) {
            document.getElementById('totalPaidCount').textContent = paidStudents.length;
            const totalSum = paidStudents.reduce((sum, cur) => sum + parseFloat(cur.payment_amount || 0), 0);
            document.getElementById('totalPaidSum').textContent = '₦' + totalSum.toLocaleString();
        } else {
            document.getElementById('totalPaidCount').textContent = '0';
            document.getElementById('totalPaidSum').textContent = '₦0';
        }

        // 2. Filtered stats (only when the "Paid & no token" filter is active)
        const filteredStatsDiv = document.getElementById('filteredStats');
        if (showPaidOnly && students && students.length > 0) {
            const eligibleCount = students.length;
            const eligibleSum = students.reduce((sum, cur) => sum + parseFloat(cur.payment_amount || 0), 0);
            document.getElementById('eligibleCount').textContent = eligibleCount;
            document.getElementById('eligibleSum').textContent = '₦' + eligibleSum.toLocaleString();
            filteredStatsDiv.style.display = 'block';
        } else {
            filteredStatsDiv.style.display = 'none';
        }

    } catch (err) {
        console.error(err);
        listDiv.innerHTML = '<p style="color:red;">Error loading student list.</p>';
        document.getElementById('filteredStats').style.display = 'none';
    }
}
// ── SEARCH ───────────────────────────────────────────────────────────
document.getElementById('bussearch').addEventListener('input', loadBursaryStudents);

// ── FILTER TOGGLE (paid only) ────────────────────────────────────────
document.getElementById('filterPaidOnly')?.addEventListener('change', loadBursaryStudents);

// ── EVENT DELEGATION FOR BUTTONS ────────────────────────────────────
document.getElementById('busStudentList').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const studentId = btn.getAttribute('data-student-id');

    if (btn.classList.contains('generate-code-btn')) {
        generateStudentClearanceCode(studentId);
    } else if (btn.classList.contains('regenerate-code-btn')) {
        regenerateStudentClearanceCode(studentId);
    } else if (btn.classList.contains('copy-code-btn')) {
        const code = btn.getAttribute('data-code');
        navigator.clipboard.writeText(code).then(() => alert('📋 Token copied!'));
    } else if (btn.classList.contains('send-email-btn')) {
        sendClearanceEmail(studentId);
    }
});

// ── GENERATE CLEARANCE CODE (single) ─────────────────────────────────
async function generateStudentClearanceCode(studentId) {
    if (!confirm("Generate a new clearance token for this student?")) return;
    const numericId = parseInt(studentId, 10);
    if (isNaN(numericId)) { alert("Invalid student ID."); return; }

    try {
        const resp = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-busa-token': sessionStorage.getItem('busaToken') || ''
            },
            body: JSON.stringify({ action: 'generate-student-clearance-code', studentId: numericId })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Token generated: " + result.clearance_code);
        loadBursaryStudents();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ── REGENERATE CLEARANCE CODE ────────────────────────────────────────
async function regenerateStudentClearanceCode(studentId) {
    if (!confirm("Generate a NEW clearance token? The old token will be replaced.")) return;
    const numericId = parseInt(studentId, 10);
    if (isNaN(numericId)) { alert("Invalid student ID."); return; }

    try {
        const resp = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-busa-token': sessionStorage.getItem('busaToken') || ''
            },
            body: JSON.stringify({ action: 'regenerate-student-clearance-code', studentId: numericId })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ New Token: " + result.clearance_code);
        loadBursaryStudents();
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ── SEND EMAIL (single) ──────────────────────────────────────────────
async function sendClearanceEmail(studentId) {
    if (!confirm("Send the clearance code to the student's email?")) return;
    try {
        const resp = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-busa-token': sessionStorage.getItem('busaToken') || ''
            },
            body: JSON.stringify({ action: 'send-clearance-email', studentId })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        alert("✅ Email sent successfully!");
    } catch (err) {
        alert("Error: " + err.message);
    }
}

// ── BULK GENERATE TOKENS ────────────────────────────────────────────
document.getElementById('bulkGenerateBtn')?.addEventListener('click', async () => {
    if (!confirm("⚠️ Generate clearance tokens for ALL PAID students without tokens?\nThis may take a moment.")) return;
    const btn = document.getElementById('bulkGenerateBtn');
    const msg = document.getElementById('bulkStatusMsg');
    btn.disabled = true;
    msg.innerText = "⏳ Generating tokens...";

    try {
        // You can optionally collect faculty/dept/level/semester from extra dropdowns.
        // For simplicity, we send empty strings = process all
        const resp = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-busa-token': sessionStorage.getItem('busaToken') || ''
            },
            body: JSON.stringify({
                action: 'bulk-generate-clearance-tokens',
                faculty: '',   // empty = all
                department: '',
                level: '',
                semester: ''
            })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        msg.style.color = '#0f5132';
        msg.innerText = `✅ Generated ${result.count} tokens for paid students!`;
        loadBursaryStudents();
    } catch (err) {
        msg.style.color = '#ff4444';
        msg.innerText = '❌ ' + err.message;
    } finally {
        btn.disabled = false;
    }
});

// ── BULK SEND EMAILS ────────────────────────────────────────────────
document.getElementById('bulkEmailBtn')?.addEventListener('click', async () => {
    if (!confirm("⚠️ Send clearance emails to ALL paid students with unused tokens?")) return;
    const btn = document.getElementById('bulkEmailBtn');
    const msg = document.getElementById('bulkStatusMsg');
    btn.disabled = true;
    msg.innerText = "⏳ Sending emails...";

    try {
        const resp = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-busa-token': sessionStorage.getItem('busaToken') || ''
            },
            body: JSON.stringify({
                action: 'bulk-send-clearance-emails',
                faculty: '',
                department: '',
                level: '',
                semester: ''
            })
        });
        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error);
        msg.style.color = '#0f5132';
        msg.innerText = `✅ Sent: ${result.sent} | Failed: ${result.failed} | Total: ${result.total}`;
    } catch (err) {
        msg.style.color = '#ff4444';
        msg.innerText = '❌ ' + err.message;
    } finally {
        btn.disabled = false;
    }
});