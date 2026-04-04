import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PromoBar: React.FC = () => {
    const [visible, setVisible] = useState(true);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                        background: 'linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)',
                        backgroundSize: '200% 100%',
                        animation: 'gradient-shift 4s ease infinite',
                        padding: '8px 24px',
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1100,
                    }}
                    id="promo-bar"
                >
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', margin: 0 }}>
                        🎓 Exciting discounts & mind-blowing coupons for students — Grab yours before they're gone!{' '}
                        <a
                            href="/deals"
                            style={{
                                color: 'white',
                                textDecoration: 'underline',
                                fontWeight: 700,
                            }}
                        >
                            Explore Deals →
                        </a>
                    </p>
                    <button
                        onClick={() => setVisible(false)}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '4px',
                            lineHeight: 1,
                        }}
                        aria-label="Close promo"
                    >
                        ✕
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PromoBar;
