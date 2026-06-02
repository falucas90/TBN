import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Searches from './pages/Searches';
import CreateSearch from './pages/CreateSearch';
import AlertHistory from './pages/AlertHistory';
import Settings from './pages/Settings';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes wrapped in AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/searches" replace />} />
              <Route path="/searches" element={<Searches />} />
              <Route path="/searches/new" element={<CreateSearch />} />
              <Route path="/searches/:id/edit" element={<CreateSearch />} />
              <Route path="/alerts" element={<AlertHistory />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
