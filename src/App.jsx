import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Searches from './pages/Searches';
import CreateSearch from './pages/CreateSearch';
import AlertHistory from './pages/AlertHistory';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import IsvCalculator from './pages/IsvCalculator';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';

function AuthLoadingSpinner() {
  return (
    <>
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#ffffff'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid #e0e0e0',
          borderTopColor: 'var(--emerald)',
          animation: 'auth-spin 0.75s linear infinite'
        }} />
      </div>
    </>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/searches" replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/isv" element={<IsvCalculator />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Searches /></ProtectedRoute>} />
            <Route path="/searches" element={<ProtectedRoute><Searches /></ProtectedRoute>} />
            <Route path="/searches/new" element={<ProtectedRoute><CreateSearch /></ProtectedRoute>} />
            <Route path="/searches/:id/edit" element={<ProtectedRoute><CreateSearch /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertHistory /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
