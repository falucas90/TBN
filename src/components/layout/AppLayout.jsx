import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-frame">
      <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />
      <main style={{
        marginLeft: collapsed ? '80px' : '240px',
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        width: '100%',
      }}>
        {children}
      </main>
    </div>
  );
}
