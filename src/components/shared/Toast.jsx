import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import styles from './Toast.module.css';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export function ToastContainer() {
  const { toasts } = useQuiz();

  return (
    <div className={styles.container}>
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            <Icon className={styles.icon} size={20} />
            <span className={styles.message}>{toast.message}</span>
            <button className={styles.closeBtn} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
