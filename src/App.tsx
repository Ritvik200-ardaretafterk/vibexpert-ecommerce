import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import SupportPage from './pages/SupportPage';
import MessagesPage from './pages/MessagesPage';
import './App.css';

// Inner app component that can use auth context
const AppContent: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { addToCart, setCartOpen, showToast, state } = useStore();
  const [processedBuyNow, setProcessedBuyNow] = useState(false);

  // Global Buy Now listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const buyNowId = params.get('buy_now');
    
    if (buyNowId && !processedBuyNow) {
      const process = async () => {
        try {
          const res = await fetch('https://vibexpert-backend-main.onrender.com/api/shop/client-products');
          const data = await res.json();
          
          if (data.success && data.products) {
            const found = data.products.find((p: any) => 
              String(p._id) === String(buyNowId) || String(p.id) === String(buyNowId)
            );
            
            if (found) {
              const qty = parseInt(params.get('qty') || '1');
              const color = params.get('color') || undefined;
              const size = params.get('size') || undefined;
              
              const mappedProduct = {
                id: found._id || found.id,
                name: found.name,
                price: found.price,
                originalPrice: found.originalPrice || found.price,
                description: found.description,
                category: found.category,
                image: found.image || found.images?.[0]?.url || 'https://via.placeholder.com/600',
                rating: found.rating || 5.0,
                reviews: found.reviews || 0,
                stockQuantity: found.stockQuantity
              };
              
              addToCart(mappedProduct, qty, color, size);
              setProcessedBuyNow(true);
              
              // Ensure drawer opens
              setTimeout(() => {
                setCartOpen(true);
                showToast('🚀 Taking you to checkout...', 'success');
              }, 500);

              // Clean URL but keep other params for the current route
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('buy_now');
              newUrl.searchParams.delete('qty');
              newUrl.searchParams.delete('color');
              newUrl.searchParams.delete('size');
              window.history.replaceState({}, '', newUrl.toString());
            }
          }
        } catch (err) {
          console.error('Buy Now processing failed:', err);
        }
      };
      process();
    }
  }, [processedBuyNow, addToCart, setCartOpen, showToast]);

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
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/messages" element={<MessagesPage />} />
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
