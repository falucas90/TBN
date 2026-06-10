import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Bell, Calculator, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertsContext';

export default function MobileNav() {
  const { logout, currentUser } = useAuth();
  const { unreadCount } = useAlerts();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/searches', icon: Search, label: 'Pesquisas' },
    { to: '/alerts', icon: Bell, label: 'Alertas' },
    { to: '/isv', icon: Calculator, label: 'ISV' },
    { to: '/settings', icon: Settings, label: 'Definições' },
    ...(currentUser?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <nav className="mobile-nav">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `mobile-nav__item${isActive ? ' mobile-nav__item--active' : ''}`}
          style={{ position: 'relative' }}
        >
          <item.icon size={18} />
          <span>{item.label}</span>
          {item.to === '/alerts' && unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: 'calc(50% - 18px)',
              minWidth: '15px',
              height: '15px',
              padding: '0 4px',
              borderRadius: '999px',
              backgroundColor: 'var(--emerald)',
              color: '#fff',
              fontSize: '9px',
              fontWeight: '600',
              lineHeight: '15px',
              textAlign: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      ))}
      <button className="mobile-nav__item" onClick={handleLogout} aria-label="Sair">
        <LogOut size={18} />
        <span>Sair</span>
      </button>
    </nav>
  );
}
