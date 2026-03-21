import React from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { searchProducts } from '../data';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = React.useState<any[]>(searchProducts(query));

    React.useEffect(() => {
        fetch('https://vibexpert-backend-main.onrender.com/api/shop/client-products')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.products) {
                    const newProducts = data.products
                        .filter((p: any) => 
                            p.name?.toLowerCase().includes(query) || 
                            p.description?.toLowerCase().includes(query) || 
                            p.category?.toLowerCase().includes(query)
                        )
                        .map((p: any) => ({
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
                            sizes: p.sizes || [],
                            inStock: p.inStock !== false
                        }));
                    
                    setResults([...searchProducts(query), ...newProducts]);
                }
            })
            .catch(console.error);
    }, [query]);

    return (
        <div style={{ paddingTop: '20px', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px 80px' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        fontWeight: 800,
                        color: '#f1f5f9',
                        marginBottom: '8px',
                    }}
                >
                    Search results for "<span className="gradient-text">{query}</span>"
                </motion.h1>
                <p style={{ color: '#64748b', marginBottom: '40px' }}>
                    {results.length} {results.length === 1 ? 'product' : 'products'} found
                </p>

                {results.length === 0 ? (
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
                        <span style={{ fontSize: '5rem', display: 'block', marginBottom: '16px' }}>🔍</span>
                        <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', marginBottom: '12px' }}>
                            No results found
                        </h2>
                        <p style={{ color: '#64748b' }}>
                            Try different keywords or browse our categories
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid-responsive">
                        {results.map((product, index) => (
                            <ProductCard key={product.id} product={product} index={index} />
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default SearchPage;
