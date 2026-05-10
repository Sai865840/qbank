import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Dumbbell,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/questions', icon: Database, label: 'Question Bank' },
  { path: '/practice', icon: Dumbbell, label: 'Practice' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  return (
    <>
      {mobileOpen && <div className={styles.mobileOverlay} onClick={onMobileClose} />}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Sparkles size={22} />
          </div>
          <span className={styles.logoText}>Quizwix</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navSectionTitle}>Menu</span>
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={onMobileClose}
              >
                <Icon className={styles.navLinkIcon} size={20} />
                <span className={styles.navLinkText}>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className={styles.collapseBtn}>
          <button
            className={styles.collapseToggle}
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
}
