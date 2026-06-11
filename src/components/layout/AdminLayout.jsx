import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SieveMark } from '../ui/Logo';
import { Icon } from '../ui/Primitives';
import '../../styles/admin.css';

function AdminSidebar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const items = [
    { to: '/admin', icon: 'sparkle', label: 'Visão geral', end: true },
    { to: '/admin/stands', icon: 'car', label: 'Stands' },
    { to: '/admin/billing', icon: 'euro', label: 'Faturação' },
    { to: '/admin/logs', icon: 'clock', label: 'Logs & auditoria' },
  ];

  const fullName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Operador';
  const initials = fullName.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="side">
      <div className="side__brand">
        <SieveMark size={22} color="var(--bone)" />
        <span className="side__brand-word">CRIVO</span>
        <span className="side__admin-tag">ADMIN</span>
      </div>
      <nav className="side__nav">
        {items.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => `side__item ${isActive ? 'side__item--active' : ''}`}
          >
            <Icon name={it.icon} size={16} />
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="side__user">
        <div className="avatar">{initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <span className="side__user-name">{fullName}</span>
          <span className="side__user-co">Operações · Crivo</span>
        </div>
        <button className="side__exit" title="Terminar sessão" aria-label="Terminar sessão" onClick={handleLogout}>
          <Icon name="logout" size={15} />
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }) {
  return (
    <div className="admin-theme">
      <div className="app">
        <AdminSidebar />
        {children}
      </div>
    </div>
  );
}
