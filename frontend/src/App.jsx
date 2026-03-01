import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/global.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Concerts from './pages/Concerts';
import ConcertDetail from './pages/ConcertDetail';
import Singers from './pages/Singers';
import Marketplace from './pages/Marketplace';
import AudienceDashboard from './pages/AudienceDashboard';
import SingerDashboard from './pages/SingerDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} />;
  return children;
};

const PendingPage = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>⏳</div>
      <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 12 }}>Account Under Review</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 400 }}>Your account is being reviewed by our admin team. We'll contact you via email soon. Thank you for your patience!</p>
    </div>
  </div>
);

const AppContent = () => {
  const { user } = useAuth();
  // Hide navbar/footer on dashboard pages
  const dashboardRoles = ['audience', 'singer', 'organizer', 'admin'];
  const isDashboard = user && dashboardRoles.some(r => window.location.pathname.includes(`/${r}/dashboard`));

  return (
    <>
      {!isDashboard && <Navbar />}
      <Routes>
        <Route path="/" element={<><Home /><Footer /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/pending" element={<PendingPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/concerts" element={<><Navbar /><Concerts /><Footer /></>} />
        <Route path="/concerts/:id" element={<><Navbar /><ConcertDetail /></>} />
        <Route path="/singers" element={<><Navbar /><Singers /><Footer /></>} />
        <Route path="/marketplace" element={<><Navbar /><Marketplace /><Footer /></>} />

        <Route path="/audience/dashboard" element={
          <ProtectedRoute role="audience"><AudienceDashboard /></ProtectedRoute>
        } />
        <Route path="/singer/dashboard" element={
          <ProtectedRoute role="singer"><SingerDashboard /></ProtectedRoute>
        } />
        <Route path="/organizer/dashboard" element={
          <ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="*" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '5rem', color: 'var(--gold)' }}>404</h1>
            <p style={{ color: 'var(--muted)' }}>Page not found</p>
            <a href="/" className="btn btn-primary">Go Home</a>
          </div>
        } />
      </Routes>
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        theme="dark"
      />
    </>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </AuthProvider>
);

export default App;