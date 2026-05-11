const SUPABASE_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const PAYSTACK_PUBLIC_KEY = 'pk_test_8564df5226f404c1952b77183cc611d283be1a0c';

let student = null;   // will store student row from the edge function
let requiredFee = 0;

const lookupBtn  = document.getElementById('lookupBtn');
const payBtn     = document.getElementById('payBtn');
const feeDisplay = document.getElementById('feeDisplay');
const msgEl      = document.getElementById('msg');

// ── LOOK UP FEE ──────────────────────────────────────────────────────
lookupBtn.addEventListener('click', loadFee);

async function loadFee() {
    const matrixInput = document.getElementById('matrixInput').value.trim().toUpperCase();
    if (!matrixInput) {
        msgEl.className = 'msg error';
        msgEl.innerText = 'Please enter your matrix number.';
        return;
    }

    lookupBtn.disabled = true;
    feeDisplay.innerText = 'Loading...';
    payBtn.style.display = 'none';
    msgEl.innerText = '';

    try {
        const resp = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'lookup-fee',
                    matrixNo: matrixInput
                })
            }
        );

        const result = await resp.json();

        if (!resp.ok) {
            throw new Error(result.error || 'Failed to fetch fee.');
        }

        // If the student already paid
        if (result.already_paid) {
            msgEl.className = 'msg success';
            msgEl.innerText = result.message;
            lookupBtn.disabled = false;
            return;
        }

        // Store student info for the Paystack payload
        student = result.student;
        requiredFee = result.requiredFee;

        feeDisplay.innerText = `Amount: ₦${requiredFee.toLocaleString()}`;
        payBtn.style.display = 'block';
        lookupBtn.innerText = '🔍 Look Up Fee';
    } catch (err) {
        msgEl.className = 'msg error';
        msgEl.innerText = err.message;
        console.error(err);
    } finally {
        lookupBtn.disabled = false;
    }
}

// ── PAY NOW ─────────────────────────────────────────────────────────
payBtn.addEventListener('click', () => {
    console.log('Pay button clicked');   // debug: should appear in console

    if (typeof PaystackPop === 'undefined') {
        alert('Payment system not loaded. Please refresh the page.');
        return;
    }

    if (!student || requiredFee <= 0) {
        alert('Fee data missing. Please look up your fee again.');
        return;
    }

    console.log('Opening Paystack with fee:', requiredFee, 'Student:', student);

    const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: student.email || 'student@example.com',
        amount: requiredFee * 100,      // kobo
        currency: 'NGN',
        ref: 'BRAINS_' + Date.now(),
        metadata: {
            matrix_no: student.matrix_no,
            name: student.name
        },
        callback: function(response) {
    window.location.href = 'student_login.html';
}
            msgEl.innerText = '✅ Payment successful! Your bursary will process your clearance shortly.';
            payBtn.style.display = 'none';
            lookupBtn.style.display = 'none';
            document.getElementById('matrixInput').disabled = true;
        },
        onClose: function() {
            msgEl.className = 'msg error';
            msgEl.innerText = 'Payment was cancelled. Please try again.';
        }
    });
    handler.openIframe();
});