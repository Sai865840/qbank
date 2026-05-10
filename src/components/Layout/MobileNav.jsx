import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, Dumbbell, BarChart3, Settings } from 'lucide-react';
import styles from './MobileNav.module.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/questions', icon: Database, label: 'Questions' },
  { path: '/practice', icon: Dumbbell, label: 'Practice' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.items}>
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            <Icon className={styles.icon} size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
