import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../AuthContext';

interface OrderItem {
    name: string;
    price: string;
    quantity: number;
    image: string;
}

interface Order {
    id: string;
    order_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: string; // JSON string of OrderItem[]
}

const OrdersPage: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);

        if (isAuthenticated) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('shop_auth_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('https://vibexpert-backend-main.onrender.com/api/shop/orders', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</span>
                <h2 style={{ color: '#f1f5f9', fontWeight: 800 }}>Please Login</h2>
                <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6 }}>You need to be logged in via vibexpert.online to view your order history.</p>
                <a
                    href="https://www.vibexpert.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '12px',
                        fontWeight: 700
                    }}
                >
                    Login to view Orders
                </a>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(124,58,237,0.2)',
                    borderTopColor: '#a855f7',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px', minHeight: '80vh' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                        My Orders
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
                        Track and manage your VibeShop purchases.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div style={{
                        background: 'rgba(30,30,40,0.4)',
                        border: '1px dashed rgba(148,163,184,0.2)',
                        borderRadius: '24px',
                        padding: '60px 24px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '4rem', marginBottom: '16px' }}>📦</span>
                        <h3 style={{ color: '#f1f5f9', fontSize: '1.5rem', margin: '0 0 8px' }}>No orders yet</h3>
                        <p style={{ color: '#94a3b8' }}>Looks like you haven't made any purchases.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {orders.map((order, i) => {
                            let parsedItems: OrderItem[] = [];
                            try { parsedItems = JSON.parse(order.items); } catch (e) { }

                            const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            });

                            const statusColors: any = {
                                'paid': '#10b981',
                                'created': '#fbbf24',
                                'failed': '#ef4444',
                                'shipped': '#60a5fa',
                                'delivered': '#10b981'
                            };

                            const statusColor = statusColors[order.status] || '#94a3b8';

                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    style={{
                                        background: 'rgba(5, 5, 16, 0.4)',
                                        border: '1px solid rgba(148, 163, 184, 0.1)',
                                        borderRadius: '20px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Order Header */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                                        padding: '16px 24px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                Order <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>#{order.order_id.substring(order.order_id.length - 12)}</span>
                                            </div>
                                            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '1.05rem' }}>
                                                {orderDate}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 800 }}>
                                                ₹{order.total_amount.toLocaleString()}
                                            </div>
                                            <div style={{
                                                color: statusColor,
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                marginTop: '4px'
                                            }}>
                                                • {order.status}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div style={{ padding: '20px 24px' }}>
                                        {parsedItems.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '12px 0',
                                                borderBottom: idx !== parsedItems.length - 1 ? '1px dashed rgba(148,163,184,0.1)' : 'none'
                                            }}>
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '12px',
                                                    background: '#1a1a2e',
                                                    overflow: 'hidden',
                                                    flexShrink: 0
                                                }}>
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{item.name}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Qty: {item.quantity} × ₹{parseInt(item.price).toLocaleString()}</div>
                                                </div>
                                                <div style={{ color: '#e2e8f0', fontWeight: 700 }}>
                                                    ₹{(parseInt(item.price) * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default OrdersPage;
