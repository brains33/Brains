
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

    // Main: load fee and create payment intent
    async function loadFee() {
        const matrixInputEl = document.getElementById('matrixInput');
        const matrixInput = matrixInputEl.value.trim().toUpperCase();
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
            // 1. Ensure config is loaded (first time)
            if (!PAYSTACK_PUBLIC_KEY) {
                await fetchPublicConfig();
            }

            // 2. Create payment intent (signed token)
            const intentResp = await fetch(
                'https://gjznwgzoqpfdnxywixgv.supabase.co/functions/v1/busa-proxy',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'create-payment-intent',
                        matrixNo: matrixInput
                    })
                }
            );
            const intentResult = await intentResp.json();

            if (!intentResp.ok) {
                throw new Error(intentResult.error || 'Failed to create payment intent.');
            }

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
                reference: intentResult.reference
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
                msgEl.innerText = '⚠️ ' + err.message + ' Contact the bursary if payment was deducted.';
                payBtn.disabled = false;
            }
        })();
    }

    // Pay Now button: use the payment intent data
    payBtn.addEventListener('click', () => {
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