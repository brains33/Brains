
// ======================== SECURE PAYMENT FLOW (Flutterwave) ==========
// No hardcoded keys – all config fetched from server

let FLW_PUBLIC_KEY = null;
let student = null;
let paymentIntent = null;   // { intentId, signature, amount, reference }
let paymentCallbackFired = false; // guards onclose from overwriting a successful callback

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

    // Helper: fetch public configuration (Flutterwave public key)
    // NOTE: your busa-proxy's "get-public-config" action must be updated
    // server-side to return { flutterwavePublicKey } instead of
    // { paystackPublicKey }.
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
        FLW_PUBLIC_KEY = config.flutterwavePublicKey;
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
            if (!FLW_PUBLIC_KEY) {
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

    // Maps raw server error messages to specific, actionable guidance for
    // the student — instead of one generic "contact the bursary" catch-all.
    // Keeps the underlying message too, so nothing is hidden if a case
    // isn't explicitly matched below.
    function getFriendlyErrorMessage(rawMessage) {
        const msg = rawMessage || '';

        if (/payment intent expired/i.test(msg)) {
            return '⚠️ Your payment session expired before we could confirm it. Click "Look Up Fee" again to get a fresh session, then retry payment. Contact the bursary if money was deducted from your account.';
        }
        if (/payment intent already used/i.test(msg)) {
            return '✅ It looks like this payment was already confirmed. Try logging in — if it still shows as unpaid, contact the bursary with your payment reference.';
        }
        if (/invalid intent signature|intent student mismatch|invalid payment intent/i.test(msg)) {
            return '⚠️ We couldn\'t verify this payment session as belonging to you. Please click "Look Up Fee" again to start a fresh, correctly-linked session before retrying.';
        }
        if (/underpayment detected/i.test(msg)) {
            return '⚠️ ' + msg + ' It looks like the amount paid doesn\'t match your required fee — please contact the bursary with your payment reference before trying again, so a partial payment isn\'t lost.';
        }
        if (/payment not confirmed by flutterwave/i.test(msg)) {
            return '⚠️ Flutterwave has not confirmed this payment yet. If money was deducted from your account, please wait a few minutes and check your dashboard — contact the bursary with your payment reference if it still isn\'t reflected after 15 minutes.';
        }
        if (/failed to update payment status/i.test(msg)) {
            return '⚠️ Your payment was confirmed by Flutterwave, but we hit a technical issue recording it. Please contact the bursary with your payment reference — this is on our end, not something you need to retry.';
        }
        if (/student not found/i.test(msg)) {
            return '⚠️ We couldn\'t find your student record. Please double-check your matrix number and try again.';
        }
        if (/fee not configured/i.test(msg)) {
            return '⚠️ Your fee amount isn\'t set up yet for your level/semester. Please contact the bursary directly — this needs to be fixed on their end before you can pay.';
        }
        if (/too many requests|too many login attempts/i.test(msg)) {
            return '⚠️ ' + msg;
        }

        // Fallback for anything not explicitly handled above
        return '⚠️ ' + msg + ' Contact the bursary if payment was deducted.';
    }

    // Payment callback (handles Flutterwave response)
    // Flutterwave's inline callback fires with an object containing
    // status ("successful", "cancelled", "failed"), transaction_id, tx_ref.
    function handlePaymentCallback(response) {
        paymentCallbackFired = true; // mark before any early return — onclose fires right after this either way

        // Flutterwave's inline SDK returns different status strings
        // depending on payment method: "successful" was seen for the
        // documented/card case, but a real bank_transfer test returned
        // "completed" instead. Accept both.
        const rawStatus = response && response.status;
        const isSuccess = rawStatus === 'successful' || rawStatus === 'completed';

        if (!response || !isSuccess) {
            msgEl.className = 'msg error';
            msgEl.innerText = 'Payment was not successful. Please try again.';
            payBtn.disabled = false;
            return;
        }

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
                            transactionId: response.transaction_id,
                            reference: response.tx_ref,
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
                msgEl.innerText = getFriendlyErrorMessage(err.message);
                payBtn.disabled = false;
            }
        })();
    }

    // Intent expiry window on the server is 20 minutes (see busa-proxy).
    // Refresh a bit before expiry so we never open the popup with a
    // near-expired intent (checkout + OTP can easily take a few minutes).
    const INTENT_STALE_MS = 15 * 60 * 1000; // refresh if older than 15 minutes

    // Pay Now button: use the payment intent data
    payBtn.addEventListener('click', async () => {
        try {
            if (typeof FlutterwaveCheckout === 'undefined') {
                alert('Payment system not loaded. Please refresh the page.');
                console.error('FlutterwaveCheckout is undefined');
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

            // NOTE: Flutterwave amount is the ACTUAL naira amount —
            // do NOT multiply by 100 like Paystack's kobo requirement.
            const amount = paymentIntent.amount;
            const txRef = paymentIntent.reference;

            console.log('Initiating secure Flutterwave payment with intent:', {
                intentId: paymentIntent.intentId,
                amount,
                txRef
            });

            paymentCallbackFired = false; // reset for this attempt

            FlutterwaveCheckout({
                public_key: FLW_PUBLIC_KEY,
                tx_ref: txRef,
                amount: amount,
                currency: 'NGN',
                payment_options: 'card, banktransfer, ussd',
                customer: {
                    email: customerEmail,
                    name: student.name
                },
                meta: {
                    matrix_no: student.matrix_no,
                    intentId: paymentIntent.intentId,
                    signature: paymentIntent.signature
                },
                customizations: {
                    title: 'BRAINS AI School Fee Payment',
                    description: `Fee payment for ${student.matrix_no}`
                },
                callback: handlePaymentCallback,
                onclose: function () {
                    // Flutterwave calls onclose whenever the modal closes —
                    // including right after a SUCCESSFUL payment, not just
                    // when the user actually cancels. Without this guard,
                    // onclose can race with the async verification inside
                    // handlePaymentCallback and overwrite its "verifying/
                    // success" message with a false "cancelled" message.
                    if (paymentCallbackFired) return;
                    msgEl.className = 'msg error';
                    msgEl.innerText = 'Payment was cancelled. Please try again.';
                }
            });
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
