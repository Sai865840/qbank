import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ToastContainer } from '../shared';
import styles from './Layout.module.css';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.mobileHeader}>
            <button className={styles.hamburger} onClick={() => setMobileOpen(true)}>
              <Menu size={22} />
            </button>
          </div>
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <ToastContainer />
    </div>
  );
}
