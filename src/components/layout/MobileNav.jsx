import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileNav() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/searches', icon: Search, label: 'Pesquisas' },
    { to: '/alerts', icon: Bell, label: 'Alertas' },
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
        >
          <item.icon size={18} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <button className="mobile-nav__item" onClick={handleLogout} aria-label="Sair">
        <LogOut size={18} />
        <span>Sair</span>
      </button>
    </nav>
  );
}
