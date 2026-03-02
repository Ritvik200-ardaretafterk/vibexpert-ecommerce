import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store';
import { AuthProvider, useAuth } from './AuthContext';
import Navigation from './components/Navigation';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import PromoBar from './components/PromoBar';
import LoginGate from './components/LoginGate';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import DealsPage from './pages/DealsPage';

import SearchPage from './pages/SearchPage';
import './App.css';

// Inner app component that can use auth context
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking SSO token
  if (isLoading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#050510',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(124,58,237,0.2)',
            borderTopColor: '#a855f7',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Verifying your session...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show login gate if not authenticated
  if (!isAuthenticated) {
    return <LoginGate />;
  }

  // Authenticated — show full app
  return (
    <Router>
      <div className="App">
        <PromoBar />
        <Navigation />
        <CartDrawer />
        <Toast />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/deals" element={<DealsPage />} />

          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
