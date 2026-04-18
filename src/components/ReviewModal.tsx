/* eslint-disable */
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'https://vibexpert-backend-main.onrender.com';

interface OrderItem {
    name: string;
    price: string;
    quantity: number;
    image: string;
    productId?: string;
    id?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    items: OrderItem[];
    onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<Props> = ({ isOpen, onClose, orderId, items, onReviewSubmitted }) => {
    const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [review, setReview] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check which items have already been reviewed
    React.useEffect(() => {
        if (isOpen && items.length > 0) {
            const token = localStorage.getItem('shop_auth_token');
            if (!token) return;
            const checked = new Set<string>();
            Promise.all(
                items.map(async (item) => {
                    const pid = item.productId || item.id;
                    if (!pid) return;
                    try {
                        const res = await fetch(`${API_URL}/api/shop/reviews/check/${orderId}/${pid}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.hasReviewed) checked.add(pid);
                    } catch { }
                })
            ).then(() => setReviewedItems(checked));
        }
    }, [isOpen, orderId, items]);

    const resetForm = () => {
        setRating(0);
        setHoverRating(0);
        setTitle('');
        setReview('');
        setPhotos([]);
        setPhotoPreviews([]);
        setError(null);
        setSuccess(false);
    };

    const handleSelectItem = (item: OrderItem) => {
        const pid = item.productId || item.id;
        if (pid && reviewedItems.has(pid)) return;
        setSelectedItem(item);
        resetForm();
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (photos.length + files.length > 3) {
            setError('You can upload up to 3 photos');
            return;
        }
        const validFiles = files.filter(f => {
            if (f.size > 10 * 1024 * 1024) return false;
            if (!f.type.startsWith('image/')) return false;
            return true;
        });
        const newPhotos = [...photos, ...validFiles].slice(0, 3);
        setPhotos(newPhotos);
        // Generate previews
        const newPreviews = [...photoPreviews];
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result as string);
                setPhotoPreviews([...newPreviews]);
            };
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
        setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!selectedItem || rating === 0) {
            setError('Please select a rating');
            return;
        }
        const pid = selectedItem.productId || selectedItem.id;
        if (!pid) {
            setError('Product information is missing');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const token = localStorage.getItem('shop_auth_token');
            if (!token) throw new Error('Please log in to submit a review');

            const formData = new FormData();
            formData.append('productId', pid);
            formData.append('orderId', orderId);
            formData.append('rating', String(rating));
            formData.append('title', title);
            formData.append('review', review);
            photos.forEach(photo => formData.append('photos', photo));

            const res = await fetch(`${API_URL}/api/shop/reviews`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit review');

            setSuccess(true);
            setReviewedItems(prev => new Set(prev).add(pid));
            onReviewSubmitted();

            // Auto close after showing success
            setTimeout(() => {
                setSelectedItem(null);
                resetForm();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

    if (!isOpen) return null;

    const unreviewedItems = items.filter(item => {
        const pid = item.productId || item.id;
        return pid && !reviewedItems.has(pid);
    });
    const allReviewed = unreviewedItems.length === 0 && items.length > 0;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                    padding: '16px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: '560px', maxHeight: '90vh',
                        background: 'linear-gradient(145deg, #0f0f1e, #131325)',
                        border: '1px solid rgba(148,163,184,0.1)',
                        borderRadius: '24px', display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px 24px 16px', borderBottom: '1px solid rgba(148,163,184,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div>
                            <h2 style={{
                                color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 800, margin: 0,
                                letterSpacing: '-0.02em',
                                fontFamily: 'Space Grotesk, Inter, sans-serif'
                            }}>
                                ✍️ Write a Review
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>
                                Share your experience with these products
                            </p>
                        </div>
                        <button onClick={onClose} style={{
                            background: 'rgba(148,163,184,0.1)', border: 'none', borderRadius: '10px',
                            padding: '8px', cursor: 'pointer', color: '#94a3b8',
                            display: 'flex', alignItems: 'center'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                        {!selectedItem ? (
                            /* Item Selection */
                            <div>
                                {allReviewed ? (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🎉</span>
                                        <h3 style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
                                            All Items Reviewed!
                                        </h3>
                                        <p style={{ color: '#64748b', fontSize: '0.88rem' }}>
                                            Thank you for sharing your feedback on all products.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>
                                            Select a product to review:
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {items.map((item, idx) => {
                                                const pid = item.productId || item.id;
                                                const isReviewed = pid ? reviewedItems.has(pid) : false;
                                                return (
                                                    <motion.div
                                                        key={idx}
                                                        whileHover={!isReviewed ? { scale: 1.01 } : {}}
                                                        onClick={() => handleSelectItem(item)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '14px',
                                                            padding: '14px', borderRadius: '14px',
                                                            background: isReviewed ? 'rgba(16,185,129,0.04)' : 'rgba(148,163,184,0.04)',
                                                            border: `1px solid ${isReviewed ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.08)'}`,
                                                            cursor: isReviewed ? 'default' : 'pointer',
                                                            opacity: isReviewed ? 0.6 : 1,
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '50px', height: '50px', borderRadius: '10px',
                                                            overflow: 'hidden', flexShrink: 0, background: '#0f0f2a'
                                                        }}>
                                                            {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={{
                                                                color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem',
                                                                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}>{item.name}</p>
                                                            <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '3px 0 0' }}>
                                                                Qty: {item.quantity}
                                                            </p>
                                                        </div>
                                                        {isReviewed ? (
                                                            <span style={{
                                                                color: '#10b981', fontSize: '0.7rem', fontWeight: 700,
                                                                background: 'rgba(16,185,129,0.1)', padding: '4px 10px',
                                                                borderRadius: '20px', flexShrink: 0
                                                            }}>✓ Reviewed</span>
                                                        ) : (
                                                            <span style={{
                                                                color: '#a855f7', fontSize: '0.75rem', fontWeight: 600,
                                                                flexShrink: 0
                                                            }}>Rate →</span>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : success ? (
                            /* Success State */
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ textAlign: 'center', padding: '40px 20px' }}
                            >
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 10 }}
                                    style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}
                                >🎉</motion.span>
                                <h3 style={{ color: '#10b981', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                                    Review Submitted!
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                                    Thank you for sharing your feedback.
                                </p>
                            </motion.div>
                        ) : (
                            /* Review Form */
                            <div>
                                {/* Back button */}
                                {items.length > 1 && (
                                    <button
                                        onClick={() => { setSelectedItem(null); resetForm(); }}
                                        style={{
                                            background: 'none', border: 'none', color: '#a855f7',
                                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                                            padding: '0 0 12px', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        ← Back to products
                                    </button>
                                )}

                                {/* Product being reviewed */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px', borderRadius: '12px', marginBottom: '24px',
                                    background: 'rgba(124,58,237,0.05)',
                                    border: '1px solid rgba(124,58,237,0.12)'
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '8px',
                                        overflow: 'hidden', flexShrink: 0
                                    }}>
                                        {selectedItem.image && <img src={selectedItem.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                    </div>
                                    <p style={{
                                        color: '#e2e8f0', fontWeight: 600, fontSize: '0.88rem', margin: 0,
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                    }}>{selectedItem.name}</p>
                                </div>

                                {/* Star Rating */}
                                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginBottom: '12px' }}>
                                        How would you rate this product?
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <motion.button
                                                key={star}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                onClick={() => setRating(star)}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontSize: '2.2rem', padding: '4px',
                                                    color: star <= (hoverRating || rating) ? '#f59e0b' : '#334155',
                                                    transition: 'color 0.15s', filter: star <= (hoverRating || rating) ? 'drop-shadow(0 0 6px rgba(245,158,11,0.4))' : 'none'
                                                }}
                                            >
                                                ★
                                            </motion.button>
                                        ))}
                                    </div>
                                    {(hoverRating || rating) > 0 && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600, margin: 0
                                            }}
                                        >
                                            {ratingLabels[hoverRating || rating]}
                                        </motion.p>
                                    )}
                                </div>

                                {/* Title */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Review Title (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. Amazing product!"
                                        maxLength={100}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                                            background: 'rgba(148,163,184,0.04)',
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
                                            transition: 'border-color 0.2s', boxSizing: 'border-box'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.3)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.1)'}
                                    />
                                </div>

                                {/* Review Text */}
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                                        Your Review (optional)
                                    </label>
                                    <textarea
                                        value={review}
                                        onChange={e => setReview(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        maxLength={1000}
                                        rows={4}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                                            background: 'rgba(148,163,184,0.04)',
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
                                            resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                                            transition: 'border-color 0.2s', boxSizing: 'border-box'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'rgba(124,58,237,0.3)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(148,163,184,0.1)'}
                                    />
                                    <p style={{ color: '#475569', fontSize: '0.7rem', textAlign: 'right', margin: '4px 0 0' }}>
                                        {review.length}/1000
                                    </p>
                                </div>

                                {/* Photo Upload */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                                        Add Photos (optional, up to 3)
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {photoPreviews.map((preview, i) => (
                                            <div key={i} style={{
                                                position: 'relative', width: '72px', height: '72px',
                                                borderRadius: '12px', overflow: 'hidden',
                                                border: '1px solid rgba(148,163,184,0.15)'
                                            }}>
                                                <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button onClick={() => removePhoto(i)} style={{
                                                    position: 'absolute', top: '-2px', right: '-2px',
                                                    background: '#ef4444', color: '#fff', border: '2px solid #131325',
                                                    borderRadius: '50%', width: '20px', height: '20px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer', fontSize: '10px', fontWeight: 700
                                                }}>✕</button>
                                            </div>
                                        ))}
                                        {photos.length < 3 && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    width: '72px', height: '72px', borderRadius: '12px',
                                                    background: 'rgba(148,163,184,0.04)',
                                                    border: '2px dashed rgba(148,163,184,0.15)',
                                                    cursor: 'pointer', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                                                    color: '#64748b', transition: 'all 0.2s'
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Add</span>
                                            </motion.button>
                                        )}
                                    </div>
                                    <input
                                        type="file" accept="image/*" multiple
                                        ref={fileInputRef} onChange={handlePhotoSelect}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {/* Error */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: '10px 14px', borderRadius: '10px',
                                            background: 'rgba(239,68,68,0.1)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            color: '#f87171', fontSize: '0.82rem', fontWeight: 500,
                                            marginBottom: '16px'
                                        }}
                                    >
                                        ⚠️ {error}
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <motion.button
                                    whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(124,58,237,0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubmit}
                                    disabled={submitting || rating === 0}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                                        background: rating > 0
                                            ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
                                            : 'rgba(148,163,184,0.1)',
                                        color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                                        cursor: rating > 0 ? 'pointer' : 'not-allowed',
                                        opacity: submitting ? 0.6 : 1, transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {submitting ? (
                                        <>
                                            <div style={{
                                                width: '18px', height: '18px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTopColor: '#fff', borderRadius: '50%',
                                                animation: 'spin 0.8s linear infinite'
                                            }} />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>📤 Submit Review</>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </AnimatePresence>
    );
};

export default ReviewModal;
