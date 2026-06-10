import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useMediaQuery } from '../../lib/useMediaQuery';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const sideWidth = collapsed ? '64px' : '220px';

  return (
    <div className="app-frame">
      {!isMobile && <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />}
      <main style={{
        marginLeft: isMobile ? 0 : sideWidth,
        paddingBottom: isMobile ? '60px' : 0,
        transition: 'margin-left var(--t-slow) var(--ease)',
        minHeight: '100vh',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--obsidian)',
      }}>
        {children}
      </main>
      {isMobile && <MobileNav />}
    </div>
  );
}
