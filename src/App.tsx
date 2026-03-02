import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store';
import Navigation from './components/Navigation';
import CartDrawer from './components/CartDrawer';
import Toast from './components/Toast';
import PromoBar from './components/PromoBar';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import DealsPage from './pages/DealsPage';

import SearchPage from './pages/SearchPage';
import './App.css';

function App() {
  return (
    <StoreProvider>
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
    </StoreProvider>
  );
}

export default App;
