import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? '64px' : '220px';

  return (
    <div className="app-frame">
      <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />
      <main style={{
        marginLeft: sideWidth,
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
    </div>
  );
}
