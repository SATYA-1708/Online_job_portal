import { API_BASE } from '../config';

/**
 * Loads the Razorpay checkout.js script once and resolves when ready.
 */
function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).Razorpay) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
    });
}

export interface RazorpayCheckoutOptions {
    packId: string;        // 'credits_5' | 'credits_15' | 'credits_30'
    token: string;         // JWT token of logged-in user
    userName: string;
    userEmail: string;
    onSuccess: (updatedUser: any) => void;
    onError?: (msg: string) => void;
}

/**
 * Opens the Razorpay checkout popup for buying a credit pack.
 * On payment success, verifies with the backend and calls onSuccess with the updated user.
 */
export async function openCreditCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
    const { packId, token, userName, userEmail, onSuccess, onError } = opts;

    try {
        await loadRazorpayScript();

        // Step 1: Create order on our backend
        const orderRes = await fetch(`${API_BASE}/auth/create-credit-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ pack: packId }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.message || 'Could not create order');

        // Step 2: Open Razorpay modal
        await new Promise<void>((resolve, reject) => {
            const rzp = new (window as any).Razorpay({
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'TECHSPARKX',
                description: `Buy ${orderData.packLabel}`,
                order_id: orderData.orderId,
                prefill: { name: userName, email: userEmail },
                theme: { color: '#10b981' },
                // Explicitly show UPI + QR alongside other methods
                config: {
                    display: {
                        blocks: {
                            upi_block: {
                                name: 'UPI / QR Code',
                                instruments: [
                                    { method: 'upi', flows: ['qr', 'collect', 'intent'] },
                                ],
                            },
                        },
                        sequence: ['block.upi_block'],
                        preferences: { show_default_blocks: true },
                    },
                },
                handler: async (payment: any) => {
                    try {
                        // Step 3: Verify payment + add credits
                        const verifyRes = await fetch(`${API_BASE}/auth/verify-credit-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: payment.razorpay_order_id,
                                razorpay_payment_id: payment.razorpay_payment_id,
                                razorpay_signature: payment.razorpay_signature,
                                pack: packId,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            onSuccess(verifyData);
                            resolve();
                        } else {
                            throw new Error(verifyData.message || 'Verification failed');
                        }
                    } catch (err: any) {
                        onError?.(err.message);
                        reject(err);
                    }
                },
                modal: {
                    ondismiss: () => {
                        resolve(); // user closed modal — not an error
                    },
                },
            });
            rzp.open();
        });
    } catch (err: any) {
        onError?.(err.message || 'Payment failed');
    }
}

/**
 * Opens the Razorpay checkout popup for purchasing a Pro/Expert badge.
 */
export async function openBadgeCheckout(opts: {
    badgeType: 'Pro' | 'Expert';
    token: string;
    userName: string;
    userEmail: string;
    onSuccess: (updatedUser: any) => void;
    onError?: (msg: string) => void;
}): Promise<void> {
    const { badgeType, token, userName, userEmail, onSuccess, onError } = opts;

    try {
        await loadRazorpayScript();

        // Step 1: Create order on our backend
        const orderRes = await fetch(`${API_BASE}/auth/create-badge-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ badgeType }),
        });
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.message || 'Could not create order');

        // Step 2: Open Razorpay modal
        await new Promise<void>((resolve, reject) => {
            const rzp = new (window as any).Razorpay({
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'TECHSPARKX',
                description: `Upgrade to ${orderData.badgeLabel}`,
                order_id: orderData.orderId,
                prefill: { name: userName, email: userEmail },
                theme: { color: '#0ea5e9' },
                handler: async (payment: any) => {
                    try {
                        // Step 3: Verify payment + upgrade user
                        const verifyRes = await fetch(`${API_BASE}/auth/verify-badge-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: payment.razorpay_order_id,
                                razorpay_payment_id: payment.razorpay_payment_id,
                                razorpay_signature: payment.razorpay_signature,
                                badgeType,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            onSuccess(verifyData);
                            resolve();
                        } else {
                            throw new Error(verifyData.message || 'Verification failed');
                        }
                    } catch (err: any) {
                        onError?.(err.message);
                        reject(err);
                    }
                },
                modal: { ondismiss: () => resolve() },
            });
            rzp.open();
        });
    } catch (err: any) {
        onError?.(err.message || 'Payment failed');
    }
}
