import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../AuthContext';

const API_URL = 'https://vibexpert-backend-main.onrender.com';

interface OrderItem {
    name: string;
    price: string;
    quantity: number;
    image: string;
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

interface Order {
    id: string;
    order_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: string;
}

const MessagesPage: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [orderMessageCounts, setOrderMessageCounts] = useState<Record<string, number>>({});
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (isAuthenticated) {
            fetchOrders();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Auto-poll messages when a chat is open
    useEffect(() => {
        if (selectedOrder) {
            chatPollRef.current = setInterval(() => {
                fetchMessages(selectedOrder.order_id, true);
            }, 4000);
        }
        return () => {
            if (chatPollRef.current) clearInterval(chatPollRef.current);
        };
    }, [selectedOrder]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('shop_auth_token');
            if (!token) { setLoading(false); return; }
            const response = await fetch(`${API_URL}/api/shop/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const allOrders = data.orders || [];
                setOrders(allOrders);

                // Fetch message counts for all orders
                const counts: Record<string, number> = {};
                await Promise.all(
                    allOrders.filter((o: Order) => ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(o.status))
                        .map(async (o: Order) => {
                            try {
                                const msgRes = await fetch(`${API_URL}/api/orders/${o.order_id}/messages`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (msgRes.ok) {
                                    const msgData = await msgRes.json();
                                    counts[o.order_id] = (msgData.messages || []).length;
                                }
                            } catch { /* ignore */ }
                        })
                );
                setOrderMessageCounts(counts);
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
                setMessages(data.messages || []);
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
        setSelectedOrder(order);
        setMessages([]);
        removeImage();
        setNewMessage('');
        fetchMessages(order.order_id);
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !selectedOrder) return;
        setSendingMessage(true);
        try {
            const token = localStorage.getItem('shop_auth_token');
            const formData = new FormData();
            formData.append('orderId', selectedOrder.order_id);
            formData.append('senderId', user?.id || '');
            formData.append('senderRole', 'user');
            if (newMessage.trim()) formData.append('message', newMessage.trim());
            if (selectedImage) formData.append('image', selectedImage);

            await fetch(`${API_URL}/api/orders/${selectedOrder.order_id}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            setNewMessage('');
            removeImage();
            fetchMessages(selectedOrder.order_id);
        } catch (err) {
            console.error('Send message error:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    const parseItems = (order: Order): OrderItem[] => {
        try { return JSON.parse(order.items); } catch { return []; }
    };

    const statusConfig: any = {
        'paid': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Paid', icon: '💳' },
        'created': { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Processing', icon: '⏳' },
        'processing': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Processing', icon: '⚙️' },
        'shipped': { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', label: 'Shipped', icon: '🚚' },
        'delivered': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Delivered', icon: '✅' },
        'completed': { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Completed', icon: '✅' },
        'failed': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Failed', icon: '❌' },
    };

    // Filter orders that can have chats
    const chatOrders = orders.filter(o => ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(o.status));

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '4rem', marginBottom: '20px' }}>💬</span>
                <h2 style={{ color: '#f1f5f9', fontWeight: 800 }}>Please Login</h2>
                <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6 }}>You need to be logged in via vibexpert.online to view your messages.</p>
                <a href="https://www.vibexpert.online" target="_blank" rel="noopener noreferrer"
                    style={{ marginTop: '20px', padding: '12px 24px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700 }}>
                    Login to view Messages
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px', minHeight: '80vh' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Page Header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                        Messages
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
                        Chat with sellers and admins about your orders.
                    </p>
                </div>

                {/* Layout: Sidebar + Chat */}
                <div className="messages-layout">
                    {/* Order List Sidebar */}
                    <div className="messages-sidebar" style={{
                        background: 'rgba(5, 5, 16, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                📋 Your Orders
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>({chatOrders.length})</span>
                            </h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {chatOrders.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>📦</span>
                                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No orders with active chats</p>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>Place an order to start chatting with sellers!</p>
                                </div>
                            ) : (
                                chatOrders.map((order, i) => {
                                    const items = parseItems(order);
                                    const sc = statusConfig[order.status] || statusConfig['created'];
                                    const msgCount = orderMessageCounts[order.order_id] || 0;
                                    const isSelected = selectedOrder?.order_id === order.order_id;

                                    return (
                                        <motion.div
                                            key={order.order_id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => openChat(order)}
                                            style={{
                                                padding: '14px 20px', cursor: 'pointer', transition: 'all 0.2s',
                                                borderBottom: '1px solid rgba(148,163,184,0.06)',
                                                background: isSelected ? 'rgba(124,58,237,0.08)' : 'transparent',
                                                borderLeft: isSelected ? '3px solid #a855f7' : '3px solid transparent',
                                            }}
                                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{
                                                    color: sc.color, fontSize: '0.65rem', fontWeight: 700,
                                                    background: sc.bg, padding: '2px 8px', borderRadius: '12px',
                                                    textTransform: 'uppercase' as const
                                                }}>
                                                    {sc.icon} {sc.label}
                                                </span>
                                                {msgCount > 0 && (
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                        color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                                        padding: '2px 7px', borderRadius: '10px', minWidth: '18px', textAlign: 'center'
                                                    }}>
                                                        {msgCount}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Items preview */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                {items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#1a1a2e' }}>
                                                        {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    </div>
                                                ))}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        color: '#f1f5f9', fontSize: '0.82rem', fontWeight: 600,
                                                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}>
                                                        {items.map(i => i.name).join(', ') || 'Order'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#64748b', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                                                    #{order.order_id.substring(order.order_id.length - 8)}
                                                </span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                                    ₹{order.total_amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div style={{
                        flex: 1,
                        background: 'rgba(5, 5, 16, 0.4)', border: '1px solid rgba(148, 163, 184, 0.1)',
                        borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}>
                        {!selectedOrder ? (
                            /* Empty State */
                            <div style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '24px',
                                    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))',
                                    border: '1px solid rgba(124,58,237,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <span style={{ fontSize: '2rem' }}>💬</span>
                                </div>
                                <h3 style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px' }}>
                                    Select an Order to Chat
                                </h3>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '320px', lineHeight: 1.6 }}>
                                    Choose an order from the left panel to start or continue a conversation with the seller.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <h3 style={{ color: '#f1f5f9', fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                💬 Order Chat
                                            </h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'monospace', margin: '4px 0 0' }}>
                                                {selectedOrder.order_id}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {(() => {
                                                const sc = statusConfig[selectedOrder.status] || statusConfig['created'];
                                                return (
                                                    <span style={{
                                                        color: sc.color, fontSize: '0.65rem', fontWeight: 700,
                                                        background: sc.bg, padding: '3px 10px', borderRadius: '12px',
                                                        textTransform: 'uppercase' as const
                                                    }}>
                                                        {sc.icon} {sc.label}
                                                    </span>
                                                );
                                            })()}
                                            <span style={{ color: '#a855f7', fontSize: '0.85rem', fontWeight: 700 }}>
                                                ₹{selectedOrder.total_amount?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Item thumbnails */}
                                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
                                        {parseItems(selectedOrder).map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: 'rgba(148,163,184,0.06)', borderRadius: '8px',
                                                padding: '4px 8px', flexShrink: 0
                                            }}>
                                                {item.image && <img src={item.image} alt="" style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />}
                                                <span style={{ color: '#f1f5f9', fontSize: '0.7rem', fontWeight: 500, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.6rem' }}>×{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '300px' }}>
                                    {loadingMessages ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <div style={{ width: '24px', height: '24px', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                                            <span style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💬</span>
                                            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 4px' }}>No messages yet</p>
                                            <p style={{ color: '#64748b', fontSize: '0.78rem', maxWidth: '280px', lineHeight: 1.5 }}>
                                                Start a conversation — ask about delivery, product details, or anything else!
                                            </p>
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
                                                        maxWidth: '75%', padding: '10px 14px', borderRadius: '16px',
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
                                                            {' · '}
                                                            {new Date(msg.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input */}
                                <div style={{ borderTop: '1px solid rgba(148,163,184,0.1)', padding: '12px 16px' }}>
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
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                                                padding: '0 20px', height: '45px', borderRadius: '14px', border: 'none',
                                                background: (newMessage.trim() || selectedImage) ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(148,163,184,0.1)',
                                                color: '#fff', cursor: (newMessage.trim() || selectedImage) ? 'pointer' : 'not-allowed',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                opacity: sendingMessage ? 0.6 : 1, transition: 'all 0.2s',
                                                fontSize: '0.85rem', fontWeight: 600
                                            }}
                                        >
                                            {sendingMessage ? (
                                                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            ) : (
                                                <>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                                    </svg>
                                                    Send
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default MessagesPage;
