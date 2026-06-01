import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Searches from './pages/Searches';
import CreateSearch from './pages/CreateSearch';
import AlertHistory from './pages/AlertHistory';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Searches /></ProtectedRoute>} />
            <Route path="/searches" element={<ProtectedRoute><Searches /></ProtectedRoute>} />
            <Route path="/searches/new" element={<ProtectedRoute><CreateSearch /></ProtectedRoute>} />
            <Route path="/searches/:id/edit" element={<ProtectedRoute><CreateSearch /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><AlertHistory /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
