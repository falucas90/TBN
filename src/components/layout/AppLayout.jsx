import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarWidth = isCollapsed ? '80px' : '240px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg-page)' }}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main style={{ flex: 1, marginLeft: sidebarWidth, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s ease' }}>
        {children}
      </main>
    </div>
  );
}
