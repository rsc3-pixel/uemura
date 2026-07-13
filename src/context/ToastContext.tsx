import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ToastMessage } from '../components/Toast';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (texto: string, tipo?: ToastMessage['tipo'], titulo?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Contador simples para gerar ids unicos sem depender de Date.now() em cada chamada.
let contador = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((texto: string, tipo: ToastMessage['tipo'] = 'info', titulo?: string) => {
    contador += 1;
    const id = `toast-${contador}`;
    setToasts((prev) => [...prev, { id, texto, tipo, titulo }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};
