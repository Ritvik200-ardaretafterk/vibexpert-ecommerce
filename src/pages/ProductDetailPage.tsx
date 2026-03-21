import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart, toggleWishlist, isInWishlist } = useStore();
    
    const [product, setProduct] = useState<any>(null);
    const [loadingLive, setLoadingLive] = useState(true);
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

    React.useEffect(() => {
        setLoadingLive(true);
        if (id) {
            fetch('https://vibexpert-backend-main.onrender.com/api/shop/client-products')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.products) {
                        const found = data.products.find((p: any) => String(p._id) === String(id) || String(p.id) === String(id));
                        if (found) {
                            const mapped = {
                                id: found._id || found.id,
                                name: found.name,
                                price: found.price,
                                originalPrice: found.originalPrice || found.price,
                                description: found.description,
                                category: found.category,
                                image: found.image || found.images?.[0]?.url || 'https://via.placeholder.com/600',
                                images: found.images?.map((img: any) => img.url) || [],
                                rating: found.rating || 5.0,
                                reviews: found.reviews || 0,
                                badge: found.badge || null,
                                colors: found.colors || [],
                                sizes: found.sizes || [],
                                inStock: found.inStock !== false
                            };
                            setProduct(mapped);
                            // Set related products from same category
                            const related = data.products
                                .filter((p: any) => p.category === found.category && String(p._id || p.id) !== String(id))
                                .slice(0, 4)
                                .map((p: any) => ({
                                    id: p._id || p.id,
                                    name: p.name,
                                    price: p.price,
                                    originalPrice: p.originalPrice || p.price,
                                    description: p.description,
                                    category: p.category,
                                    image: p.image || p.images?.[0]?.url || 'https://via.placeholder.com/600',
                                    images: p.images?.map((img: any) => img.url) || [],
                                    rating: p.rating || 5.0,
                                    reviews: p.reviews || 0,
                                    badge: p.badge || null,
                                    colors: p.colors || [],
                                    sizes: p.sizes || [],
                                    inStock: p.inStock !== false
                                }));
                            setRelatedProducts(related);
                        }
                    }
                })
                .finally(() => setLoadingLive(false));
        } else {
            setLoadingLive(false);
        }
    }, [id]);

    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState(1);

    React.useEffect(() => {
        if (product) {
            if (product.colors?.length) setSelectedColor(product.colors[0]);
            if (product.sizes?.length) setSelectedSize(product.sizes[0]);
        }
    }, [product]);

    if (loadingLive) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#94a3b8' }}>Loading product details...</p>
        </div>;
    }

    if (!product && !loadingLive) {
        return (
            <div style={{ paddingTop: '120px', textAlign: 'center', minHeight: '80vh' }}>
                <span style={{ fontSize: '5rem', display: 'block', marginBottom: '16px' }}>😢</span>
                <h1 style={{ color: '#f1f5f9', fontSize: '2rem', marginBottom: '12px' }}>Product Not Found</h1>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>The product you're looking for doesn't exist.</p>
                <Link
                    to="/shop"
                    className="btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                    Back to Shop
                </Link>
            </div>
        );
    }

    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ color: i < Math.floor(rating) ? '#f59e0b' : '#334155', fontSize: '1.2rem' }}>★</span>
        ));
    };

    return (
        <div style={{ paddingTop: '20px', minHeight: '100vh' }}>
            {/* Breadcrumbs */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px 24px' }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                    <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
                    <span>/</span>
                    <Link to="/shop" style={{ color: '#64748b', textDecoration: 'none' }}>Shop</Link>
                    <span>/</span>
                    <Link
                        to={`/shop?category=${product.category}`}
                        style={{ color: '#64748b', textDecoration: 'none', textTransform: 'capitalize' }}
                    >
                        {product.category}
                    </Link>
                    <span>/</span>
                    <span style={{ color: '#a855f7' }}>{product.name}</span>
                </div>
            </div>

            {/* Product Section */}
            <div
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '20px 24px 80px',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '48px',
                }}
                className="product-detail-grid"
            >
                {/* Image */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        borderRadius: '24px',
                        overflow: 'hidden',
                        background: '#141428',
                        aspectRatio: '1',
                        maxHeight: '500px',
                    }}
                >
                    <img
                        src={product.image}
                        alt={product.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                </motion.div>

                {/* Details */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    {/* Badge */}
                    {product.badge && (
                        <span className={`badge badge-${product.badge}`} style={{ marginBottom: '12px', display: 'inline-block', textTransform: 'uppercase' }}>
                            {product.badge === 'sale' ? `${discount}% OFF` : product.badge}
                        </span>
                    )}

                    <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: 800, color: '#f1f5f9', marginBottom: '12px', lineHeight: 1.2 }}>
                        {product.name}
                    </h1>

                    {/* Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div>{renderStars(product.rating)}</div>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{product.rating}</span>
                        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>({product.reviews} reviews)</span>
                    </div>

                    {/* Price */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '24px' }}>
                        <span
                            style={{
                                fontSize: '2.2rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #f1f5f9, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            ₹{product.price.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '1.2rem', color: '#475569', textDecoration: 'line-through' }}>
                            ₹{product.originalPrice.toLocaleString()}
                        </span>
                        {discount > 0 && (
                            <span
                                style={{
                                    padding: '4px 12px',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    borderRadius: '8px',
                                    color: '#10b981',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                }}
                            >
                                Save ₹{(product.originalPrice - product.price).toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p style={{ color: '#94a3b8', lineHeight: 1.7, marginBottom: '28px', fontSize: '1rem' }}>
                        {product.description}
                    </p>

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>
                                Color: <span style={{ color: '#a855f7' }}>{selectedColor || 'Select'}</span>
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {product.colors.map((color: string) => (
                                    <motion.button
                                        key={color}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            padding: '8px 18px',
                                            borderRadius: '10px',
                                            background: selectedColor === color ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-card)',
                                            border: `1px solid ${selectedColor === color ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                            color: selectedColor === color ? '#a855f7' : '#94a3b8',
                                            cursor: 'pointer',
                                            fontWeight: 500,
                                            fontSize: '0.85rem',
                                        }}
                                    >
                                        {color}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>
                                Size: <span style={{ color: '#a855f7' }}>{selectedSize || 'Select'}</span>
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {product.sizes.map((size: string) => (
                                    <motion.button
                                        key={size}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setSelectedSize(size)}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '10px',
                                            background: selectedSize === size ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-card)',
                                            border: `1px solid ${selectedSize === size ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                            color: selectedSize === size ? '#a855f7' : '#94a3b8',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {size}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div style={{ marginBottom: '28px' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '10px' }}>Quantity</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    color: '#f1f5f9',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                −
                            </motion.button>
                            <span
                                style={{
                                    width: '50px',
                                    textAlign: 'center',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: '#f1f5f9',
                                }}
                            >
                                {quantity}
                            </span>
                            <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => setQuantity(quantity + 1)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    color: '#f1f5f9',
                                    cursor: 'pointer',
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                +
                            </motion.button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(product, quantity, selectedColor, selectedSize)}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '16px 32px',
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '14px',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                            id="product-add-to-cart"
                        >
                            🛒 Add to Cart
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleWishlist(product)}
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '14px',
                                background: isInWishlist(product.id) ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-card)',
                                border: `1px solid ${isInWishlist(product.id) ? 'rgba(236, 72, 153, 0.3)' : 'var(--border-subtle)'}`,
                                color: isInWishlist(product.id) ? '#ec4899' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            id="product-wishlist"
                        >
                            {isInWishlist(product.id) ? '❤️' : '🤍'}
                        </motion.button>
                    </div>

                    {/* Info badges */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '12px',
                            marginTop: '32px',
                        }}
                    >
                        {[
                            { icon: '🚚', label: 'Free Shipping', sub: 'Orders over ₹999' },
                            { icon: '↩️', label: 'Easy Returns', sub: '7-day return policy' },
                            { icon: '🔒', label: 'Secure Payment', sub: '100% protected' },
                            { icon: '🎁', label: 'Gift Wrap', sub: 'Available at checkout' },
                        ].map(info => (
                            <div
                                key={info.label}
                                style={{
                                    padding: '14px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    textAlign: 'center',
                                }}
                            >
                                <span style={{ fontSize: '1.3rem', display: 'block', marginBottom: '6px' }}>{info.icon}</span>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '2px' }}>{info.label}</p>
                                <p style={{ fontSize: '0.7rem', color: '#64748b' }}>{info.sub}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section style={{ padding: '40px 24px 80px', maxWidth: '1400px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '32px' }}>
                        You might also like
                    </h2>
                    <div className="grid-responsive">
                        {relatedProducts.map((p, i) => (
                            <ProductCard key={p.id} product={p} index={i} />
                        ))}
                    </div>
                </section>
            )}

            <Footer />

            {/* Responsive Styles */}
            <style>{`
        .product-detail-grid {
          grid-template-columns: 1fr 1fr !important;
        }
        @media (max-width: 768px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
};

export default ProductDetailPage;
