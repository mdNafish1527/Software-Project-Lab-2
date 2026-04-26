import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterAdmin from './pages/RegisterAdmin';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Concerts from './pages/Concerts';
import ConcertDetail from './pages/ConcertDetail';
import Singers from './pages/Singers';
import Marketplace from './pages/Marketplace';
import AddProduct from './pages/AddProduct';

import AudienceDashboard from './pages/AudienceDashboard';
import SingerDashboard from './pages/SingerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';

import './styles/global.css';

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#040810' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          LOADING SYSTEM...
        </div>
      </div>
    </div>
  );
}

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}

function AppRoutes() {
  const [cartOpen, setCartOpen] = useState(false);

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Cart isOpen={cartOpen} onClose={closeCart} />
      <Navbar onOpenCart={openCart} />

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/register-admin" element={<RegisterAdmin />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/concerts" element={<Concerts onOpenCart={openCart} />} />
          <Route path="/concerts/:id" element={<ConcertDetail />} />

          <Route path="/singers" element={<Singers />} />
          <Route path="/singers/:id" element={<Singers />} />

          <Route path="/market" element={<Marketplace onOpenCart={openCart} />} />
          <Route path="/marketplace" element={<Marketplace onOpenCart={openCart} />} />

          <Route
            path="/marketplace/add"
            element={
              <PrivateRoute roles={['singer', 'organizer']}>
                <AddProduct />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/audience"
            element={
              <PrivateRoute roles={['audience']}>
                <AudienceDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/singer"
            element={
              <PrivateRoute roles={['singer']}>
                <SingerDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/organizer"
            element={
              <PrivateRoute roles={['organizer']}>
                <OrganizerDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <PrivateRoute roles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="*"
            element={
              <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px' }}>
                <div style={{ fontFamily: 'var(--text-display)', fontSize: '80px', color: 'var(--text-dim)', letterSpacing: '0.1em', lineHeight: 1, marginBottom: '16px', opacity: 0.3 }}>404</div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '8px' }}>PAGE NOT FOUND</div>
                <div style={{ fontFamily: 'var(--text-mono)', fontSize: '11px', color: 'var(--text-dim)', marginBottom: '28px' }}>The requested resource does not exist</div>
                <a href="/" className="btn btn-primary">← RETURN HOME</a>
              </div>
            }
          />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
