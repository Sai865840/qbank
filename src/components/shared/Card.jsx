import styles from './Card.module.css';

export function Card({
  children,
  hoverable = false,
  clickable = false,
  noPadding = false,
  compact = false,
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    styles.card,
    hoverable && styles.hoverable,
    clickable && styles.clickable,
    noPadding && styles.noPadding,
    compact && styles.compact,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}
