import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

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
    } = useStore();

    const handleCheckout = () => {
        // Redirect to vibexpert.online for login before checkout
        window.open(
            'https://www.vibexpert.online',
            '_blank'
        );
    };

    return (
        <AnimatePresence>
            {state.isCartOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCartOpen(false)}
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
                        {/* Header */}
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
                                    Your Cart
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
                                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {state.cart.length > 0 && (
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
                                    onClick={() => setCartOpen(false)}
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

                        {/* Cart Items */}
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
                        </div>

                        {/* Footer */}
                        {state.cart.length > 0 && (
                            <div
                                style={{
                                    padding: '20px 24px',
                                    borderTop: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-card)',
                                }}
                            >
                                {/* Savings */}
                                {cartSavings > 0 && (
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

                                {/* Total */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '16px',
                                        fontSize: '1.1rem',
                                    }}
                                >
                                    <span style={{ color: '#f1f5f9', fontWeight: 600 }}>Total</span>
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
                                        ₹{cartTotal.toLocaleString()}
                                    </span>
                                </div>

                                {/* Checkout */}
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCheckout}
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
                                    Login & Checkout →
                                </motion.button>

                                <p
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '0.75rem',
                                        color: '#64748b',
                                        marginTop: '10px',
                                    }}
                                >
                                    You must be logged in on{' '}
                                    <a
                                        href="https://www.vibexpert.online"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#a855f7', textDecoration: 'none' }}
                                    >
                                        vibexpert.online
                                    </a>{' '}
                                    to checkout
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
