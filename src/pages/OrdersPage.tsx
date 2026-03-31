import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

const API_URL = 'https://vibexpert-backend-main.onrender.com';

interface OrderItem {
    name: string;
    price: string;
    quantity: number;
    image: string;
    selectedColor?: string;
    selectedSize?: string;
}

interface TrackingInfo {
    trackingId?: string;
    trackingUrl?: string;
    carrier?: string;
    estimatedDelivery?: string;
    currentPosition?: string;
    updatedAt?: string;
}

interface Order {
    id: string;
    order_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: string;
    shipping_address?: string;
    tracking_info?: string;
}

interface ChatMessage {
    _id: string;
    orderId: string;
    senderId: string;
    senderRole: 'admin' | 'user' | 'client';
    message: string;
    mediaUrl?: string;
    mediaType?: string;
    createdAt: string;
}

const OrdersPage: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [chatOrder, setChatOrder] = useState<Order | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevMsgCountRef = useRef(0);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (isAuthenticated) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Auto-poll messages when chat is open
    useEffect(() => {
        if (chatOrder) {
            chatPollRef.current = setInterval(() => {
                fetchMessages(chatOrder.order_id, true);
            }, 4000);
        }
        return () => {
            if (chatPollRef.current) clearInterval(chatPollRef.current);
        };
    }, [chatOrder]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('shop_auth_token');
            if (!token) { setLoading(false); return; }
            const response = await fetch(`${API_URL}/api/shop/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

    const fetchMessages = async (orderId: string, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const token = localStorage.getItem('shop_auth_token');
            const response = await fetch(`${API_URL}/api/orders/${orderId}/messages`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const newMessages = data.messages || [];
                setMessages(newMessages);
                // Auto-scroll when new messages arrive during polling
                if (silent && newMessages.length > prevMsgCountRef.current) {
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
                prevMsgCountRef.current = newMessages.length;
                if (!silent) {
                    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            }
        } catch (err) {
            if (!silent) console.error('Messages fetch error:', err);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const openChat = (order: Order) => {
        setChatOrder(order);
        setMessages([]);
        removeImage();
        setNewMessage('');
        prevMsgCountRef.current = 0;
        fetchMessages(order.order_id);
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !chatOrder) return;
        setSendingMessage(true);
        try {
            const token = localStorage.getItem('shop_auth_token');
            const formData = new FormData();
            formData.append('orderId', chatOrder.order_id);
            formData.append('senderId', user?.id || '');
            formData.append('senderRole', 'user');
            if (newMessage.trim()) formData.append('message', newMessage.trim());
            if (selectedImage) formData.append('image', selectedImage);

            await fetch(`${API_URL}/api/orders/${chatOrder.order_id}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            setNewMessage('');
            removeImage();
            fetchMessages(chatOrder.order_id);
        } catch (err) {
            console.error('Send message error:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    const parseItems = (order: Order): OrderItem[] => {
        try { return JSON.parse(order.items); } catch { return []; }
    };

    const parseShipping = (order: Order): any => {
        try { return JSON.parse(order.shipping_address || '{}'); } catch { return {}; }
    };

    const parseTracking = (order: Order): TrackingInfo => {
        try { return JSON.parse(order.tracking_info || '{}'); } catch { return {}; }
    };

    const statusConfig: any = {
        'paid': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Paid', icon: '💳' },
        'created': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Processing', icon: '⏳' },
        'processing': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Processing', icon: '⚙️' },
        'shipped': { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Shipped', icon: '🚚' },
        'delivered': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Delivered', icon: '✅' },
        'failed': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Failed', icon: '❌' },
        'cancelled': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Cancelled', icon: '🚫' },
    };

    const getTrackingSteps = (status: string) => {
        const steps = ['created', 'paid', 'processing', 'shipped', 'delivered'];
        const current = steps.indexOf(status);
        return steps.map((step, i) => ({
            step,
            label: step.charAt(0).toUpperCase() + step.slice(1),
            done: i <= current,
            active: i === current,
        }));
    };

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</span>
                <h2 style={{ color: '#f1f5f9', fontWeight: 800 }}>Please Login</h2>
                <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6 }}>You need to be logged in via vibexpert.online to view your order history.</p>
                <a href="https://www.vibexpert.online" target="_blank" rel="noopener noreferrer"
                    style={{ marginTop: '20px', padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700 }}>
                    Login to view Orders
                </a>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px', minHeight: '80vh' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                        My Orders
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
                        Track your purchases, manage shipping, and chat with sellers.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div style={{
                        background: 'rgba(30,30,40,0.4)', border: '1px dashed rgba(148,163,184,0.2)',
                        borderRadius: '24px', padding: '60px 24px', textAlign: 'center',
                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '4rem', marginBottom: '16px' }}>📦</span>
                        <h3 style={{ color: '#f1f5f9', fontSize: '1.5rem', margin: '0 0 8px' }}>No orders yet</h3>
                        <p style={{ color: '#94a3b8' }}>Looks like you haven't made any purchases.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {orders.map((order, i) => {
                            const parsedItems = parseItems(order);
                            const shipping = parseShipping(order);
                            const tracking = parseTracking(order);
                            const isExpanded = expandedOrder === order.order_id;
                            const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                            const sc = statusConfig[order.status] || statusConfig['created'];
                            const showShipping = ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(order.status);

                            return (
                                <motion.div key={order.id || order.order_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
                                    style={{ background: 'rgba(5, 5, 16, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: '20px', overflow: 'hidden' }}>

                                    {/* Order Header - Clickable */}
                                    <div style={{
                                        background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                                        padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        flexWrap: 'wrap', gap: '12px', cursor: 'pointer'
                                    }} onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}>
                                        <div>
                                            <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                Order <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>#{order.order_id.substring(order.order_id.length - 12)}</span>
                                            </div>
                                            <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '1.05rem' }}>{orderDate}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ color: '#f1f5f9', fontSize: '1.2rem', fontWeight: 800 }}>₹{order.total_amount.toLocaleString()}</div>
                                                <div style={{
                                                    color: sc.color, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' as const,
                                                    letterSpacing: '0.05em', marginTop: '2px',
                                                    background: sc.bg, padding: '2px 10px', borderRadius: '20px', display: 'inline-block'
                                                }}>
                                                    {sc.icon} {sc.label}
                                                </div>
                                            </div>
                                            {/* Chat Icon */}
                                            {showShipping && (
                                                <button onClick={(e) => { e.stopPropagation(); openChat(order); }}
                                                    style={{
                                                        background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)',
                                                        borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                    }}
                                                    title="Chat with seller"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                    </svg>
                                                </button>
                                            )}
                                            {/* Expand Arrow */}
                                            <span style={{ color: '#94a3b8', fontSize: '1.2rem', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                        </div>
                                    </div>

                                    {/* Order Items - Always visible */}
                                    <div style={{ padding: '16px 24px' }}>
                                        {parsedItems.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0',
                                                borderBottom: idx !== parsedItems.length - 1 ? '1px dashed rgba(148,163,184,0.1)' : 'none'
                                            }}>
                                                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#1a1a2e', overflow: 'hidden', flexShrink: 0 }}>
                                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.92rem', marginBottom: '3px' }}>{item.name}</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>Qty: {item.quantity} × ₹{parseInt(item.price).toLocaleString()}</span>
                                                        {item.selectedColor && (
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.selectedColor, border: '1px solid rgba(255,255,255,0.2)' }} />
                                                            </span>
                                                        )}
                                                        {item.selectedSize && (
                                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', background: 'rgba(148,163,184,0.1)', padding: '1px 8px', borderRadius: '6px' }}>{item.selectedSize}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ color: '#e2e8f0', fontWeight: 700, flexShrink: 0 }}>
                                                    ₹{(parseInt(item.price) * item.quantity).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
                                                <div style={{ padding: '0 24px 24px', borderTop: '1px solid rgba(148,163,184,0.08)' }}>

                                                    {/* Shipping Address */}
                                                    {showShipping && Object.keys(shipping).length > 0 && (
                                                        <div style={{ marginTop: '20px', background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: '16px', padding: '20px' }}>
                                                            <h4 style={{ color: '#a855f7', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                🚚 Shipping Details
                                                            </h4>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                                                {(shipping.fullName || shipping.name) && (
                                                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '12px', padding: '12px' }}>
                                                                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '4px' }}>Name</div>
                                                                        <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>{shipping.fullName || shipping.name}</div>
                                                                    </div>
                                                                )}
                                                                {(shipping.phone || shipping.mobile) && (
                                                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '12px', padding: '12px' }}>
                                                                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '4px' }}>Phone</div>
                                                                        <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>{shipping.phone || shipping.mobile}</div>
                                                                    </div>
                                                                )}
                                                                {(shipping.email) && (
                                                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '12px', padding: '12px' }}>
                                                                        <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '4px' }}>Email</div>
                                                                        <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-all' as const }}>{shipping.email}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {(shipping.address || shipping.city) && (
                                                                <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '12px', padding: '12px' }}>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '4px' }}>📍 Delivery Address</div>
                                                                    <div style={{ color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.5 }}>
                                                                        {[shipping.address, shipping.landmark, shipping.city, shipping.state, shipping.pincode].filter(Boolean).join(', ')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Order Tracking Progress */}
                                                    {showShipping && (
                                                        <div style={{ marginTop: '20px', background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: '16px', padding: '20px' }}>
                                                            <h4 style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                📍 Order Tracking
                                                            </h4>

                                                            {/* Progress Steps */}
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', position: 'relative' }}>
                                                                {/* Progress Bar Background */}
                                                                <div style={{ position: 'absolute', top: '14px', left: '24px', right: '24px', height: '3px', background: 'rgba(148,163,184,0.15)', borderRadius: '2px', zIndex: 0 }} />
                                                                {/* Progress Bar Fill */}
                                                                <div style={{
                                                                    position: 'absolute', top: '14px', left: '24px', height: '3px',
                                                                    background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                                                                    borderRadius: '2px', zIndex: 1, transition: 'width 0.6s ease',
                                                                    width: `${Math.max(0, (getTrackingSteps(order.status).filter(s => s.done).length - 1) / 4 * 100)}%`
                                                                }} />
                                                                {getTrackingSteps(order.status).map((step, si) => (
                                                                    <div key={step.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2, flex: 1 }}>
                                                                        <div style={{
                                                                            width: '28px', height: '28px', borderRadius: '50%',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.3s',
                                                                            background: step.active ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : step.done ? '#10b981' : 'rgba(148,163,184,0.15)',
                                                                            color: step.done || step.active ? '#fff' : '#94a3b8',
                                                                            boxShadow: step.active ? '0 0 12px rgba(124,58,237,0.4)' : 'none'
                                                                        }}>
                                                                            {step.done && !step.active ? '✓' : si + 1}
                                                                        </div>
                                                                        <span style={{ color: step.active ? '#a855f7' : step.done ? '#10b981' : '#94a3b8', fontSize: '0.65rem', fontWeight: 600, marginTop: '6px', textAlign: 'center' }}>
                                                                            {step.label}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Current Position & Tracking Details */}
                                                            {(tracking.currentPosition || tracking.carrier || tracking.trackingId) && (
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                                                                    {tracking.currentPosition && (
                                                                        <div style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '12px', padding: '14px', gridColumn: tracking.carrier ? 'span 1' : '1 / -1' }}>
                                                                            <div style={{ color: '#a855f7', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: '6px' }}>📍 Current Position</div>
                                                                            <div style={{ color: '#f1f5f9', fontSize: '0.92rem', fontWeight: 600 }}>{tracking.currentPosition}</div>
                                                                        </div>
                                                                    )}
                                                                    {tracking.carrier && (
                                                                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '12px', padding: '14px' }}>
                                                                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '6px' }}>Carrier</div>
                                                                            <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>{tracking.carrier}</div>
                                                                        </div>
                                                                    )}
                                                                    {tracking.trackingId && (
                                                                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '12px', padding: '14px' }}>
                                                                            <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '6px' }}>Tracking ID</div>
                                                                            <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'monospace' }}>
                                                                                {tracking.trackingUrl ? (
                                                                                    <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{tracking.trackingId}</a>
                                                                                ) : tracking.trackingId}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {tracking.estimatedDelivery && (
                                                                        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: '12px', padding: '14px' }}>
                                                                            <div style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' as const, marginBottom: '6px' }}>Est. Delivery</div>
                                                                            <div style={{ color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>{tracking.estimatedDelivery}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {!tracking.currentPosition && !tracking.carrier && !tracking.trackingId && (
                                                                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, textAlign: 'center', fontStyle: 'italic' }}>
                                                                    Tracking details will appear here once the seller updates dispatch info.
                                                                </p>
                                                            )}

                                                            {tracking.updatedAt && (
                                                                <p style={{ color: '#64748b', fontSize: '0.72rem', margin: '12px 0 0', textAlign: 'right' }}>
                                                                    Last updated: {new Date(tracking.updatedAt).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Chat Button at Bottom */}
                                                    {showShipping && (
                                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                                            <button onClick={() => openChat(order)} style={{
                                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                                padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(124,58,237,0.25)',
                                                                background: 'rgba(124,58,237,0.1)', color: '#a855f7', fontSize: '0.85rem',
                                                                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                                                            }}>
                                                                💬 Chat with Seller
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* ═══════════════════════════════════════════════════ */}
            {/* CHAT MODAL */}
            {/* ═══════════════════════════════════════════════════ */}
            <AnimatePresence>
                {chatOrder && (() => {
                    const chatItems = parseItems(chatOrder);
                    const chatShipping = parseShipping(chatOrder);
                    const chatSc = statusConfig[chatOrder.status] || statusConfig['created'];

                    return (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 9999,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)'
                            }}
                            onClick={() => { setChatOrder(null); if (chatPollRef.current) clearInterval(chatPollRef.current); }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                style={{
                                    width: '100%', maxWidth: '600px', maxHeight: '90vh', margin: '16px',
                                    background: 'linear-gradient(145deg, #0f0f1e, #131325)', border: '1px solid rgba(148,163,184,0.1)',
                                    borderRadius: '24px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
                                }}
                            >
                                {/* Chat Header */}
                                <div style={{ padding: '20px', borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                        <div>
                                            <h3 style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                💬 Order Chat
                                            </h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace', margin: '4px 0 0' }}>
                                                {chatOrder.order_id}
                                            </p>
                                        </div>
                                        <button onClick={() => { setChatOrder(null); if (chatPollRef.current) clearInterval(chatPollRef.current); }}
                                            style={{ background: 'rgba(148,163,184,0.1)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                        </button>
                                    </div>
                                    {/* Order Summary */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', borderRadius: '14px', padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: chatSc.color, fontSize: '0.7rem', fontWeight: 700, background: chatSc.bg, padding: '2px 10px', borderRadius: '20px', textTransform: 'uppercase' as const }}>
                                                {chatSc.icon} {chatSc.label}
                                            </span>
                                            <span style={{ color: '#a855f7', fontSize: '0.8rem', fontWeight: 700 }}>₹{chatOrder.total_amount?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                            {chatItems.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(148,163,184,0.06)', borderRadius: '8px', padding: '4px 8px', flexShrink: 0 }}>
                                                    {item.image && <img src={item.image} alt="" style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />}
                                                    <span style={{ color: '#f1f5f9', fontSize: '0.7rem', fontWeight: 500, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.65rem' }}>×{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '250px', maxHeight: '400px' }}>
                                    {loadingMessages ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <div style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                                            <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</span>
                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 4px' }}>No messages yet</p>
                                            <p style={{ color: '#64748b', fontSize: '0.78rem', maxWidth: '280px', lineHeight: 1.5 }}>Start a conversation about your order — ask about delivery, product details, etc.</p>
                                            {/* Quick suggestions */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '14px' }}>
                                                {['When will my order ship?', 'Can I track my delivery?', 'Need help with this order'].map((s, si) => (
                                                    <button key={si} onClick={() => setNewMessage(s)} style={{
                                                        background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.1)',
                                                        borderRadius: '20px', padding: '5px 12px', color: '#94a3b8', fontSize: '0.72rem',
                                                        cursor: 'pointer', transition: 'all 0.2s'
                                                    }}>{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((msg, mi) => {
                                            const isMe = msg.senderRole === 'user';
                                            const isAdmin = msg.senderRole === 'admin';
                                            return (
                                                <div key={mi} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                                                    <div style={{
                                                        maxWidth: '80%', padding: '10px 14px', borderRadius: '16px',
                                                        borderBottomRightRadius: isMe ? '4px' : '16px',
                                                        borderBottomLeftRadius: isMe ? '16px' : '4px',
                                                        background: isMe ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : isAdmin ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.08)',
                                                        border: isMe ? 'none' : `1px solid ${isAdmin ? 'rgba(245,158,11,0.2)' : 'rgba(148,163,184,0.1)'}`,
                                                    }}>
                                                        {!isMe && (
                                                            <p style={{
                                                                margin: '0 0 4px', fontSize: '0.68rem', fontWeight: 700,
                                                                color: isAdmin ? '#f59e0b' : '#a855f7'
                                                            }}>
                                                                {isAdmin ? '🛡️ Admin' : '🛍️ Seller'}
                                                            </p>
                                                        )}
                                                        {msg.mediaUrl && (
                                                            <div style={{ marginBottom: msg.message && msg.message !== '📷 Photo' ? '8px' : '0', borderRadius: '8px', overflow: 'hidden' }}>
                                                                <img src={msg.mediaUrl} alt="Attached" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in', display: 'block' }} onClick={() => window.open(msg.mediaUrl, '_blank')} />
                                                            </div>
                                                        )}
                                                        {msg.message && msg.message !== '📷 Photo' && <p style={{ margin: 0, color: isMe ? '#fff' : '#f1f5f9', fontSize: '0.88rem', lineHeight: 1.5 }}>{msg.message}</p>}
                                                        <p style={{ margin: '4px 0 0', fontSize: '0.65rem', color: isMe ? 'rgba(255,255,255,0.5)' : '#64748b' }}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', padding: '16px' }}>
                                    {/* Image Preview */}
                                    {imagePreview && (
                                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '10px' }}>
                                            <img src={imagePreview} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }} />
                                            <button onClick={removeImage} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                                        </div>
                                    )}
                                    {/* Quick replies */}
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                                        {['Thanks!', 'When will it arrive?', 'Can you update tracking?', 'Got it, thank you!'].map((q, qi) => (
                                            <button key={qi} onClick={() => setNewMessage(q)} style={{
                                                background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.08)',
                                                borderRadius: '16px', padding: '4px 10px', color: '#94a3b8', fontSize: '0.68rem',
                                                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', whiteSpace: 'nowrap'
                                            }}>{q}</button>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} />
                                        <button onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '14px', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8', flexShrink: 0, transition: 'all 0.2s' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type your message..."
                                            style={{
                                                flex: 1, padding: '12px 16px', borderRadius: '14px',
                                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.1)',
                                                color: '#f1f5f9', fontSize: '0.9rem', outline: 'none'
                                            }}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={sendingMessage || (!newMessage.trim() && !selectedImage)}
                                            style={{
                                                padding: '12px 16px', borderRadius: '14px', border: 'none',
                                                background: (newMessage.trim() || selectedImage) ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(148,163,184,0.1)',
                                                color: '#fff', cursor: (newMessage.trim() || selectedImage) ? 'pointer' : 'not-allowed',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: sendingMessage ? 0.6 : 1, transition: 'all 0.2s'
                                            }}
                                        >
                                            {sendingMessage ? (
                                                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};

export default OrdersPage;
