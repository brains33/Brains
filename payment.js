
// ======================== SECURE PAYMENT FLOW ========================
// No hardcoded keys – all config fetched from server

let PAYSTACK_PUBLIC_KEY = null;
let student = null;
let paymentIntent = null;   // { intentId, signature, amount, reference }

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements – fail early if missing
    const lookupBtn = document.getElementById('lookupBtn');
    const payBtn = document.getElementById('payBtn');
    const feeDisplay = document.getElementById('feeDisplay');
    const msgEl = document.getElementById('msg');
    const matrixInput = document.getElementById('matrixInput');

    if (!lookupBtn || !payBtn || !feeDisplay || !msgEl || !matrixInput) {
        console.error('Required payment form elements missing');
        return;
    }

    // Helper: fetch public configuration (Paystack public key)
    async function fetchPublicConfig() {
        const resp = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get-public-config' })
            }
        );
        if (!resp.ok) throw new Error('Failed to load configuration');
        const config = await resp.json();
        PAYSTACK_PUBLIC_KEY = config.paystackPublicKey;
    }

    // Helper: create (or re-create) a payment intent for a given matrix number.
    // Returns the intent result on success, throws on failure.
    async function requestPaymentIntent(matrixNo) {
        const intentResp = await fetch(
            'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-payment-intent',
                    matrixNo: matrixNo
                })
            }
        );
        const intentResult = await intentResp.json();
        if (!intentResp.ok) {
            throw new Error(intentResult.error || 'Failed to create payment intent.');
        }
        return intentResult;
    }

    // Main: load fee and create payment intent
    async function loadFee() {
        const matrixInputEl = document.getElementById('matrixInput');
        const matrixNo = matrixInputEl.value.trim().toUpperCase();
        if (!matrixNo) {
            msgEl.className = 'msg error';
            msgEl.innerText = 'Please enter your matrix number.';
            return;
        }

        lookupBtn.disabled = true;
        feeDisplay.innerText = 'Loading...';
        payBtn.style.display = 'none';
        msgEl.innerText = '';

        try {
            // 1. Ensure config is loaded (first time)
            if (!PAYSTACK_PUBLIC_KEY) {
                await fetchPublicConfig();
            }

            // 2. Create payment intent (signed token)
            const intentResult = await requestPaymentIntent(matrixNo);

            if (intentResult.already_paid) {
                msgEl.className = 'msg success';
                msgEl.innerText = intentResult.message;
                lookupBtn.disabled = false;
                return;
            }

            // Store intent data and student info
            paymentIntent = {
                intentId: intentResult.intentId,
                signature: intentResult.token,
                amount: intentResult.amount,
                reference: intentResult.reference,
                createdAt: Date.now()
            };
            student = intentResult.student;

            feeDisplay.innerText = `Amount: ₦${paymentIntent.amount.toLocaleString()}`;
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

    // Payment callback (handles Paystack response)
    function handlePaymentCallback(response) {
        payBtn.disabled = true;
        msgEl.className = 'msg';
        msgEl.innerText = '⏳ Verifying payment, please wait...';

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
                            matrixNo: student.matrix_no,
                            intentId: paymentIntent.intentId,
                            signature: paymentIntent.signature
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
                const isExpiredIntent = /expired/i.test(err.message || '');
                msgEl.innerText = isExpiredIntent
                    ? '⚠️ Your payment session expired before we could confirm it. Please click "Look Up Fee" again to retry. Contact the bursary if payment was deducted.'
                    : '⚠️ ' + err.message + ' Contact the bursary if payment was deducted.';
                payBtn.disabled = false;
            }
        })();
    }

    // Intent expiry window on the server is 20 minutes (see indext.ts —
    // this was previously mismatched at 5 minutes and has been fixed to
    // match this comment). Refresh a bit before expiry so we never open
    // the popup with a near-expired intent (checkout + OTP can easily
    // take a few minutes).
    const INTENT_STALE_MS = 15 * 60 * 1000; // refresh if older than 15 minutes

    // Pay Now button: use the payment intent data
    payBtn.addEventListener('click', async () => {
        try {
            if (typeof PaystackPop === 'undefined') {
                alert('Payment system not loaded. Please refresh the page.');
                console.error('PaystackPop is undefined');
                return;
            }

            if (!student || !paymentIntent) {
                alert('Payment data missing. Please look up your fee again.');
                return;
            }

            // If the intent is getting old, silently get a fresh one
            // before charging, instead of letting verification fail later.
            if (Date.now() - paymentIntent.createdAt > INTENT_STALE_MS) {
                payBtn.disabled = true;
                msgEl.className = 'msg';
                msgEl.innerText = '⏳ Refreshing payment session...';
                try {
                    const refreshed = await requestPaymentIntent(student.matrix_no);
                    if (refreshed.already_paid) {
                        msgEl.className = 'msg success';
                        msgEl.innerText = refreshed.message;
                        payBtn.style.display = 'none';
                        return;
                    }
                    paymentIntent = {
                        intentId: refreshed.intentId,
                        signature: refreshed.token,
                        amount: refreshed.amount,
                        reference: refreshed.reference,
                        createdAt: Date.now()
                    };
                    student = refreshed.student;
                    feeDisplay.innerText = `Amount: ₦${paymentIntent.amount.toLocaleString()}`;
                    msgEl.innerText = '';
                } catch (refreshErr) {
                    msgEl.className = 'msg error';
                    msgEl.innerText = 'Could not refresh payment session: ' + refreshErr.message;
                    return;
                } finally {
                    payBtn.disabled = false;
                }
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

            const amountInKobo = paymentIntent.amount * 100;
            const reference = paymentIntent.reference;

            console.log('Initiating secure Paystack payment with intent:', {
                intentId: paymentIntent.intentId,
                amount: paymentIntent.amount,
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
                    name: student.name,
                    intentId: paymentIntent.intentId,
                    signature: paymentIntent.signature
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

    // Attach the loadFee function to lookup button
    lookupBtn.addEventListener('click', loadFee);

    // Initial configuration fetch (ensures keys are ready)
    fetchPublicConfig().catch(console.error);
});