import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';

const SupportPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.username || '',
    email: user?.email || '',
    subject: '',
    message: '',
    type: 'support'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://vibexpert-backend-main.onrender.com/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || null,
          source: 'shop'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');
      setSuccess(true);
      setFormData({ ...formData, subject: '', message: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '120px 24px 60px', minHeight: '80vh' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '8px' }}>Support & Feedback</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '32px' }}>
          Having trouble with an order or just want to leave feedback? Let us know below.
        </p>

        {success ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '24px', borderRadius: '16px', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981', fontSize: '1.25rem', marginBottom: '8px' }}>Ticket Submitted! ✅</h3>
            <p style={{ color: '#a7f3d0' }}>Our team will get back to you at {formData.email} as soon as possible.</p>
            <button 
              onClick={() => setSuccess(false)}
              style={{ marginTop: '16px', padding: '8px 16px', background: 'transparent', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', borderRadius: '8px', cursor: 'pointer' }}
            >
              Submit another ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: 'rgba(30, 41, 59, 0.3)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
            {error && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Your Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isAuthenticated && !!user?.username}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#f1f5f9', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={isAuthenticated && !!user?.email}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#f1f5f9', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Ticket Type</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#f1f5f9', outline: 'none', cursor: 'pointer' }}
              >
                <option value="support">General Support / Order Inquiry</option>
                <option value="bug">Report a Bug / Glitch</option>
                <option value="feedback">Suggest Feedback</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Subject</label>
              <input 
                type="text" 
                value={formData.subject} 
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="Brief summary of your issue..."
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#f1f5f9', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 500 }}>Message</label>
              <textarea 
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Explain what's going on in detail..."
                rows={5}
                style={{ width: '100%', padding: '12px 16px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '12px', color: '#f1f5f9', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default SupportPage;
