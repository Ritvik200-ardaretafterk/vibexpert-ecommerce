import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const WishlistPage: React.FC = () => {
    const { state } = useStore();

    return (
        <div style={{ paddingTop: '20px', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px 80px' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 800,
                        color: '#f1f5f9',
                        marginBottom: '8px',
                    }}
                >
                    Your <span className="gradient-text">Wishlist</span> ❤️
                </motion.h1>
                <p style={{ color: '#64748b', marginBottom: '40px' }}>
                    {state.wishlist.length} {state.wishlist.length === 1 ? 'item' : 'items'} saved
                </p>

                {state.wishlist.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            textAlign: 'center',
                            padding: '80px 20px',
                            background: 'var(--bg-card)',
                            borderRadius: '24px',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        <span style={{ fontSize: '5rem', display: 'block', marginBottom: '16px' }}>💜</span>
                        <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: '12px' }}>
                            Your wishlist is empty
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '32px' }}>
                            Start exploring and save products you love!
                        </p>
                        <Link
                            to="/shop"
                            className="btn-primary"
                            style={{ textDecoration: 'none', display: 'inline-block' }}
                        >
                            Browse Products
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid-responsive">
                        {state.wishlist.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default WishlistPage;
