/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'https://vibexpert-backend-main.onrender.com';

interface ReviewPhoto {
    url: string;
    public_id: string;
}

interface Review {
    _id: string;
    productId: string;
    orderId: string;
    userId: string;
    username: string;
    profilePic: string | null;
    rating: number;
    title: string;
    review: string;
    photos: ReviewPhoto[];
    helpful: number;
    verified: boolean;
    createdAt: string;
}

interface ReviewStats {
    totalReviews: number;
    avgRating: number;
    distribution: { [key: number]: number };
}

interface Props {
    productId: string;
    productName: string;
}

const ReviewSection: React.FC<Props> = ({ productId, productName }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        if (productId) {
            fetch(`${API_URL}/api/shop/reviews/${productId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setReviews(data.reviews || []);
                        setStats(data.stats || null);
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [productId]);

    const renderStars = (rating: number, size = 16) => {
        return (
            <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} style={{ fontSize: `${size}px`, color: star <= rating ? '#f59e0b' : '#334155' }}>
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getInitial = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
    const maxDistribution = stats ? Math.max(...Object.values(stats.distribution), 1) : 1;

    if (loading) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <div style={{
                    width: '32px', height: '32px', border: '3px solid rgba(124,58,237,0.2)',
                    borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                    margin: '0 auto'
                }} />
            </div>
        );
    }

    return (
        <>
            <section style={{ padding: '60px 24px', maxWidth: '1400px', margin: '0 auto' }} id="reviews-section">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 style={{
                        fontSize: 'clamp(1.3rem, 3vw, 2rem)', fontWeight: 800, color: '#f1f5f9',
                        marginBottom: '8px', letterSpacing: '-0.02em',
                        fontFamily: 'Space Grotesk, Inter, sans-serif'
                    }}>
                        Ratings & Reviews
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '32px' }}>
                        What customers say about {productName}
                    </p>
                </motion.div>

                {/* Stats Overview */}
                {stats && stats.totalReviews > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        style={{
                            display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px',
                            background: 'rgba(10, 10, 32, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)',
                            borderRadius: '20px', padding: '32px', marginBottom: '32px',
                            alignItems: 'center'
                        }}
                        className="review-stats-grid"
                    >
                        {/* Average Rating */}
                        <div style={{ textAlign: 'center', minWidth: '140px' }}>
                            <div style={{
                                fontSize: '3.5rem', fontWeight: 800, lineHeight: 1,
                                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text', marginBottom: '8px'
                            }}>
                                {stats.avgRating}
                            </div>
                            <div style={{ marginBottom: '6px' }}>
                                {renderStars(Math.round(stats.avgRating), 18)}
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
                                {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                            </p>
                        </div>

                        {/* Rating Distribution */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[5, 4, 3, 2, 1].map(star => {
                                const count = stats.distribution[star] || 0;
                                const pct = (count / maxDistribution) * 100;
                                return (
                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{
                                            color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600,
                                            minWidth: '18px', textAlign: 'right'
                                        }}>
                                            {star}
                                        </span>
                                        <span style={{ color: '#f59e0b', fontSize: '12px' }}>★</span>
                                        <div style={{
                                            flex: 1, height: '8px', borderRadius: '4px',
                                            background: 'rgba(148, 163, 184, 0.08)', overflow: 'hidden'
                                        }}>
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${pct}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.6, delay: (5 - star) * 0.1 }}
                                                style={{
                                                    height: '100%', borderRadius: '4px',
                                                    background: star >= 4
                                                        ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                        : star === 3
                                                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                            : 'linear-gradient(90deg, #ef4444, #f87171)'
                                                }}
                                            />
                                        </div>
                                        <span style={{
                                            color: '#64748b', fontSize: '0.75rem', fontWeight: 500,
                                            minWidth: '24px'
                                        }}>
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                            textAlign: 'center', padding: '60px 20px', marginBottom: '32px',
                            background: 'rgba(10, 10, 32, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)',
                            borderRadius: '20px'
                        }}
                    >
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>📝</span>
                        <h3 style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                            No reviews yet
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                            Be the first to share your experience with this product! You can leave a review after your order is delivered.
                        </p>
                    </motion.div>
                )}

                {/* Review Cards */}
                {reviews.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <AnimatePresence>
                            {displayedReviews.map((review, i) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    style={{
                                        background: 'rgba(10, 10, 32, 0.4)',
                                        border: '1px solid rgba(148, 163, 184, 0.08)',
                                        borderRadius: '18px', padding: '24px', transition: 'border-color 0.3s'
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.2)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(148,163,184,0.08)'}
                                >
                                    {/* Review Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                        {/* Avatar */}
                                        <div style={{
                                            width: '42px', height: '42px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                                            overflow: 'hidden'
                                        }}>
                                            {review.profilePic ? (
                                                <img src={review.profilePic} alt="" style={{
                                                    width: '100%', height: '100%', objectFit: 'cover'
                                                }} />
                                            ) : getInitial(review.username)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    color: '#e2e8f0', fontWeight: 600, fontSize: '0.92rem'
                                                }}>
                                                    {review.username}
                                                </span>
                                                {review.verified && (
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: 700, color: '#10b981',
                                                        background: 'rgba(16,185,129,0.1)',
                                                        border: '1px solid rgba(16,185,129,0.2)',
                                                        padding: '2px 8px', borderRadius: '12px',
                                                        textTransform: 'uppercase', letterSpacing: '0.03em'
                                                    }}>
                                                        ✓ Verified Purchase
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                                {renderStars(review.rating, 14)}
                                                <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                                                    {formatDate(review.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Review Title */}
                                    {review.title && (
                                        <h4 style={{
                                            color: '#f1f5f9', fontWeight: 700, fontSize: '1rem',
                                            margin: '0 0 8px', lineHeight: 1.4
                                        }}>
                                            {review.title}
                                        </h4>
                                    )}

                                    {/* Review Text */}
                                    {review.review && (
                                        <p style={{
                                            color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.7,
                                            margin: '0 0 16px', wordBreak: 'break-word'
                                        }}>
                                            {review.review}
                                        </p>
                                    )}

                                    {/* Review Photos */}
                                    {review.photos && review.photos.length > 0 && (
                                        <div style={{
                                            display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px'
                                        }}>
                                            {review.photos.map((photo, pi) => (
                                                <motion.div
                                                    key={pi}
                                                    whileHover={{ scale: 1.05 }}
                                                    onClick={() => setViewerUrl(photo.url)}
                                                    style={{
                                                        width: '80px', height: '80px', borderRadius: '12px',
                                                        overflow: 'hidden', cursor: 'zoom-in',
                                                        border: '1px solid rgba(148,163,184,0.1)',
                                                        background: '#0f0f2a'
                                                    }}
                                                >
                                                    <img
                                                        src={photo.url} alt={`Review photo ${pi + 1}`}
                                                        style={{
                                                            width: '100%', height: '100%', objectFit: 'cover'
                                                        }}
                                                    />
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Show More Button */}
                        {reviews.length > 3 && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowAll(!showAll)}
                                style={{
                                    padding: '14px 32px', borderRadius: '14px',
                                    background: 'rgba(124,58,237,0.08)',
                                    border: '1px solid rgba(124,58,237,0.2)',
                                    color: '#a855f7', fontWeight: 600, fontSize: '0.9rem',
                                    cursor: 'pointer', transition: 'all 0.2s', margin: '8px auto 0',
                                    display: 'block'
                                }}
                            >
                                {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                            </motion.button>
                        )}
                    </div>
                )}
            </section>

            {/* Photo Viewer Overlay */}
            <AnimatePresence>
                {viewerUrl && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setViewerUrl(null)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(0,0,0,0.9)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'zoom-out', padding: '20px'
                        }}
                    >
                        <motion.img
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            src={viewerUrl} alt="Review photo"
                            style={{
                                maxWidth: '90vw', maxHeight: '90vh',
                                borderRadius: '12px', objectFit: 'contain'
                            }}
                        />
                        <button onClick={() => setViewerUrl(null)} style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff', borderRadius: '12px', width: '44px', height: '44px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px', backdropFilter: 'blur(10px)'
                        }}>✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Responsive CSS */}
            <style>{`
                @media (max-width: 640px) {
                    .review-stats-grid {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                }
            `}</style>
        </>
    );
};

export default ReviewSection;
