import React from 'react';
import styles from './Toast.module.css';
import { usePlayerContext } from '../../context/PlayerContext';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

/** Global toast notification container. */
export function ToastContainer() {
  const { toasts, removeToast } = usePlayerContext();

  return (
    <div className={styles.container} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type]}`} role="alert">
          <span className={styles.icon}>{ICONS[t.type]}</span>
          <span>{t.message}</span>
          <button className={styles.close} onClick={() => removeToast(t.id)} aria-label="Cerrar">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
