import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';

const API_URL = 'https://vibexpert-backend-main.onrender.com';

// Extend window for Razorpay
declare global {
    interface Window {
        Razorpay: any;
    }
}

type CheckoutStep = 'cart' | 'login' | 'address' | 'paying';

interface ShippingAddress {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
}

const emptyAddress: ShippingAddress = {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
};

const CartDrawer: React.FC = () => {
    const {
        state,
        setCartOpen,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        cartSavings,
        showToast,
    } = useStore();

    const { user } = useAuth();

    const [step, setStep] = useState<CheckoutStep>('cart');
    const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; paymentId: string } | null>(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountType: string; discountValue: number; discount: number } | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [suggestedCoupons, setSuggestedCoupons] = useState<Array<{ id: string; code: string; discountType: string; discountValue: number; minOrderAmount: number; sellerName: string; expiryDate: string | null }>>([]);
    const [showSuggested, setShowSuggested] = useState(false);
    const [suggestedLoading, setSuggestedLoading] = useState(false);

    // Reset state when drawer closes
    const handleClose = () => {
        setCartOpen(false);
        // Delay reset so exit animation completes
        setTimeout(() => {
            setStep('cart');
            setIsProcessing(false);
            if (orderSuccess) {
                setOrderSuccess(null);
                clearCart();
            }
        }, 350);
    };

    // Fetch suggested coupons when cart opens
    React.useEffect(() => {
        if (state.isCartOpen && state.cart.length > 0) {
            fetchSuggestedCoupons();
        }
    }, [state.isCartOpen]);

    // Clear applied coupon when cart changes
    React.useEffect(() => {
        if (appliedCoupon) {
            // Re-validate with new total
            handleApplyCoupon(appliedCoupon.code);
        }
    }, [cartTotal]);

    const fetchSuggestedCoupons = async () => {
        setSuggestedLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/shop/coupons`);
            const data = await res.json();
            if (data.success) setSuggestedCoupons(data.coupons || []);
        } catch (err) {
            // silently fail
        } finally {
            setSuggestedLoading(false);
        }
    };

    const handleApplyCoupon = async (code?: string) => {
        const codeToApply = code || couponCode.trim();
        if (!codeToApply) return;
        setCouponLoading(true);
        setCouponError('');
        try {
            const res = await fetch(`${API_URL}/api/shop/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToApply, orderTotal: cartTotal }),
            });
            const data = await res.json();
            if (data.valid) {
                setAppliedCoupon(data.coupon);
                setCouponCode('');
                setCouponError('');
                if (!code) showToast(`Coupon ${data.coupon.code} applied! 🎉`, 'success');
            } else {
                setCouponError(data.error || 'Invalid coupon');
                if (code) setAppliedCoupon(null);
            }
        } catch (err) {
            setCouponError('Failed to validate coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
        showToast('Coupon removed', 'info');
    };

    const finalTotal = appliedCoupon ? Math.max(0, cartTotal - appliedCoupon.discount) : cartTotal;

    const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
        setAddress(prev => ({ ...prev, [field]: value }));
    };

    const isAddressValid = () => {
        return (
            address.fullName.trim().length >= 2 &&
            /^[6-9]\d{9}$/.test(address.phone.trim()) &&
            address.addressLine1.trim().length >= 5 &&
            address.city.trim().length >= 2 &&
            address.state.trim().length >= 2 &&
            /^\d{6}$/.test(address.pincode.trim())
        );
    };

    const handleProceedToAddress = () => {
        if (!user) {
            setStep('login');
            return;
        }
        setStep('address');
    };

    const handlePayNow = async () => {
        if (!isAddressValid()) {
            showToast('Please fill all address fields correctly', 'error');
            return;
        }

        setIsProcessing(true);
        setStep('paying');

        const token = localStorage.getItem('shop_auth_token');
        if (!token) {
            showToast('Please login first', 'error');
            setIsProcessing(false);
            setStep('address');
            return;
        }

        try {
            // 1. Create order on backend
            const items = state.cart.map(item => ({
                id: item.product.id,
                productId: item.product.id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
                image: item.product.image,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
            }));

            const createRes = await fetch(`${API_URL}/api/shop/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items,
                    totalAmount: finalTotal,
                    originalAmount: cartTotal,
                    couponCode: appliedCoupon?.code || null,
                    shippingAddress: address,
                }),
            });

            const createData = await createRes.json();

            if (!createData.success) {
                throw new Error(createData.error || 'Failed to create order');
            }

            // 2. Open Razorpay checkout
            const options = {
                key: createData.razorpayKeyId,
                amount: createData.amount * 100,
                currency: createData.currency || 'INR',
                name: 'VibExpert Shop',
                description: `Order — ${items.length} item${items.length > 1 ? 's' : ''}`,
                order_id: createData.orderId,
                prefill: {
                    name: address.fullName,
                    email: user?.email || '',
                    contact: address.phone,
                },
                theme: {
                    color: '#7c3aed',
                    backdrop_color: 'rgba(0,0,0,0.7)',
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                        setStep('address');
                        showToast('Payment cancelled', 'info');
                    },
                },
                handler: async (response: any) => {
                    // 3. Verify payment on backend
                    try {
                        const verifyRes = await fetch(`${API_URL}/api/shop/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                shippingAddress: address,
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            setOrderSuccess({
                                orderId: verifyData.orderId,
                                paymentId: verifyData.paymentId,
                            });
                            showToast('🎉 Order placed successfully!', 'success');
                        } else {
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (err: any) {
                        showToast(err.message || 'Payment verification failed', 'error');
                        setStep('address');
                    }
                    setIsProcessing(false);
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
                showToast(`Payment failed: ${response.error.description}`, 'error');
                setIsProcessing(false);
                setStep('address');
            });
            rzp.open();
        } catch (err: any) {
            console.error('Checkout error:', err);
            showToast(err.message || 'Something went wrong', 'error');
            setIsProcessing(false);
            setStep('address');
        }
    };

    // ────── Shared styles ──────
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 14px',
        background: 'var(--bg-surface, #1a1a2e)',
        border: '1px solid var(--border-subtle, #2a2a4a)',
        borderRadius: '10px',
        color: '#f1f5f9',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box' as const,
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '0.78rem',
        fontWeight: 600,
        color: '#94a3b8',
        marginBottom: '4px',
        display: 'block',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    };

    // ────── RENDER ──────
    return (
        <AnimatePresence>
            {state.isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 2000,
                        }}
                    />

                    {/* Cart Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '100%',
                            maxWidth: '440px',
                            zIndex: 2001,
                            background: 'var(--bg-secondary)',
                            borderLeft: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        id="cart-drawer"
                    >
                        {/* ───── ORDER SUCCESS SCREEN ───── */}
                        {orderSuccess ? (
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px 24px',
                                    textAlign: 'center',
                                    gap: '16px',
                                }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                                    style={{ fontSize: '5rem' }}
                                >
                                    🎉
                                </motion.div>
                                <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                                    Order Placed!
                                </h2>
                                <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: 300, lineHeight: 1.5 }}>
                                    Your order has been confirmed. We've sent a confirmation email to <strong style={{ color: '#a855f7' }}>{user?.email}</strong>.
                                </p>
                                <div
                                    style={{
                                        background: 'rgba(124, 58, 237, 0.1)',
                                        border: '1px solid rgba(124, 58, 237, 0.25)',
                                        borderRadius: '12px',
                                        padding: '14px 18px',
                                        width: '100%',
                                        maxWidth: 320,
                                        textAlign: 'center',
                                    }}
                                >
                                    <p style={{ color: '#c4b5fd', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                                        📦 You can track your order on{' '}
                                        <strong style={{ color: '#a855f7' }}>vibexpert.shop</strong> and{' '}
                                        <a
                                            href="https://www.vibexpert.online"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 700 }}
                                        >
                                            vibexpert.online
                                        </a>{' '}
                                        (Profile → My Orders)
                                    </p>
                                </div>
                                <div
                                    style={{
                                        background: 'var(--bg-card, #1a1a2e)',
                                        borderRadius: '12px',
                                        padding: '16px 20px',
                                        border: '1px solid var(--border-subtle)',
                                        width: '100%',
                                        maxWidth: 320,
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Order ID</span>
                                        <span style={{ color: '#f1f5f9', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                            {orderSuccess.orderId.slice(0, 20)}…
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Payment ID</span>
                                        <span style={{ color: '#10b981', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                                            {orderSuccess.paymentId.slice(0, 20)}…
                                        </span>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleClose}
                                    style={{
                                        marginTop: '12px',
                                        padding: '12px 32px',
                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 700,
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Continue Shopping
                                </motion.button>
                            </div>
                        ) : (
                            <>
                                {/* ───── HEADER ───── */}
                                <div
                                    style={{
                                        padding: '20px 24px',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <div>
                                        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                                            {step === 'cart' && 'Your Cart'}
                                            {step === 'login' && '🔐 Login Required'}
                                            {step === 'address' && '📦 Shipping Address'}
                                            {step === 'paying' && '💳 Processing...'}
                                        </h2>
                                        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                                            {step === 'cart' && `${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                                            {step === 'login' && 'Login via vibexpert.online to checkout'}
                                            {step === 'address' && 'Where should we deliver?'}
                                            {step === 'paying' && 'Please complete payment in Razorpay'}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {step !== 'cart' && step !== 'paying' && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setStep('cart')}
                                                style={{
                                                    background: 'rgba(148, 163, 184, 0.1)',
                                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                                    color: '#94a3b8',
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                ← Back
                                            </motion.button>
                                        )}
                                        {step === 'cart' && state.cart.length > 0 && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={clearCart}
                                                style={{
                                                    background: 'rgba(244, 63, 94, 0.1)',
                                                    border: '1px solid rgba(244, 63, 94, 0.2)',
                                                    color: '#f43f5e',
                                                    padding: '6px 14px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                Clear All
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={handleClose}
                                            style={{
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-subtle)',
                                                color: '#f1f5f9',
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            ✕
                                        </motion.button>
                                    </div>
                                </div>

                                {/* ───── STEP: CART ITEMS ───── */}
                                {step === 'cart' && (
                                    <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
                                        {state.cart.length === 0 ? (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    height: '100%',
                                                    gap: '16px',
                                                    color: '#64748b',
                                                }}
                                            >
                                                <span style={{ fontSize: '4rem' }}>🛒</span>
                                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Your cart is empty</p>
                                                <p style={{ fontSize: '0.85rem' }}>Add some products to get started!</p>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setCartOpen(false)}
                                                    className="btn-primary"
                                                    style={{ marginTop: '8px' }}
                                                >
                                                    Continue Shopping
                                                </motion.button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <AnimatePresence>
                                                    {state.cart.map((item) => {
                                                        const discount = Math.round(
                                                            ((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100
                                                        );
                                                        return (
                                                            <motion.div
                                                                key={item.product.id}
                                                                layout
                                                                initial={{ opacity: 0, x: 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0, padding: 0 }}
                                                                style={{
                                                                    display: 'flex',
                                                                    gap: '14px',
                                                                    padding: '14px',
                                                                    background: 'var(--bg-card)',
                                                                    borderRadius: '14px',
                                                                    border: '1px solid var(--border-subtle)',
                                                                }}
                                                            >
                                                                {/* Product Image */}
                                                                <div
                                                                    style={{
                                                                        width: '80px',
                                                                        height: '80px',
                                                                        borderRadius: '10px',
                                                                        overflow: 'hidden',
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    <img
                                                                        src={item.product.image}
                                                                        alt={item.product.name}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'cover',
                                                                        }}
                                                                    />
                                                                </div>

                                                                {/* Product Info */}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <h4
                                                                        style={{
                                                                            fontSize: '0.9rem',
                                                                            fontWeight: 600,
                                                                            color: '#f1f5f9',
                                                                            marginBottom: '4px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap',
                                                                        }}
                                                                    >
                                                                        {item.product.name}
                                                                    </h4>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                                        <span style={{ fontWeight: 700, color: '#a855f7', fontSize: '0.95rem' }}>
                                                                            ₹{item.product.price.toLocaleString()}
                                                                        </span>
                                                                        {discount > 0 && (
                                                                            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>{discount}% off</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Quantity Controls */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.85 }}
                                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                                            style={{
                                                                                width: '28px',
                                                                                height: '28px',
                                                                                borderRadius: '6px',
                                                                                background: 'var(--bg-surface)',
                                                                                border: '1px solid var(--border-subtle)',
                                                                                color: '#f1f5f9',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.9rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                            }}
                                                                        >
                                                                            −
                                                                        </motion.button>
                                                                        <span
                                                                            style={{
                                                                                width: '36px',
                                                                                textAlign: 'center',
                                                                                fontWeight: 600,
                                                                                fontSize: '0.9rem',
                                                                                color: '#f1f5f9',
                                                                            }}
                                                                        >
                                                                            {item.quantity}
                                                                        </span>
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.85 }}
                                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                                            style={{
                                                                                width: '28px',
                                                                                height: '28px',
                                                                                borderRadius: '6px',
                                                                                background: 'var(--bg-surface)',
                                                                                border: '1px solid var(--border-subtle)',
                                                                                color: '#f1f5f9',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.9rem',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                            }}
                                                                        >
                                                                            +
                                                                        </motion.button>

                                                                        <motion.button
                                                                            whileHover={{ scale: 1.1 }}
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => removeFromCart(item.product.id)}
                                                                            style={{
                                                                                marginLeft: 'auto',
                                                                                background: 'none',
                                                                                border: 'none',
                                                                                color: '#64748b',
                                                                                cursor: 'pointer',
                                                                                fontSize: '0.85rem',
                                                                                padding: '4px',
                                                                            }}
                                                                        >
                                                                            🗑️
                                                                        </motion.button>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        {/* Coupon Section */}
                                        {state.cart.length > 0 && (
                                            <div style={{ marginTop: '16px' }}>
                                                {/* Applied Coupon */}
                                                {appliedCoupon ? (
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '10px 14px',
                                                        background: 'rgba(16, 185, 129, 0.08)',
                                                        border: '1px solid rgba(16, 185, 129, 0.2)',
                                                        borderRadius: '12px',
                                                        marginBottom: '12px',
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '1.1rem' }}>🎟️</span>
                                                            <div>
                                                                <p style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
                                                                    {appliedCoupon.code} applied
                                                                </p>
                                                                <p style={{ color: '#6ee7b7', fontSize: '0.72rem', margin: 0 }}>
                                                                    You save ₹{appliedCoupon.discount.toLocaleString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <motion.button
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={removeCoupon}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#f43f5e',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                padding: '4px 8px',
                                                            }}
                                                        >
                                                            Remove
                                                        </motion.button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Coupon Input */}
                                                        <div style={{
                                                            display: 'flex',
                                                            gap: '8px',
                                                            marginBottom: couponError ? '4px' : '8px',
                                                        }}>
                                                            <input
                                                                value={couponCode}
                                                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                                                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                                placeholder="Enter coupon code"
                                                                style={{
                                                                    flex: 1,
                                                                    padding: '10px 14px',
                                                                    background: 'var(--bg-surface, #1a1a2e)',
                                                                    border: '1px solid var(--border-subtle, #2a2a4a)',
                                                                    borderRadius: '10px',
                                                                    color: '#f1f5f9',
                                                                    fontSize: '0.85rem',
                                                                    fontFamily: 'monospace',
                                                                    letterSpacing: '1px',
                                                                    outline: 'none',
                                                                    boxSizing: 'border-box' as const,
                                                                }}
                                                            />
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleApplyCoupon()}
                                                                disabled={!couponCode.trim() || couponLoading}
                                                                style={{
                                                                    padding: '10px 18px',
                                                                    background: couponCode.trim() ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(100, 116, 139, 0.2)',
                                                                    color: couponCode.trim() ? 'white' : '#64748b',
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.82rem',
                                                                    cursor: couponCode.trim() ? 'pointer' : 'not-allowed',
                                                                    whiteSpace: 'nowrap' as const,
                                                                }}
                                                            >
                                                                {couponLoading ? '...' : 'Apply'}
                                                            </motion.button>
                                                        </div>
                                                        {couponError && (
                                                            <p style={{ color: '#f43f5e', fontSize: '0.75rem', margin: '0 0 8px', paddingLeft: '4px' }}>{couponError}</p>
                                                        )}
                                                    </>
                                                )}

                                                {/* Suggested Coupons */}
                                                {!appliedCoupon && (
                                                    <div>
                                                        <motion.button
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setShowSuggested(!showSuggested)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#a855f7',
                                                                fontSize: '0.78rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                padding: '4px 0',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                            }}
                                                        >
                                                            🎟️ {showSuggested ? 'Hide' : 'View'} available coupons
                                                            <span style={{ fontSize: '0.7rem', transition: 'transform 0.2s', transform: showSuggested ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                                        </motion.button>

                                                        <AnimatePresence>
                                                            {showSuggested && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2 }}
                                                                    style={{ overflow: 'hidden', marginTop: '8px' }}
                                                                >
                                                                    {suggestedLoading ? (
                                                                        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                                                                            <motion.div
                                                                                animate={{ rotate: 360 }}
                                                                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                                                style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(168, 85, 247, 0.2)', borderTopColor: '#a855f7' }}
                                                                            />
                                                                        </div>
                                                                    ) : suggestedCoupons.length > 0 ? (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                            {suggestedCoupons.map((c) => (
                                                                                <motion.div
                                                                                    key={c.id}
                                                                                    whileHover={{ scale: 1.01 }}
                                                                                    whileTap={{ scale: 0.98 }}
                                                                                    onClick={() => {
                                                                                        setCouponCode(c.code);
                                                                                        handleApplyCoupon(c.code);
                                                                                        setShowSuggested(false);
                                                                                    }}
                                                                                    style={{
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        justifyContent: 'space-between',
                                                                                        padding: '10px 12px',
                                                                                        background: 'var(--bg-card, #1a1a2e)',
                                                                                        border: '1px dashed rgba(168, 85, 247, 0.3)',
                                                                                        borderRadius: '10px',
                                                                                        cursor: 'pointer',
                                                                                    }}
                                                                                >
                                                                                    <div>
                                                                                        <p style={{ color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px', margin: 0 }}>
                                                                                            {c.code}
                                                                                        </p>
                                                                                        <p style={{ color: '#64748b', fontSize: '0.7rem', margin: '2px 0 0' }}>
                                                                                            {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                                                                                            {c.minOrderAmount > 0 ? ` • Min ₹${c.minOrderAmount}` : ''}
                                                                                            {' • by '}{c.sellerName}
                                                                                        </p>
                                                                                    </div>
                                                                                    <span style={{
                                                                                        fontSize: '0.7rem',
                                                                                        fontWeight: 700,
                                                                                        color: '#a855f7',
                                                                                        background: 'rgba(168, 85, 247, 0.1)',
                                                                                        padding: '4px 10px',
                                                                                        borderRadius: '6px',
                                                                                        whiteSpace: 'nowrap' as const,
                                                                                    }}>TAP TO APPLY</span>
                                                                                </motion.div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p style={{ color: '#475569', fontSize: '0.78rem', textAlign: 'center', padding: '12px 0' }}>
                                                                            No coupons available right now
                                                                        </p>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ───── STEP: LOGIN PROMPT ───── */}
                                {step === 'login' && (
                                    <div
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '40px 24px',
                                            textAlign: 'center',
                                            gap: '18px',
                                        }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0, rotate: -20 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', damping: 12 }}
                                            style={{ fontSize: '4.5rem' }}
                                        >
                                            🔐
                                        </motion.div>
                                        <h3 style={{ color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                                            Login to Checkout
                                        </h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 280, lineHeight: 1.6, margin: 0 }}>
                                            You need to be logged in on{' '}
                                            <strong style={{ color: '#a855f7' }}>vibexpert.online</strong> to place an order.
                                            Your cart items will be saved!
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)' }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => {
                                                window.open('https://www.vibexpert.online', '_blank');
                                            }}
                                            style={{
                                                marginTop: '8px',
                                                padding: '14px 32px',
                                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '14px',
                                                fontWeight: 700,
                                                fontSize: '1rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                            }}
                                        >
                                            🌐 Login on vibexpert.online
                                        </motion.button>
                                        <p style={{ color: '#475569', fontSize: '0.78rem', maxWidth: 260, lineHeight: 1.5, margin: 0 }}>
                                            After logging in, click the <strong style={{ color: '#64748b' }}>🛒 VibeShop</strong> button
                                            to return here with your session active.
                                        </p>
                                    </div>
                                )}

                                {/* ───── STEP: ADDRESS FORM ───── */}
                                {step === 'address' && (
                                    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <div>
                                                <label style={labelStyle}>Full Name *</label>
                                                <input
                                                    style={inputStyle}
                                                    placeholder="John Doe"
                                                    value={address.fullName}
                                                    onChange={e => handleAddressChange('fullName', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Phone Number *</label>
                                                <input
                                                    style={inputStyle}
                                                    placeholder="9876543210"
                                                    maxLength={10}
                                                    value={address.phone}
                                                    onChange={e => handleAddressChange('phone', e.target.value.replace(/\D/g, ''))}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Address Line 1 *</label>
                                                <input
                                                    style={inputStyle}
                                                    placeholder="House/Flat No., Building, Street"
                                                    value={address.addressLine1}
                                                    onChange={e => handleAddressChange('addressLine1', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Address Line 2</label>
                                                <input
                                                    style={inputStyle}
                                                    placeholder="Landmark, Area (optional)"
                                                    value={address.addressLine2}
                                                    onChange={e => handleAddressChange('addressLine2', e.target.value)}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>City *</label>
                                                    <input
                                                        style={inputStyle}
                                                        placeholder="Mumbai"
                                                        value={address.city}
                                                        onChange={e => handleAddressChange('city', e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={labelStyle}>State *</label>
                                                    <input
                                                        style={inputStyle}
                                                        placeholder="Maharashtra"
                                                        value={address.state}
                                                        onChange={e => handleAddressChange('state', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ maxWidth: 180 }}>
                                                <label style={labelStyle}>Pincode *</label>
                                                <input
                                                    style={inputStyle}
                                                    placeholder="400001"
                                                    maxLength={6}
                                                    value={address.pincode}
                                                    onChange={e => handleAddressChange('pincode', e.target.value.replace(/\D/g, ''))}
                                                />
                                            </div>
                                        </div>

                                        {/* Order Summary */}
                                        <div
                                            style={{
                                                marginTop: '24px',
                                                background: 'var(--bg-card, #1a1a2e)',
                                                borderRadius: '14px',
                                                padding: '16px',
                                                border: '1px solid var(--border-subtle)',
                                            }}
                                        >
                                            <h4 style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 12px' }}>
                                                Order Summary
                                            </h4>
                                            {state.cart.map(item => (
                                                <div
                                                    key={item.product.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        fontSize: '0.82rem',
                                                        color: '#94a3b8',
                                                        marginBottom: '6px',
                                                    }}
                                                >
                                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                                                        {item.product.name} × {item.quantity}
                                                    </span>
                                                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                                                        ₹{(item.product.price * item.quantity).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            <div
                                                style={{
                                                    borderTop: '1px solid var(--border-subtle)',
                                                    marginTop: '10px',
                                                    paddingTop: '10px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                }}
                                            >
                                                <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>Total</span>
                                                <span
                                                    style={{
                                                        fontWeight: 800,
                                                        fontSize: '1.1rem',
                                                        background: 'linear-gradient(135deg, #f1f5f9, #a855f7)',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        backgroundClip: 'text',
                                                    }}
                                                >
                                                    ₹{cartTotal.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ───── STEP: PAYING (loader) ───── */}
                                {step === 'paying' && (
                                    <div
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '18px',
                                            padding: '40px',
                                        }}
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                            style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                border: '3px solid rgba(168, 85, 247, 0.2)',
                                                borderTopColor: '#a855f7',
                                            }}
                                        />
                                        <p style={{ color: '#94a3b8', fontSize: '0.95rem', textAlign: 'center' }}>
                                            {isProcessing ? 'Opening Razorpay...' : 'Setting up payment...'}
                                        </p>
                                    </div>
                                )}

                                {/* ───── FOOTER ───── */}
                                {state.cart.length > 0 && step !== 'paying' && (
                                    <div
                                        style={{
                                            padding: '20px 24px',
                                            borderTop: '1px solid var(--border-subtle)',
                                            background: 'var(--bg-card)',
                                        }}
                                    >
                                        {/* Savings */}
                                        {step === 'cart' && cartSavings > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '8px',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                <span style={{ color: '#10b981' }}>You Save</span>
                                                <span style={{ color: '#10b981', fontWeight: 600 }}>
                                                    ₹{cartSavings.toLocaleString()}
                                                </span>
                                            </div>
                                        )}

                                        {step === 'cart' && (
                                            <>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: appliedCoupon ? '8px' : '16px',
                                                    fontSize: '1.1rem',
                                                }}
                                            >
                                                <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{appliedCoupon ? 'Subtotal' : 'Total'}</span>
                                                <span
                                                    style={{
                                                        fontWeight: 800,
                                                        ...(appliedCoupon ? {
                                                            color: '#94a3b8',
                                                            fontSize: '1.1rem',
                                                            textDecoration: 'line-through',
                                                        } : {
                                                            background: 'linear-gradient(135deg, #f1f5f9, #a855f7)',
                                                            WebkitBackgroundClip: 'text',
                                                            WebkitTextFillColor: 'transparent',
                                                            backgroundClip: 'text',
                                                            fontSize: '1.3rem',
                                                        }),
                                                    }}
                                                >
                                                    ₹{cartTotal.toLocaleString()}
                                                </span>
                                            </div>
                                            {appliedCoupon && (
                                                <>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginBottom: '8px',
                                                            fontSize: '0.88rem',
                                                        }}
                                                    >
                                                        <span style={{ color: '#10b981' }}>Coupon ({appliedCoupon.code})</span>
                                                        <span style={{ color: '#10b981', fontWeight: 600 }}>-₹{appliedCoupon.discount.toLocaleString()}</span>
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            marginBottom: '16px',
                                                            fontSize: '1.2rem',
                                                        }}
                                                    >
                                                        <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Total</span>
                                                        <span
                                                            style={{
                                                                fontWeight: 800,
                                                                background: 'linear-gradient(135deg, #f1f5f9, #a855f7)',
                                                                WebkitBackgroundClip: 'text',
                                                                WebkitTextFillColor: 'transparent',
                                                                backgroundClip: 'text',
                                                                fontSize: '1.3rem',
                                                            }}
                                                        >
                                                            ₹{finalTotal.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            </>
                                        )}

                                        {/* CTA Buttons */}
                                        {step === 'cart' && (
                                            <motion.button
                                                whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleProceedToAddress}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                }}
                                                id="checkout-button"
                                            >
                                                Proceed to Checkout →
                                            </motion.button>
                                        )}

                                        {step === 'address' && (
                                            <motion.button
                                                whileHover={isAddressValid() ? { scale: 1.02, boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)' } : {}}
                                                whileTap={isAddressValid() ? { scale: 0.98 } : {}}
                                                onClick={handlePayNow}
                                                disabled={!isAddressValid() || isProcessing}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px',
                                                    background: isAddressValid()
                                                        ? 'linear-gradient(135deg, #059669, #10b981)'
                                                        : 'rgba(100, 116, 139, 0.3)',
                                                    color: isAddressValid() ? 'white' : '#64748b',
                                                    border: 'none',
                                                    borderRadius: '12px',
                                                    fontWeight: 700,
                                                    fontSize: '1rem',
                                                    cursor: isAddressValid() ? 'pointer' : 'not-allowed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    transition: 'background 0.2s',
                                                }}
                                                id="pay-now-button"
                                            >
                                                💳 Pay ₹{finalTotal.toLocaleString()} — Razorpay
                                            </motion.button>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>🔒 Secured by</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>Razorpay</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
