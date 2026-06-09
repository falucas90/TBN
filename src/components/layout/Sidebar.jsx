import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SieveMark, Wordmark } from '../ui/Logo';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const width = isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)';

  const navItems = [
    { to: '/searches', icon: Search, label: 'Pesquisas' },
    { to: '/alerts', icon: Bell, label: 'Alertas' },
    { to: '/settings', icon: Settings, label: 'Definições' },
    ...(currentUser?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <aside style={{
      width,
      backgroundColor: 'var(--slate)',
      borderRight: '1px solid var(--hairline)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      transition: 'width var(--t-slow) var(--ease)',
      overflowX: 'hidden',
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: '16px 12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {isCollapsed ? (
            <SieveMark size={28} color="var(--emerald)" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SieveMark size={28} color="var(--emerald)" />
              <Wordmark size={16} />
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dust)', padding: '4px', borderRadius: 'var(--r-sm)' }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {isCollapsed && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dust)', padding: '4px', borderRadius: 'var(--r-sm)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: 'var(--r-md)',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? '500' : '400',
                  color: isActive ? 'var(--emerald)' : 'var(--ash)',
                  backgroundColor: isActive ? 'var(--emerald-12)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? 'var(--emerald)' : 'transparent'}`,
                  marginLeft: '-2px',
                  whiteSpace: 'nowrap',
                  transition: 'color var(--t-fast), background var(--t-fast)',
                })}
              >
                <item.icon size={16} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User / Logout */}
      <div style={{
        padding: '12px 8px',
        borderTop: '1px solid var(--hairline)',
      }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            width: '100%',
            padding: '9px 12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--ash)',
            fontSize: '13px',
            fontWeight: '400',
            borderRadius: 'var(--r-md)',
          }}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
