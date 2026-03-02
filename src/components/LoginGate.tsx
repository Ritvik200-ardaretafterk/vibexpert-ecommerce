import React from 'react';
import { motion } from 'framer-motion';

const LoginGate: React.FC = () => {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'linear-gradient(135deg, #050510 0%, #0a0a20 50%, #0f0f2e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
            }}
        >
            {/* Animated background glow */}
            <div
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                    position: 'relative',
                    maxWidth: '440px',
                    width: '100%',
                    textAlign: 'center',
                    padding: '48px 36px',
                    borderRadius: '24px',
                    background: 'rgba(15, 15, 40, 0.8)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.1)',
                }}
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{
                        fontSize: '3.5rem',
                        marginBottom: '8px',
                    }}
                >
                    🛒
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.02em',
                    }}
                >
                    <span style={{ color: '#f1f5f9' }}>VIBEXPERT</span>
                    <span
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        .SHOP
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{
                        color: '#94a3b8',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        margin: '0 0 32px 0',
                    }}
                >
                    Sign in through <strong style={{ color: '#a855f7' }}>vibexpert.online</strong> to access the shop.
                    Browse exclusive products with your VibeXpert account!
                </motion.p>

                {/* Login Button */}
                <motion.a
                    href="https://www.vibexpert.online"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{
                        scale: 1.03,
                        boxShadow: '0 8px 30px rgba(124,58,237,0.4)',
                    }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '16px 36px',
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: 'white',
                        borderRadius: '14px',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        border: 'none',
                        transition: 'box-shadow 0.3s',
                        boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
                    }}
                >
                    <span>🚀</span>
                    <span>Login on VibExpert</span>
                    <span>→</span>
                </motion.a>

                {/* Info text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                    style={{
                        color: '#64748b',
                        fontSize: '0.78rem',
                        marginTop: '24px',
                        lineHeight: 1.5,
                    }}
                >
                    After logging in, click <strong style={{ color: '#94a3b8' }}>🛒 VibeShop</strong> in the navigation
                    to access the shop seamlessly.
                </motion.p>

                {/* Decorative dots */}
                <div
                    style={{
                        position: 'absolute',
                        top: '-30px',
                        right: '-30px',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.1))',
                        filter: 'blur(20px)',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-20px',
                        left: '-20px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.05))',
                        filter: 'blur(15px)',
                        pointerEvents: 'none',
                    }}
                />
            </motion.div>
        </div>
    );
};

export default LoginGate;
