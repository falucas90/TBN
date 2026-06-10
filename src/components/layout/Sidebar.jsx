import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SieveMark } from '../ui/Logo';
import { Icon } from '../ui/Primitives';
import { getSearches } from '../../services/searchesService';
import { getAlerts } from '../../services/alertsService';

export default function Sidebar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ searches: null, alerts: null });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getSearches().catch(() => []),
      getAlerts({ limit: 500 }).catch(() => []),
    ]).then(([searches, alerts]) => {
      if (mounted) setCounts({ searches: searches.length, alerts: alerts.length });
    });
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const items = [
    { to: '/dashboard', icon: 'sparkle', label: 'Dashboard' },
    { to: '/searches', icon: 'sieve', label: 'Pesquisas', count: counts.searches },
    { to: '/alerts', icon: 'bell', label: 'Histórico de alertas', count: counts.alerts },
    { to: '/isv', icon: 'calc', label: 'Calculadora ISV' },
    { to: '/settings', icon: 'settings', label: 'Definições' },
    ...(currentUser?.role === 'admin' ? [{ to: '/admin', icon: 'alert', label: 'Admin' }] : []),
  ];

  const fullName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Utilizador';
  const company = currentUser?.user_metadata?.company || 'Crivo';
  const initials = fullName.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="side">
      <div className="side__brand">
        <SieveMark size={22} color="var(--bone)" />
        <span className="side__brand-word">CRIVO</span>
      </div>
      <nav className="side__nav">
        {items.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `side__item ${isActive ? 'side__item--active' : ''}`}
          >
            {it.icon === 'sieve'
              ? <SieveMark size={16} color="currentColor" />
              : <Icon name={it.icon} size={16} />}
            <span>{it.label}</span>
            {it.count != null && <span className="side__count">{it.count}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="side__user">
        <div className="avatar">{initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          <span className="side__user-name">{fullName}</span>
          <span className="side__user-co">{company}</span>
        </div>
        <button className="side__exit" title="Terminar sessão" aria-label="Terminar sessão" onClick={handleLogout}>
          <Icon name="logout" size={15} />
        </button>
      </div>
    </aside>
  );
}
