import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

type ToastTone = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => undefined });

const DURATION_MS = 3600;

/** Fornece notificações rápidas no topo da tela (ex.: "Você saiu da conta de Ana"). */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    counter.current += 1;
    const id = counter.current;
    setItems((current) => [...current.slice(-2), { id, message, tone }]);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {items.map((item) => <ToastCard key={item.id} item={item} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
};

const ICONS: Record<ToastTone, React.ReactNode> = {
  info: <Info size={17} aria-hidden="true" />,
  success: <CircleCheck size={17} aria-hidden="true" />,
  error: <CircleAlert size={17} aria-hidden="true" />,
};

const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: number) => void }> = ({ item, onDismiss }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(item.id), DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [item.id, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[item.tone]}`} role={item.tone === 'error' ? 'alert' : 'status'}>
      <span className={styles.icon}>{ICONS[item.tone]}</span>
      <span className={styles.message}>{item.message}</span>
      <button type="button" className={styles.close} onClick={() => onDismiss(item.id)} aria-label="Fechar aviso">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
};

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

export default ToastProvider;
