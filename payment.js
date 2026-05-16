const SUPABASE_URL = 'https://gjznwgzoqpfdnxywixgv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZKjAmE-iA-C7KklIH1G-MA_nBAdobbI';
const PAYSTACK_PUBLIC_KEY = 'pk_live_061aa123199abd34122c17c3a8e02a102304b5e9';

let student = null;
let requiredFee = 0;

const lookupBtn  = document.getElementById('lookupBtn');
const payBtn     = document.getElementById('payBtn');
const feeDisplay = document.getElementById('feeDisplay');
const msgEl      = document.getElementById('msg');

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

        if (result.already_paid) {
            msgEl.className = 'msg success';
            msgEl.innerText = result.message;
            lookupBtn.disabled = false;
            return;
        }

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

// Separate function to handle the payment callback (non-async for Paystack compatibility)
function handlePaymentCallback(response) {
    // Immediately disable button and show verification message
    payBtn.disabled = true;
    msgEl.className = 'msg';
    msgEl.innerText = '⏳ Verifying payment, please wait...';

    // Perform verification asynchronously
    (async () => {
        try {
            const verifyResp = await fetch(
                'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'verify-payment',
                        reference: response.reference,
                        matrixNo: student.matrix_no
                    })
                }
            );
            const verifyResult = await verifyResp.json();
            if (!verifyResp.ok || !verifyResult.success) {
                throw new Error(verifyResult.error || 'Payment verification failed.');
            }
            msgEl.className = 'msg success';
            msgEl.innerText = '✅ Payment verified! Your bursary will process your clearance shortly.';
            payBtn.style.display = 'none';
            lookupBtn.style.display = 'none';
            document.getElementById('matrixInput').disabled = true;
            setTimeout(() => { window.location.href = 'student_login.html'; }, 2500);
        } catch (err) {
            msgEl.className = 'msg error';
            msgEl.innerText = '⚠️ ' + err.message + ' Contact the bursary if payment was deducted.';
            payBtn.disabled = false;
        }
    })();
}

payBtn.addEventListener('click', () => {
    try {
        if (typeof PaystackPop === 'undefined') {
            alert('Payment system not loaded. Please refresh the page.');
            console.error('PaystackPop is undefined');
            return;
        }

        if (!student || requiredFee <= 0) {
            alert('Fee data missing. Please look up your fee again.');
            return;
        }

        let customerEmail = student.email && student.email.trim() !== '' 
            ? student.email 
            : null;

        if (!customerEmail) {
            customerEmail = prompt('Please enter your email address to complete payment:', '');
            if (!customerEmail || !customerEmail.includes('@')) {
                alert('A valid email is required for payment.');
                return;
            }
        }

        const amountInKobo = requiredFee * 100;

        // 🔁 Generate reference in new format
        const randomChars = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let result = '';
            const length = Math.random() > 0.5 ? 5 : 6;
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };
        const reference = 'BRAINSAI' + student.matrix_no + Date.now() + randomChars();

        console.log('Initiating Paystack with:', { 
            email: customerEmail, 
            amount: amountInKobo, 
            reference 
        });

        const handler = PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: customerEmail,
            amount: amountInKobo,
            currency: 'NGN',
            ref: reference,
            metadata: {
                matrix_no: student.matrix_no,
                name: student.name
            },
            callback: handlePaymentCallback,
            onClose: function() {
                msgEl.className = 'msg error';
                msgEl.innerText = 'Payment was cancelled. Please try again.';
            }
        });
        handler.openIframe();
    } catch (err) {
        console.error('Payment initialization error:', err);
        alert('Payment error: ' + (err.message || 'Unknown error. Check console for details.'));
        msgEl.className = 'msg error';
        msgEl.innerText = '❌ Payment failed to initialize. Please refresh and try again.';
    }
});