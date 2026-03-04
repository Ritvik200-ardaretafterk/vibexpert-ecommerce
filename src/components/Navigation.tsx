import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { useAuth } from '../AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const { cartCount, setCartOpen, state } = useStore();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Deals', path: '/deals' },
    { label: 'Orders', path: '/orders', authRequired: true },
    { label: 'Wishlist', path: '/wishlist' },
  ].filter(link => !link.authRequired || isAuthenticated);

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '0',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: isScrolled
            ? 'rgba(5, 5, 16, 0.95)'
            : 'rgba(5, 5, 16, 0.8)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#f1f5f9' }}>VIBEXPERT</span>
              <span
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                .SHOP
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links — center */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    textDecoration: 'none',
                    color: isActive ? '#a855f7' : '#94a3b8',
                    fontWeight: 500,
                    fontSize: '0.88rem',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  {link.label}
                  {link.label === 'Wishlist' && state.wishlist.length > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ec4899',
                        color: 'white',
                        fontSize: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                      }}
                    >
                      {state.wishlist.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: isSearchOpen ? '#a855f7' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                transition: 'color 0.2s',
              }}
              id="search-toggle"
            >
              🔍
            </motion.button>

            {/* Cart */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCartOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '8px 10px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
              }}
              id="cart-toggle"
            >
              🛒
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: 'white',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>

            {/* User Menu / Login */}
            {isAuthenticated && user ? (
              <div style={{ position: 'relative', marginLeft: '4px' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
                  }}
                  className="desktop-login"
                  id="user-avatar-button"
                >
                  {user.profile_pic ? (
                    <img
                      src={user.profile_pic}
                      alt={user.username}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        minWidth: '200px',
                        background: 'rgba(10, 10, 32, 0.98)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: '14px',
                        padding: '12px',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
                        zIndex: 2000,
                      }}
                    >
                      <div
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid rgba(148,163,184,0.1)',
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>
                          👋 Hi, {user.username}!
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '10px',
                          color: '#f87171',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        🚪 Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.a
                href="https://www.vibexpert.online"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '7px 18px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  border: 'none',
                  marginLeft: '4px',
                }}
                className="desktop-login"
                id="login-button"
              >
                Login
              </motion.a>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#f1f5f9',
                cursor: 'pointer',
                fontSize: '1.4rem',
                padding: '8px',
                display: 'none',
                alignItems: 'center',
              }}
              className="mobile-menu-btn"
              id="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </motion.button>
          </div>
        </div>

        {/* Inline Search Bar — slides down under nav */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                overflow: 'hidden',
                borderTop: '1px solid rgba(148, 163, 184, 0.06)',
              }}
            >
              <form
                onSubmit={handleSearch}
                style={{
                  maxWidth: '600px',
                  margin: '0 auto',
                  padding: '12px 24px 14px',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products, categories..."
                    className="input-field"
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 18px',
                      fontSize: '0.95rem',
                      borderRadius: '12px',
                    }}
                    id="search-input"
                  />
                  <button
                    type="submit"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#a855f7',
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                    }}
                  >
                    →
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 1100,
                backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '280px',
                zIndex: 1101,
                background: 'rgba(10, 10, 32, 0.98)',
                backdropFilter: 'blur(30px)',
                padding: '24px',
                borderLeft: '1px solid rgba(148, 163, 184, 0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f1f5f9',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {/* Nav Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{
                        textDecoration: 'none',
                        color: location.pathname === link.path ? '#a855f7' : '#f1f5f9',
                        fontSize: '1.1rem',
                        fontWeight: location.pathname === link.path ? 700 : 500,
                        display: 'block',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        background: location.pathname === link.path
                          ? 'rgba(124, 58, 237, 0.1)'
                          : 'transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Login / User Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {isAuthenticated && user ? (
                  <>
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(124,58,237,0.1)',
                        borderRadius: '12px',
                        marginBottom: '8px',
                        border: '1px solid rgba(124,58,237,0.15)',
                      }}
                    >
                      <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.95rem' }}>
                        👋 Hi, {user.username}!
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'center',
                        padding: '14px',
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171',
                        borderRadius: '12px',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <a
                    href="https://www.vibexpert.online"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      color: 'white',
                      borderRadius: '12px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                    }}
                  >
                    Login on VibExpert →
                  </a>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Responsive CSS */}
      <style>{`
        .desktop-nav { display: flex !important; }
        .desktop-login { display: inline-flex !important; }
        .mobile-menu-btn { display: none !important; }
        
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .desktop-login { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default Navigation;
