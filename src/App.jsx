import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AlertsProvider } from './context/AlertsContext';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IsvCalculator from './pages/IsvCalculator';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Searches from './pages/Searches';
import CreateSearch from './pages/CreateSearch';
import AlertHistory from './pages/AlertHistory';
import Settings from './pages/Settings';
import AdminOverview from './pages/admin/AdminOverview';
import AdminStands from './pages/admin/AdminStands';
import AdminBilling from './pages/admin/AdminBilling';
import AdminLogs from './pages/admin/AdminLogs';
import AdminFeedback from './pages/admin/AdminFeedback';
import NotFound from './pages/NotFound';
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
  if (currentUser?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Symmetric counterpart of AdminRoute: keeps platform admins off dealer-only
// screens (they have no company_id/company_role, so those pages would be
// broken/empty for them) and redirects them to /admin instead.
function DealerRoute({ children }) {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <ToastProvider>
        <AlertsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            {/* /signup is a dead invite-only page from the old flow (item 6, fix-batch-1) */}
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/privacidade" element={<Privacy />} />

            {/* Protected Routes (dealer-only: platform admins are redirected to /admin) */}
            <Route path="/dashboard" element={<ProtectedRoute><DealerRoute><Dashboard /></DealerRoute></ProtectedRoute>} />
            <Route path="/searches" element={<ProtectedRoute><DealerRoute><Searches /></DealerRoute></ProtectedRoute>} />
            <Route path="/searches/new" element={<ProtectedRoute><DealerRoute><CreateSearch /></DealerRoute></ProtectedRoute>} />
            <Route path="/searches/:id/edit" element={<ProtectedRoute><DealerRoute><CreateSearch /></DealerRoute></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><DealerRoute><AlertHistory /></DealerRoute></ProtectedRoute>} />
            <Route path="/isv" element={<ProtectedRoute><DealerRoute><IsvCalculator /></DealerRoute></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><DealerRoute><Settings /></DealerRoute></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/stands" element={<AdminRoute><AdminStands /></AdminRoute>} />
            <Route path="/admin/billing" element={<AdminRoute><AdminBilling /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
            <Route path="/admin/feedback" element={<AdminRoute><AdminFeedback /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AlertsProvider>
      </ToastProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
