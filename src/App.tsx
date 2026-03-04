import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './store';
import { AuthProvider, useAuth } from './AuthContext';
import Navigation from './components/Navigation';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import PromoBar from './components/PromoBar';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import DealsPage from './pages/DealsPage';
import OrdersPage from './pages/OrdersPage';

import SearchPage from './pages/SearchPage';
import './App.css';

// Inner app component that can use auth context
const AppContent: React.FC = () => {
  const { isLoading, cameFromSSO } = useAuth();

  // Show loading spinner ONLY while checking SSO token from URL
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
          Loading VibExpert Shop...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Everyone can browse — no login gate!
  return (
    <Router>
      <div className="App">
        <PromoBar />
        <Navigation />
        <CartDrawer />
        <Toast />
        <Routes>
          <Route path="/" element={cameFromSSO ? <Navigate to="/shop" replace /> : <HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
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
