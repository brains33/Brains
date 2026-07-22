   /**
 * BRAINS AI — Landing Page Script (v2)
 * Improvements:
 *  - securityCheck: timeout + AbortController (no infinite hang)
 *  - FAQ: live search with keyword highlighting
 *  - Chatbot: keyboard navigation, ARIA state, outside-click,
 *             Escape key closes, auto-focus search on open
 *  - Deferred init via DOMContentLoaded
 */

// ============================================================
// SECURITY CHECK
// Timeout after 4 seconds so a slow/offline server never
// blocks the page indefinitely.
// ============================================================
async function securityCheck() {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 4000);

    try {
        const response = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/auth-proxy',
            {
                method: 'POST',
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check-system-status' })
            }
        );

        clearTimeout(timeout);
        const result = await response.json();

        if (response.status === 503 || result.error === 'MAINTENANCE_MODE') {
            document.body.innerHTML = `
                <div style="
                    background:#040f08; color:#e8f0eb;
                    height:100vh; display:flex; flex-direction:column;
                    align-items:center; justify-content:center;
                    font-family:'DM Sans',sans-serif; gap:16px; padding:32px;
                    text-align:center;
                ">
                    <div style="font-size:2.5rem;">⚠️</div>
                    <h1 style="color:#ff6b6b; font-size:1.4rem; margin:0;">SYSTEM LOCKED</h1>
                    <p style="color:#6b7f72; max-width:340px; line-height:1.6;">
                        Administrative lockdown is active. Please contact the BRAINS ICT department.
                    </p>
                </div>`;
            window.stop();
        }
    } catch (err) {
        clearTimeout(timeout);
        // Network failure or timeout — allow page to load normally.
        // Only block on confirmed 503, not on connectivity issues.
        if (err.name !== 'AbortError') {
            console.warn('[BRAINS] Security check could not complete:', err.message);
        }
    }
}

securityCheck();


// ============================================================
// DOM INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // ── FAQ DATABASE ───────────────────────────────────────
    const faqList = [
        {
            question: 'How do I log in?',
            answer: 'Use your student token (sent to your email) and the matrix number provided during registration. Go to the Student Login page.'
        },
        {
            question: 'I forgot my student token. What should I do?',
            answer: 'Contact your department admin or ICT support. Tokens cannot be recovered online for security reasons.'
        },
        {
            question: 'How do I start an exam?',
            answer: 'Select a course from "Available Exams", enter the 6-digit token shown when the gate is open, then click START EXAMINATION.'
        },
        {
            question: 'Where can I find the exam token?',
            answer: 'When the admin opens the gate, the token appears inside the green "GATE OPEN" card on your dashboard, or next to each exam.'
        },
        {
            question: 'What is a carryover / resit exam?',
            answer: 'If you scored below 50% in a course, you may see a separate "Carryover / Resit Exams" card. Use the provided token to take it.'
        },
        {
            question: 'How do I download my results?',
            answer: 'When results are released by the admin, the "Download Results" button will appear in the sidebar. Click it to generate a PDF.'
        },
        {
            question: 'How do I download my exam card?',
            answer: 'When exam cards are released, click "Exam Card" in the sidebar to download your CBT hall ticket.'
        },
        {
            question: 'What is the scheduled exam card?',
            answer: 'It shows paper-based exam dates, times, and venues as scheduled by the admin. It appears when the admin releases it.'
        },
        {
            question: 'How do I submit an assignment?',
            answer: 'Fill in the course code, title, and content in the "Submit Assignment" card, then click SUBMIT ASSIGNMENT.'
        },
        {
            question: 'How can I view my graded assignment?',
            answer: 'Scores and feedback appear in the "My Assignment Scores" section after the admin grades your submission.'
        },
        {
            question: 'How do I join a live class?',
            answer: 'When a live class is active, a green alert appears at the top of your dashboard. Click "JOIN NOW" to enter the Jitsi video room.'
        },
        {
            question: 'Where can I find study materials?',
            answer: 'Use the search bar in "Classroom Resources" to filter by course code. Materials are posted by your admin.'
        },
        {
            question: 'How do I check my bursary status or clearance?',
            answer: 'Bursary and clearance is handled by the bursary staff. Contact the bursary office directly via the portal or check your email for the 6-digit school fees clearance token.'
        },
        {
            question: 'I have payment issues. Who should I contact?',
            answer: 'For payment, school fees, or clearance, reach out to the bursary department.'
        },
        {
            question: 'What should I do if the exam gate is closed?',
            answer: 'Only the admin can open the gate. Wait for the scheduled exam time or contact your lecturer.'
        },
        {
            question: 'How can I reset my student login password?',
            answer: 'On the login page, click "Forgot Password". Enter your name and matrix number. Once verified, a 6-digit code will be sent to your email and you can set a new password.'
        },
        {
            question: 'Can I bring a calculator into the CBT exam hall?',
            answer: 'No. The exam page has an embedded Scientific Calculator built in.'
        },
        {
            question: 'Can I pay school fees online?',
            answer: 'Yes. At the end of the semester, once promoted to the next level or semester, your account will be set to pending and redirected to the payment page. Enter your matrix number, pay, and wait for the bursary clearance token.'
        },
        {
            question: 'How do I activate my account / do my clearance?',
            answer: 'When the bursary sends a 6-digit code to your email, look above the login page for "Activate BRAINS". Enter your matrix number and the token. Once verified you can log in.'
        },
        {
            question: 'Can I get a refund on my school fees?',
            answer: 'School fees are generally non-refundable once processed. Exceptions apply for duplicate payments or technical errors — see the Refund Policy link in the footer for details, or contact the bursary directly.'
        },
        {
            question: 'How is my personal data used?',
            answer: 'See the Privacy Policy link in the footer for full details on what data is collected, why, and your rights under Nigeria\'s NDPR.'
        }
    ];

    // ── ELEMENT REFS ───────────────────────────────────────
    const fab              = document.getElementById('chatbotButton');
    const modal            = document.getElementById('chatbotModal');
    const closeModalBtn    = document.getElementById('closeChatbotModalBtn');
    const questionsList    = document.getElementById('chatbotQuestionsList');
    const answerDiv        = document.getElementById('chatbotAnswer');
    const answerText       = document.getElementById('answerText');
    const closeAnswerBtn   = document.getElementById('closeAnswerBtn');
    const searchInput      = document.getElementById('chatbotSearch');

    // ── HIGHLIGHT HELPER ───────────────────────────────────
    // Safely wraps matched text in <mark> without using innerHTML on user input
    function highlight(text, query) {
        if (!query) return document.createTextNode(text);
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        const frag  = document.createDocumentFragment();
        parts.forEach(part => {
            if (regex.test(part)) {
                const mark = document.createElement('mark');
                mark.textContent = part;
                frag.appendChild(mark);
                regex.lastIndex = 0; // reset after .test()
            } else {
                frag.appendChild(document.createTextNode(part));
            }
        });
        return frag;
    }

    // ── RENDER QUESTIONS ───────────────────────────────────
    function renderQuestions(query = '') {
        const q       = query.trim().toLowerCase();
        const filtered = q
            ? faqList.filter(item => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q))
            : faqList;

        questionsList.innerHTML = '';

        if (!filtered.length) {
            const none = document.createElement('div');
            none.className = 'no-results';
            none.textContent = 'No matching questions found.';
            questionsList.appendChild(none);
            return;
        }

        filtered.forEach((item, i) => {
            const div = document.createElement('div');
            div.className   = 'chatbot-question';
            div.tabIndex    = 0;
            div.setAttribute('role', 'listitem');
            div.appendChild(highlight(item.question, q));

            const activate = () => {
                answerText.textContent = item.answer;
                answerDiv.style.display = 'block';
                answerDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };

            div.addEventListener('click', activate);
            div.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
            });

            questionsList.appendChild(div);
        });
    }

    // ── OPEN / CLOSE MODAL ─────────────────────────────────
    let isOpen = false;

    function openModal() {
        isOpen = true;
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        fab.setAttribute('aria-expanded', 'true');
        answerDiv.style.display = 'none';
        searchInput.value = '';
        renderQuestions();
        // Focus search after transition
        setTimeout(() => searchInput.focus(), 80);
    }

    function closeModal() {
        isOpen = false;
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
    }

    fab.addEventListener('click', () => isOpen ? closeModal() : openModal());
    closeModalBtn.addEventListener('click', closeModal);
    closeAnswerBtn.addEventListener('click', () => { answerDiv.style.display = 'none'; });

    // Close on Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen) closeModal();
    });

    // Close on outside click
    document.addEventListener('click', e => {
        if (isOpen && !modal.contains(e.target) && e.target !== fab) closeModal();
    });

    // Live search
    searchInput.addEventListener('input', () => {
        answerDiv.style.display = 'none';
        renderQuestions(searchInput.value);
    });

    // Initial render
    renderQuestions();
});
