import React from 'react';
import { motion } from 'framer-motion';
import { Product } from '../types';
import { useStore } from '../store';
import { Link } from 'react-router-dom';

interface ProductCardProps {
    product: Product;
    index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
    const discount = Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
    );

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                style={{
                    color: i < Math.floor(rating) ? '#f59e0b' : '#334155',
                    fontSize: '0.75rem',
                }}
            >
                ★
            </span>
        ));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3) }}
            className="product-card"
            style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                position: 'relative',
                height: '100%',
            }}
        >
            {/* Image Section */}
            <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                <div
                    style={{
                        position: 'relative',
                        paddingTop: '100%',
                        overflow: 'hidden',
                        background: '#0e0e24',
                    }}
                >
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                        }}
                    />

                    {/* Badge */}
                    {product.badge && (
                        <span
                            className={`badge badge-${product.badge}`}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                left: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                fontSize: '0.7rem',
                            }}
                        >
                            {product.badge === 'sale' ? `${discount}% OFF` : product.badge}
                        </span>
                    )}
                </div>
            </Link>

            {/* Wishlist Button */}
            <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product);
                }}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'rgba(5, 5, 16, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    color: isInWishlist(product.id) ? '#ec4899' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    zIndex: 2,
                    transition: 'background 0.2s ease',
                }}
                id={`wishlist-${product.id}`}
            >
                {isInWishlist(product.id) ? '❤️' : '🤍'}
            </motion.button>

            {/* Info Section — flex-grow to push button down */}
            <div
                style={{
                    padding: '14px 16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                }}
            >
                <Link
                    to={`/product/${product.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}
                >
                    <p
                        style={{
                            fontSize: '0.72rem',
                            color: '#64748b',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: '5px',
                            fontWeight: 500,
                        }}
                    >
                        {product.category}
                    </p>
                    <h3
                        style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#f1f5f9',
                            marginBottom: '8px',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.7em', // Reserves space for 2 lines
                        }}
                    >
                        {product.name}
                    </h3>

                    {/* Rating */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginBottom: '10px',
                        }}
                    >
                        <div style={{ display: 'flex', gap: '1px' }}>{renderStars(product.rating)}</div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {product.rating} ({product.reviews})
                        </span>
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                            style={{
                                fontSize: '1.15rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #f1f5f9, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            ₹{product.price.toLocaleString()}
                        </span>
                        <span
                            style={{
                                fontSize: '0.82rem',
                                color: '#475569',
                                textDecoration: 'line-through',
                            }}
                        >
                            ₹{product.originalPrice.toLocaleString()}
                        </span>
                        {discount > 0 && (
                            <span
                                style={{
                                    fontSize: '0.72rem',
                                    color: '#10b981',
                                    fontWeight: 600,
                                }}
                            >
                                {discount}% off
                            </span>
                        )}
                    </div>
                </Link>

                {/* Add to Cart */}
                <motion.button
                    whileHover={{
                        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    style={{
                        width: '100%',
                        marginTop: '14px',
                        padding: '10px',
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
                    }}
                    id={`add-to-cart-${product.id}`}
                >
                    🛒 Add to Cart
                </motion.button>
            </div>
        </motion.div>
    );
};

export default ProductCard;
