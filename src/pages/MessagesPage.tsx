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
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
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

    // Auto-dismiss upload error
    useEffect(() => {
        if (uploadError) {
            const t = setTimeout(() => setUploadError(null), 5000);
            return () => clearTimeout(t);
        }
    }, [uploadError]);

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
                const newMessages = data.messages || [];
                setMessages(newMessages);
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
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('Image too large. Maximum size is 10MB.');
                return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setUploadError('Only image files are allowed.');
                return;
            }
            setSelectedImage(file);
            setUploadError(null);
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
        setUploadError(null);
        prevMsgCountRef.current = 0;
        setMobileShowChat(true);
        fetchMessages(order.order_id);
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !selectedImage) || !selectedOrder) return;
        setSendingMessage(true);
        setUploadError(null);
        try {
            const token = localStorage.getItem('shop_auth_token');
            const formData = new FormData();
            formData.append('orderId', selectedOrder.order_id);
            formData.append('senderId', user?.id || '');
            formData.append('senderRole', 'user');
            formData.append('message', newMessage.trim());
            if (selectedImage) formData.append('image', selectedImage);

            const response = await fetch(`${API_URL}/api/orders/${selectedOrder.order_id}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message');
            }

            setNewMessage('');
            removeImage();
            fetchMessages(selectedOrder.order_id);
        } catch (err: any) {
            console.error('Send message error:', err);
            setUploadError(err.message || 'Failed to send message. Please try again.');
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

    const chatOrders = orders.filter(o => ['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(o.status));

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Group messages by date
    const groupedMessages = messages.reduce<{ date: string; msgs: ChatMessage[] }[]>((groups, msg) => {
        const date = formatDate(msg.createdAt);
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === date) {
            lastGroup.msgs.push(msg);
        } else {
            groups.push({ date, msgs: [msg] });
        }
        return groups;
    }, []);

    if (!isAuthenticated) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '28px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))',
                    border: '1px solid rgba(124,58,237,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '24px'
                }}>
                    <span style={{ fontSize: '3rem' }}>💬</span>
                </div>
                <h2 style={{ color: '#f1f5f9', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Please Login</h2>
                <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.6, marginTop: '8px' }}>You need to be logged in via vibexpert.online to view your messages.</p>
                <a href="https://www.vibexpert.online" target="_blank" rel="noopener noreferrer"
                    style={{ marginTop: '24px', padding: '14px 32px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', textDecoration: 'none', borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.3s', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
                    Login to view Messages
                </a>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ padding: '80px 24px', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(124,58,237,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 40px', minHeight: '80vh' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* Page Header */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 6px', letterSpacing: '-0.03em', fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                        Messages
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                        Chat with sellers and admins about your orders
                    </p>
                </div>

                {/* Error Toast */}
                <AnimatePresence>
                    {uploadError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{
                                position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)',
                                zIndex: 9999, padding: '14px 24px', borderRadius: '14px',
                                background: 'rgba(239,68,68,0.95)', color: '#fff', fontSize: '0.88rem',
                                fontWeight: 600, boxShadow: '0 8px 32px rgba(239,68,68,0.3)',
                                display: 'flex', alignItems: 'center', gap: '10px', backdropFilter: 'blur(10px)',
                                maxWidth: '90vw'
                            }}
                        >
                            <span>⚠️</span>
                            <span>{uploadError}</span>
                            <button onClick={() => setUploadError(null)} style={{
                                background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
                                borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                                marginLeft: '4px', flexShrink: 0
                            }}>✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Image Viewer Overlay */}
                <AnimatePresence>
                    {imageViewerUrl && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setImageViewerUrl(null)}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 9999,
                                background: 'rgba(0,0,0,0.9)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                                padding: '20px'
                            }}
                        >
                            <motion.img
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.8 }}
                                src={imageViewerUrl} alt="Full view"
                                style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
                            />
                            <button onClick={() => setImageViewerUrl(null)} style={{
                                position: 'absolute', top: '20px', right: '20px',
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff', borderRadius: '12px', width: '44px', height: '44px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', backdropFilter: 'blur(10px)'
                            }}>✕</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Layout: Sidebar + Chat */}
                <div className="messages-layout">
                    {/* Order List Sidebar */}
                    <div className="messages-sidebar" style={{
                        background: 'rgba(10, 10, 32, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)',
                        borderRadius: '20px', overflow: 'hidden', display: mobileShowChat ? 'none' : 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '18px 20px', borderBottom: '1px solid rgba(148,163,184,0.06)',
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(168,85,247,0.02))'
                        }}>
                            <h3 style={{
                                color: '#f1f5f9', fontSize: '0.88rem', fontWeight: 700, margin: 0,
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                <span style={{
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                                }}>📋</span>
                                Your Orders
                                <span style={{
                                    fontSize: '0.7rem', color: '#64748b', fontWeight: 500,
                                    background: 'rgba(148,163,184,0.08)', padding: '2px 8px', borderRadius: '10px'
                                }}>
                                    {chatOrders.length}
                                </span>
                            </h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {chatOrders.length === 0 ? (
                                <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '18px',
                                        background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        margin: '0 auto 16px', fontSize: '28px'
                                    }}>📦</div>
                                    <p style={{ color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600 }}>No orders yet</p>
                                    <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '6px', lineHeight: 1.5 }}>
                                        Place an order to start chatting with sellers!
                                    </p>
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
                                            transition={{ delay: i * 0.04 }}
                                            onClick={() => openChat(order)}
                                            style={{
                                                padding: '16px 20px', cursor: 'pointer', transition: 'all 0.25s ease',
                                                borderBottom: '1px solid rgba(148,163,184,0.04)',
                                                background: isSelected
                                                    ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(168,85,247,0.05))'
                                                    : 'transparent',
                                                borderLeft: isSelected ? '3px solid #a855f7' : '3px solid transparent',
                                            }}
                                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.03)'; }}
                                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <span style={{
                                                    color: sc.color, fontSize: '0.62rem', fontWeight: 700,
                                                    background: sc.bg, padding: '3px 10px', borderRadius: '20px',
                                                    textTransform: 'uppercase' as const, letterSpacing: '0.04em'
                                                }}>
                                                    {sc.icon} {sc.label}
                                                </span>
                                                {msgCount > 0 && (
                                                    <span style={{
                                                        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                                        color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                                                        padding: '3px 8px', borderRadius: '12px', minWidth: '20px',
                                                        textAlign: 'center', boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
                                                    }}>
                                                        {msgCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                {items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx} style={{
                                                        width: '32px', height: '32px', borderRadius: '8px',
                                                        overflow: 'hidden', flexShrink: 0, background: '#0f0f2a',
                                                        border: '1px solid rgba(148,163,184,0.06)'
                                                    }}>
                                                        {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                    </div>
                                                ))}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{
                                                        color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600,
                                                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                    }}>
                                                        {items.map(i => i.name).join(', ') || 'Order'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#475569', fontSize: '0.68rem', fontFamily: 'monospace' }}>
                                                    #{order.order_id.substring(order.order_id.length - 8)}
                                                </span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
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
                        background: 'rgba(10, 10, 32, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)',
                        borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        minHeight: '600px'
                    }}>
                        {!selectedOrder ? (
                            <div style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center'
                            }}>
                                <div style={{
                                    width: '88px', height: '88px', borderRadius: '26px',
                                    background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.06))',
                                    border: '1px solid rgba(124,58,237,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '24px'
                                }}>
                                    <span style={{ fontSize: '2.2rem' }}>💬</span>
                                </div>
                                <h3 style={{ color: '#e2e8f0', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 10px', fontFamily: 'Space Grotesk, Inter, sans-serif' }}>
                                    Select an Order to Chat
                                </h3>
                                <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '340px', lineHeight: 1.6 }}>
                                    Choose an order from the left panel to start or continue a conversation with the seller.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div style={{
                                    padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.06)',
                                    background: 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(168,85,247,0.02))'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* Back button (mobile) */}
                                            <button
                                                onClick={() => { setMobileShowChat(false); setSelectedOrder(null); }}
                                                className="messages-back-btn"
                                                style={{
                                                    display: 'none', background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.1)',
                                                    borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer',
                                                    alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '16px',
                                                    flexShrink: 0
                                                }}
                                            >
                                                ←
                                            </button>
                                            <div>
                                                <h3 style={{ color: '#f1f5f9', fontSize: '0.92rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    💬 Order Chat
                                                </h3>
                                                <p style={{ color: '#475569', fontSize: '0.7rem', fontFamily: 'monospace', margin: '3px 0 0' }}>
                                                    {selectedOrder.order_id}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {(() => {
                                                const sc = statusConfig[selectedOrder.status] || statusConfig['created'];
                                                return (
                                                    <span style={{
                                                        color: sc.color, fontSize: '0.62rem', fontWeight: 700,
                                                        background: sc.bg, padding: '4px 12px', borderRadius: '20px',
                                                        textTransform: 'uppercase' as const, letterSpacing: '0.04em'
                                                    }}>
                                                        {sc.icon} {sc.label}
                                                    </span>
                                                );
                                            })()}
                                            <span style={{
                                                color: '#a855f7', fontSize: '0.88rem', fontWeight: 700,
                                                background: 'rgba(168,85,247,0.08)', padding: '4px 12px', borderRadius: '10px'
                                            }}>
                                                ₹{selectedOrder.total_amount?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Item thumbnails */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '2px' }}>
                                        {parseItems(selectedOrder).map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                background: 'rgba(148,163,184,0.04)', borderRadius: '10px',
                                                padding: '6px 10px', flexShrink: 0,
                                                border: '1px solid rgba(148,163,184,0.06)'
                                            }}>
                                                {item.image && <img src={item.image} alt="" style={{ width: '22px', height: '22px', borderRadius: '5px', objectFit: 'cover' }} />}
                                                <span style={{ color: '#e2e8f0', fontSize: '0.72rem', fontWeight: 500, maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                                                <span style={{ color: '#64748b', fontSize: '0.6rem' }}>×{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Messages */}
                                <div style={{
                                    flex: 1, overflowY: 'auto', padding: '24px 20px',
                                    display: 'flex', flexDirection: 'column', gap: '4px',
                                    minHeight: '300px', background: 'rgba(5,5,16,0.3)'
                                }}>
                                    {loadingMessages ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                                            <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(124,58,237,0.2)', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                                            <div style={{
                                                width: '72px', height: '72px', borderRadius: '22px',
                                                background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginBottom: '16px', fontSize: '28px'
                                            }}>💬</div>
                                            <p style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 6px' }}>No messages yet</p>
                                            <p style={{ color: '#475569', fontSize: '0.82rem', maxWidth: '300px', lineHeight: 1.6 }}>
                                                Start a conversation — ask about delivery, product details, or anything else!
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
                                                {['When will my order ship?', 'Can I track my delivery?', 'Need help with this order'].map((s, si) => (
                                                    <button key={si} onClick={() => setNewMessage(s)} style={{
                                                        background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)',
                                                        borderRadius: '20px', padding: '8px 16px', color: '#a78bfa', fontSize: '0.76rem',
                                                        cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
                                                    }}>{s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {groupedMessages.map((group, gi) => (
                                                <React.Fragment key={gi}>
                                                    {/* Date separator */}
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', gap: '12px',
                                                        margin: '16px 0 12px', padding: '0 20px'
                                                    }}>
                                                        <div style={{ flex: 1, height: '1px', background: 'rgba(148,163,184,0.06)' }} />
                                                        <span style={{
                                                            fontSize: '0.68rem', color: '#475569', fontWeight: 600,
                                                            background: 'rgba(148,163,184,0.05)', padding: '4px 14px',
                                                            borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '0.02em'
                                                        }}>
                                                            {group.date}
                                                        </span>
                                                        <div style={{ flex: 1, height: '1px', background: 'rgba(148,163,184,0.06)' }} />
                                                    </div>
                                                    {group.msgs.map((msg, mi) => {
                                                        const isMe = msg.senderRole === 'user';
                                                        const isAdmin = msg.senderRole === 'admin';
                                                        const isSeller = msg.senderRole === 'client';
                                                        return (
                                                            <motion.div
                                                                key={msg._id || mi}
                                                                initial={{ opacity: 0, y: 8 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ duration: 0.2, delay: mi * 0.02 }}
                                                                style={{
                                                                    display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
                                                                    marginBottom: '6px', padding: '0 4px'
                                                                }}
                                                            >
                                                                {/* Avatar for non-user messages */}
                                                                {!isMe && (
                                                                    <div style={{
                                                                        width: '32px', height: '32px', borderRadius: '10px',
                                                                        background: isAdmin
                                                                            ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))'
                                                                            : 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.05))',
                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                        marginRight: '10px', marginTop: '4px', flexShrink: 0,
                                                                        fontSize: '14px', border: `1px solid ${isAdmin ? 'rgba(245,158,11,0.15)' : 'rgba(124,58,237,0.15)'}`
                                                                    }}>
                                                                        {isAdmin ? '🛡️' : '🛍️'}
                                                                    </div>
                                                                )}
                                                                <div style={{
                                                                    maxWidth: '72%', minWidth: '80px',
                                                                    padding: msg.mediaUrl ? '6px' : '12px 16px',
                                                                    borderRadius: '18px',
                                                                    borderBottomRightRadius: isMe ? '6px' : '18px',
                                                                    borderBottomLeftRadius: isMe ? '18px' : '6px',
                                                                    background: isMe
                                                                        ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
                                                                        : isAdmin
                                                                            ? 'rgba(245,158,11,0.08)'
                                                                            : 'rgba(30, 30, 60, 0.6)',
                                                                    border: isMe ? 'none' : `1px solid ${isAdmin ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.08)'}`,
                                                                    boxShadow: isMe ? '0 2px 12px rgba(124,58,237,0.2)' : '0 1px 4px rgba(0,0,0,0.1)',
                                                                }}>
                                                                    {!isMe && (
                                                                        <p style={{
                                                                            margin: msg.mediaUrl ? '6px 8px 6px' : '0 0 6px', fontSize: '0.65rem', fontWeight: 700,
                                                                            color: isAdmin ? '#f59e0b' : '#a78bfa',
                                                                            letterSpacing: '0.03em', textTransform: 'uppercase' as const
                                                                        }}>
                                                                            {isAdmin ? 'Admin' : 'Seller'}
                                                                        </p>
                                                                    )}
                                                                    {msg.mediaUrl && (
                                                                        <div style={{
                                                                            marginBottom: msg.message && msg.message !== '📷 Photo' ? '8px' : '0',
                                                                            borderRadius: msg.message && msg.message !== '📷 Photo' ? '14px 14px 4px 4px' : '14px',
                                                                            overflow: 'hidden'
                                                                        }}>
                                                                            <img
                                                                                src={msg.mediaUrl}
                                                                                alt="Attached"
                                                                                style={{
                                                                                    maxWidth: '100%', maxHeight: '240px', objectFit: 'cover',
                                                                                    display: 'block', cursor: 'zoom-in',
                                                                                    borderRadius: 'inherit',
                                                                                    minWidth: '160px'
                                                                                }}
                                                                                onClick={() => setImageViewerUrl(msg.mediaUrl || null)}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {msg.message && msg.message !== '📷 Photo' && (
                                                                        <p style={{
                                                                            margin: msg.mediaUrl ? '0 8px' : 0,
                                                                            color: isMe ? '#fff' : '#e2e8f0',
                                                                            fontSize: '0.9rem', lineHeight: 1.55,
                                                                            wordBreak: 'break-word' as const
                                                                        }}>
                                                                            {msg.message}
                                                                        </p>
                                                                    )}
                                                                    <p style={{
                                                                        margin: msg.mediaUrl ? '4px 8px 6px' : '6px 0 0', fontSize: '0.62rem',
                                                                        color: isMe ? 'rgba(255,255,255,0.45)' : '#475569',
                                                                        textAlign: isMe ? 'right' : 'left' as const
                                                                    }}>
                                                                        {formatTime(msg.createdAt)}
                                                                    </p>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input Area */}
                                <div style={{
                                    borderTop: '1px solid rgba(148,163,184,0.06)',
                                    background: 'rgba(10,10,32,0.4)'
                                }}>
                                    {/* Image Preview */}
                                    <AnimatePresence>
                                        {imagePreview && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ padding: '12px 16px 0', overflow: 'hidden' }}
                                            >
                                                <div style={{
                                                    position: 'relative', display: 'inline-block',
                                                    borderRadius: '12px', overflow: 'hidden',
                                                    border: '2px solid rgba(124,58,237,0.2)'
                                                }}>
                                                    <img src={imagePreview} alt="Preview" style={{
                                                        height: '70px', borderRadius: '10px', display: 'block'
                                                    }} />
                                                    <button onClick={removeImage} style={{
                                                        position: 'absolute', top: '-2px', right: '-2px',
                                                        background: '#ef4444', color: 'white', border: '2px solid rgba(10,10,32,0.8)',
                                                        borderRadius: '50%', width: '22px', height: '22px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', fontSize: '10px', fontWeight: 700
                                                    }}>✕</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Quick replies */}
                                    <div style={{
                                        display: 'flex', gap: '6px', padding: '10px 16px 4px',
                                        overflowX: 'auto'
                                    }}>
                                        {['Thanks!', 'When will it arrive?', 'Got it, thank you!'].map((q, qi) => (
                                            <button key={qi} onClick={() => setNewMessage(q)} style={{
                                                background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)',
                                                borderRadius: '18px', padding: '5px 14px', color: '#a78bfa', fontSize: '0.72rem',
                                                cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', whiteSpace: 'nowrap',
                                                fontWeight: 500
                                            }}>{q}</button>
                                        ))}
                                    </div>

                                    {/* Input row */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 16px 16px' }}>
                                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                background: selectedImage ? 'rgba(124,58,237,0.12)' : 'rgba(148,163,184,0.06)',
                                                border: `1px solid ${selectedImage ? 'rgba(124,58,237,0.2)' : 'rgba(148,163,184,0.08)'}`,
                                                borderRadius: '14px', width: '46px', height: '46px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', color: selectedImage ? '#a855f7' : '#64748b',
                                                flexShrink: 0, transition: 'all 0.25s'
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type your message..."
                                            style={{
                                                flex: 1, padding: '13px 18px', borderRadius: '14px',
                                                background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.08)',
                                                color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
                                                transition: 'border-color 0.25s'
                                            }}
                                            onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(124,58,237,0.3)'}
                                            onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(148,163,184,0.08)'}
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={sendingMessage || (!newMessage.trim() && !selectedImage)}
                                            style={{
                                                padding: '0 22px', height: '46px', borderRadius: '14px', border: 'none',
                                                background: (newMessage.trim() || selectedImage)
                                                    ? 'linear-gradient(135deg, #7c3aed, #9333ea)'
                                                    : 'rgba(148,163,184,0.06)',
                                                color: '#fff',
                                                cursor: (newMessage.trim() || selectedImage) ? 'pointer' : 'not-allowed',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                opacity: sendingMessage ? 0.6 : 1, transition: 'all 0.25s',
                                                fontSize: '0.85rem', fontWeight: 600, flexShrink: 0,
                                                boxShadow: (newMessage.trim() || selectedImage) ? '0 4px 16px rgba(124,58,237,0.25)' : 'none'
                                            }}
                                        >
                                            {sendingMessage ? (
                                                <div style={{
                                                    width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)',
                                                    borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                                                }} />
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
                @media (max-width: 767px) {
                    .messages-back-btn { display: flex !important; }
                    .messages-sidebar { display: ${mobileShowChat ? 'none' : 'flex'} !important; }
                }
            `}</style>
        </div>
    );
};

export default MessagesPage;
