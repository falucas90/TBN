import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useMediaQuery } from '../../lib/useMediaQuery';

export default function AppLayout({ children }) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return (
      <div className="app app--mobile">
        {children}
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      {children}
    </div>
  );
}
