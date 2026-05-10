import styles from './Badge.module.css';

export function Badge({
  children,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) {
  const classes = [
    styles.badge,
    styles[variant],
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
