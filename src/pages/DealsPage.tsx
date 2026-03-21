import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const DealsPage: React.FC = () => {
    const [deals, setDeals] = React.useState<any[]>([]);

    React.useEffect(() => {
        fetch('https://vibexpert-backend-main.onrender.com/api/shop/client-products')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.products) {
                    const mapped = data.products
                        .filter((p: any) => p.badge === 'sale' || (p.discountPercent > 0))
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
                            badge: p.badge || 'sale',
                            colors: p.colors || [],
                            sizes: p.sizes || [],
                            inStock: p.inStock !== false
                        }));
                    setDeals(mapped);
                }
            })
            .catch(console.error);
    }, []);

    return (
        <div style={{ paddingTop: '20px', minHeight: '100vh' }}>
            {/* Hero Banner */}
            <div
                style={{
                    padding: '60px 24px',
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(124, 58, 237, 0.05))',
                    borderBottom: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                }}
            >
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}
                >
                    🔥
                </motion.span>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 800,
                        color: '#f1f5f9',
                        marginBottom: '12px',
                    }}
                >
                    Today's <span style={{ color: '#f43f5e' }}>Hot Deals</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}
                >
                    Limited time offers — up to 50% off on trending products!
                </motion.p>
            </div>

            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 24px 80px' }}>
                <p style={{ color: '#64748b', marginBottom: '32px' }}>
                    {deals.length} deals available
                </p>
                <div className="grid-responsive">
                    {deals.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default DealsPage;
