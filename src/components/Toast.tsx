import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';

const Toast: React.FC = () => {
    const { state } = useStore();

    const colors = {
        success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', icon: '✅' },
        error: { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)', text: '#f43f5e', icon: '❌' },
        info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6', icon: 'ℹ️' },
    };

    return (
        <AnimatePresence>
            {state.toast && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9999,
                        padding: '14px 24px',
                        borderRadius: '14px',
                        background: colors[state.toast.type].bg,
                        border: `1px solid ${colors[state.toast.type].border}`,
                        color: colors[state.toast.type].text,
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        maxWidth: '90vw',
                    }}
                >
                    <span>{colors[state.toast.type].icon}</span>
                    {state.toast.message}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
