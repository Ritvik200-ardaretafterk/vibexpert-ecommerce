import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { categories } from '../data';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const ShopPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category') || '';

    const [selectedCategory, setSelectedCategory] = useState(categoryParam);
    const [sortBy, setSortBy] = useState('popular');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [liveProducts, setLiveProducts] = useState<any[]>([]);

    React.useEffect(() => {
        fetch('https://vibexpert-backend-main.onrender.com/api/shop/client-products')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.products) {
                    const newProducts = data.products.map((p: any) => ({
                        id: p.id || p._id,
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
                        inStock: p.inStock !== false
                    }));
                    setLiveProducts(newProducts);
                }
            })
            .catch(console.error);
    }, []);

    const filteredProducts = useMemo(() => {
        let result = [...liveProducts];

        // Category filter
        if (selectedCategory) {
            result = result.filter(p => p.category === selectedCategory);
        }

        // Price filter
        result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        // Sort
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                result.sort((a, b) => (b.badge === 'new' ? 1 : 0) - (a.badge === 'new' ? 1 : 0));
                break;
            default:
                result.sort((a, b) => b.reviews - a.reviews);
        }

        return result;
    }, [selectedCategory, sortBy, priceRange, liveProducts]);

    return (
        <div style={{ paddingTop: '20px', minHeight: '100vh' }}>
            {/* Page Header */}
            <div style={{ padding: '40px 24px 20px', maxWidth: '1400px', margin: '0 auto' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 800,
                        color: '#f1f5f9',
                        marginBottom: '8px',
                    }}
                >
                    {selectedCategory
                        ? `${categories.find(c => c.id === selectedCategory)?.icon || ''} ${categories.find(c => c.id === selectedCategory)?.name || 'Shop'}`
                        : 'All Products'}
                </motion.h1>
                <p style={{ color: '#64748b', fontSize: '1rem' }}>
                    {filteredProducts.length} products found
                </p>
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 80px' }}>
                {/* Filters Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '32px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    {/* Category Pills */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory('')}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '50px',
                            border: `1px solid ${!selectedCategory ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            background: !selectedCategory ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                            color: !selectedCategory ? '#a855f7' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                        }}
                    >
                        All
                    </motion.button>
                    {categories.map(cat => (
                        <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCategory(cat.id === selectedCategory ? '' : cat.id)}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '50px',
                                border: `1px solid ${selectedCategory === cat.id ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                                background: selectedCategory === cat.id ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                color: selectedCategory === cat.id ? '#a855f7' : '#94a3b8',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                            }}
                        >
                            {cat.icon} {cat.name}
                        </motion.button>
                    ))}

                    {/* Spacer */}
                    <div style={{ flex: 1 }} />

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            color: '#f1f5f9',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                        id="sort-select"
                    >
                        <option value="popular">Most Popular</option>
                        <option value="newest">Newest First</option>
                        <option value="price-low">Price: Low → High</option>
                        <option value="price-high">Price: High → Low</option>
                        <option value="rating">Highest Rated</option>
                    </select>

                    {/* Filter Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            background: isFilterOpen ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-card)',
                            border: `1px solid ${isFilterOpen ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            color: isFilterOpen ? '#a855f7' : '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        ⚙️ Filters
                    </motion.button>
                </motion.div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '32px',
                            border: '1px solid var(--border-subtle)',
                        }}
                    >
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '16px' }}>
                            Price Range
                        </h3>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="range"
                                min="0"
                                max="10000"
                                step="100"
                                value={priceRange[1]}
                                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                                style={{ flex: 1, minWidth: '200px', accentColor: '#a855f7' }}
                            />
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                ₹0 — ₹{priceRange[1].toLocaleString()}
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Products Grid */}
                {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                        <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🔍</span>
                        <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: '8px' }}>No products found</h2>
                        <p style={{ color: '#64748b' }}>Try adjusting your filters or search terms</p>
                    </div>
                ) : (
                    <div className="grid-responsive">
                        {filteredProducts.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default ShopPage;
