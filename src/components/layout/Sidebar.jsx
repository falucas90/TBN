import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, LogOut, Car, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const width = isCollapsed ? '80px' : '240px';

  const navItems = [
    { to: '/searches', icon: Search, label: 'Pesquisas' },
    { to: '/alerts', icon: Bell, label: 'Alertas' },
    { to: '/settings', icon: Settings, label: 'Definições' },
    ...(currentUser?.role === 'admin' ? [{ to: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <aside style={{
      width,
      backgroundColor: 'var(--color-bg-sidebar)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      transition: 'width 0.3s ease',
      overflowX: 'hidden'
    }}>
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            minWidth: '32px', height: '32px', borderRadius: '8px', 
            backgroundColor: 'var(--color-primary-teal)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <Car size={18} />
          </div>
          {!isCollapsed && <span className="font-bold text-lg">Crivo</span>}
        </div>
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: isCollapsed ? '1rem 0.5rem' : '1rem' }}>
        {isCollapsed && (
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button 
              onClick={() => setIsCollapsed(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
            >
               <ChevronRight size={20} />
            </button>
          </div>
        )}
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink 
                to={item.to}
                style={({isActive}) => ({
                  display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '0.75rem', padding: '0.75rem',
                  borderRadius: 'var(--radius-input)', textDecoration: 'none',
                  color: isActive ? 'var(--color-primary-teal-dark)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-primary-teal-light)' : 'transparent',
                  fontWeight: isActive ? '600' : '500'
                })}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
            padding: '0.75rem', background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: '500',
            borderRadius: 'var(--radius-input)',
            justifyContent: isCollapsed ? 'center' : 'flex-start'
          }}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
