import React from 'react';
import HeroLanding from '../components/Hero';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
    const [featured, setFeatured] = React.useState<any[]>([]);

    React.useEffect(() => {
        fetch('https://vibexpert-backend-main.onrender.com/api/shop/client-products')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.products) {
                    const mapped = data.products
                        .slice(0, 8)
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
                    setFeatured(mapped);
                }
            })
            .catch(console.error);
    }, []);

    return (
        <div>
            <HeroLanding />
            
            {featured.length > 0 && (
                <section style={{ padding: '80px 24px', maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', color: '#f1f5f9', fontWeight: 800, marginBottom: '12px' }}>
                            New Arrivals
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                            Discover our latest drops from sellers across the platform
                        </p>
                    </div>
                    <div className="grid-responsive">
                        {featured.map((p, i) => (
                            <ProductCard key={p.id} product={p} index={i} />
                        ))}
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};

export default HomePage;
