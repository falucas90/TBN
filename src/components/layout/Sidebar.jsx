import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SieveMark } from '../ui/Logo';
import { Icon } from '../ui/Primitives';
import { getSearches } from '../../services/searchesService';
import { getAlerts } from '../../services/alertsService';
import { getCompany } from '../../services/companiesService';

export default function Sidebar() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ searches: null, alerts: null });
  const [companyName, setCompanyName] = useState(null);

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

  // Real stand name comes from companies.name (RLS-scoped), not the dropped
  // user_metadata.company. Platform admins have no company → falls back to 'Crivo'.
  useEffect(() => {
    let mounted = true;
    getCompany()
      .then(c => { if (mounted) setCompanyName(c?.name ?? null); })
      .catch(() => {});
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
  ];

  const adminItems = [
    { to: '/admin', icon: 'sparkle', label: 'Visão geral', end: true },
    { to: '/admin/stands', icon: 'car', label: 'Stands' },
    { to: '/admin/billing', icon: 'euro', label: 'Faturação' },
    { to: '/admin/logs', icon: 'clock', label: 'Logs & auditoria' },
    { to: '/admin/feedback', icon: 'chat', label: 'Feedback' },
  ];

  const isAdmin = currentUser?.role === 'admin';

  const renderItem = (it) => (
    <NavLink
      key={it.to}
      to={it.to}
      end={it.end}
      className={({ isActive }) => `side__item ${isActive ? 'side__item--active' : ''}`}
    >
      {it.icon === 'sieve'
        ? <SieveMark size={16} color="currentColor" />
        : <Icon name={it.icon} size={16} />}
      <span>{it.label}</span>
      {it.count != null && <span className="side__count">{it.count}</span>}
    </NavLink>
  );

  const fullName = currentUser?.user_metadata?.full_name || currentUser?.email || 'Utilizador';
  const company = companyName || 'Crivo';
  const initials = fullName.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <aside className="side">
      <div className="side__brand">
        <SieveMark size={22} color="var(--bone)" />
        <span className="side__brand-word">CRIVO</span>
      </div>
      <nav className="side__nav">
        {items.map(renderItem)}
        {isAdmin && (
          <>
            <div className="side__section">
              <span>Admin</span>
            </div>
            {adminItems.map(renderItem)}
          </>
        )}
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
