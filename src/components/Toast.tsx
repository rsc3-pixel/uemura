import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

export interface ToastMessage {
  id: string;
  texto: string;
  tipo?: 'info' | 'sucesso';
  titulo?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => onRemove(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className={`${styles.toastItem} ${toast.tipo === 'sucesso' ? styles.success : ''}`}
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.iconWrapper}>
        {toast.tipo === 'sucesso' ? <Bell size={18} /> : <Info size={18} />}
      </div>
      <div className={styles.messageContent}>
        <span className={styles.toastTitle}>{toast.titulo ?? 'Atualização de Pedido'}</span>
        <p className={styles.toastText}>{toast.texto}</p>
      </div>
      <button onClick={onClose} className={styles.closeBtn} aria-label="Fechar notificação">
        <X size={14} />
      </button>
    </motion.div>
  );
};
