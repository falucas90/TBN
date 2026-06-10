import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const sideWidth = collapsed ? '64px' : '220px';

  return (
    <div className="app-frame">
      <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />
      <main className="main-content" style={{ marginLeft: sideWidth }}>
        {children}
      </main>
    </div>
  );
}
