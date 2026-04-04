import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { categories } from '../data';

const Footer: React.FC = () => {
    return (
        <footer
            style={{
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-subtle)',
                padding: '80px 24px 32px',
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '48px',
                        marginBottom: '60px',
                    }}
                >
                    {/* Brand */}
                    <div>
                        <div
                            style={{
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                marginBottom: '16px',
                            }}
                        >
                            <span style={{ color: '#f1f5f9' }}>VIBEXPERT</span>
                            <span className="gradient-text">.SHOP</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.7, marginBottom: '20px' }}>
                            Your vibe, your style. Premium gifts, accessories & lifestyle products curated just for you.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {[
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>, href: 'https://www.instagram.com/vibexpert.shop?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==', external: true },
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>, href: 'https://www.linkedin.com/in/ri-merge-46a8653ab?utm_source=share_via&utm_content=profile&utm_medium=member_android', external: true },
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, href: '/support', external: false },
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, href: 'mailto:vibexpert06@gmail.com', external: true },
                            ].map((item, i) => (
                                item.external ? (
                                    <motion.a
                                        key={i}
                                        href={item.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            fontSize: '1.1rem',
                                        }}
                                    >
                                        {item.icon}
                                    </motion.a>
                                ) : (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.2, y: -2 }}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => window.location.href = item.href}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                background: 'var(--bg-card)',
                                                border: '1px solid var(--border-subtle)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textDecoration: 'none',
                                                fontSize: '1.1rem',
                                            }}
                                        >
                                            {item.icon}
                                        </div>
                                    </motion.div>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Categories
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {categories.map(cat => (
                                <Link
                                    key={cat.id}
                                    to={`/shop?category=${cat.id}`}
                                    style={{
                                        color: '#64748b',
                                        textDecoration: 'none',
                                        fontSize: '0.9rem',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    {cat.icon} {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Quick Links
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Home', path: '/' },
                                { label: 'Shop All', path: '/shop' },
                                { label: 'Deals', path: '/deals' },
                                { label: 'Wishlist', path: '/wishlist' },
                                { label: 'VibExpert.Online', path: 'https://www.vibexpert.online' },
                            ].map(link => (
                                link.path.startsWith('http') ? (
                                    <a
                                        key={link.label}
                                        href={link.path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}
                                    >
                                        {link.label}
                                    </a>
                                ) : (
                                    <Link
                                        key={link.label}
                                        to={link.path}
                                        style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}
                                    >
                                        {link.label}
                                    </Link>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Support
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>📧 vibexpert06@gmail.com</span>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>📞 +91 9347702626</span>
                            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>⏰ Mon-Sat, 10AM-7PM</span>
                            <a
                                href="https://www.vibexpert.online"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginTop: '8px',
                                    padding: '10px 20px',
                                    background: 'rgba(124, 58, 237, 0.1)',
                                    border: '1px solid rgba(124, 58, 237, 0.2)',
                                    borderRadius: '10px',
                                    color: '#a855f7',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                }}
                            >
                                Visit VibExpert.Online →
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div
                    style={{
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px',
                    }}
                >
                    <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                        © 2026 VibExpert.Shop. All rights reserved. Part of the{' '}
                        <a
                            href="https://www.vibexpert.online"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#a855f7', textDecoration: 'none' }}
                        >
                            VibExpert
                        </a>{' '}
                        ecosystem.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>Privacy Policy</span>
                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>Terms of Service</span>
                        <span style={{ fontSize: '0.8rem', color: '#475569' }}>Refund Policy</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
