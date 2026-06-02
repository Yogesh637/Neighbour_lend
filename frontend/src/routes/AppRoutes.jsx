import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import ChatWidget from '../components/Chat/ChatWidget';

// Lazy load pages for code splitting
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const VerifyOtp = lazy(() => import('../pages/Auth/VerifyOtp'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));

// Reusable shimmer-based loader component for premium feel
const RouteLoader = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#fff',
    gap: '16px'
  }}>
    <div className="shimmer" style={{ width: '120px', height: '120px', borderRadius: '50%' }}></div>
    <div className="shimmer" style={{ width: '200px', height: '24px', borderRadius: '4px' }}></div>
    <div style={{ color: '#717171', fontSize: '14px', fontWeight: '500' }}>Loading NeighbourLend...</div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.roles && (user.roles.includes('ADMIN') || user.roles.includes('ROLE_ADMIN'));
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ChatWidget />
    </Suspense>
  );
};

export default AppRoutes;
