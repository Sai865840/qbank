import styles from './Button.module.css';

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  iconOnly = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'small' && styles.small,
    size === 'large' && styles.large,
    fullWidth && styles.fullWidth,
    iconOnly && styles.iconOnly,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
