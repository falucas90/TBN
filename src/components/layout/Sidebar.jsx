import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Wordmark, SieveMark, Icon } from '../ui/Primitives';

const navItems = [
  { to: '/searches', icon: 'search',   label: 'Pesquisas', count: 2 },
  { to: '/alerts',   icon: 'bell',     label: 'Alertas', count: 12 },
  { to: '/settings', icon: 'settings', label: 'Definições' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { logout } = useAuth();

  return (
    <aside className={`side ${collapsed ? 'side--collapsed' : ''}`}>
      <div className="side__brand">
        <SieveMark size={22} color="var(--emerald)" />
        {!collapsed && <span className="side__brand-word">Crivo</span>}
      </div>

      <nav className="side__nav">
        {navItems.map(({ to, icon, label, count }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `side__item ${isActive ? 'side__item--active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon name={icon} />
            {!collapsed && <span>{label}</span>}
            {!collapsed && count && <span className="side__count">{count}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="side__user">
        <div className="avatar">FL</div>
        {!collapsed && (
          <div className="stack">
            <span className="side__user-name">Francisco Lucas</span>
            <span className="side__user-co">Stand Marques</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--hairline)', paddingTop: '16px' }}>
        <button className="side__item" onClick={logout} style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}>
          <Icon name="arrow" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
      
      <button 
        className="side__item" 
        onClick={() => setCollapsed(!collapsed)} 
        style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', marginTop: '4px' }}
      >
        <Icon name="chevron" />
        {!collapsed && <span>Ocultar</span>}
      </button>
    </aside>
  );
}
