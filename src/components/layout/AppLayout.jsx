import React, { useState } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-frame">
      <Sidebar isCollapsed={collapsed} setIsCollapsed={setCollapsed} />
      {children}
    </div>
  );
}
