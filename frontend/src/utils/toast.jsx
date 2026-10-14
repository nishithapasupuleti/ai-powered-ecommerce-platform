// Lightweight toast notification system matching react-hot-toast API
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext(null);

let toastListeners = [];
const notify = (msg, options = {}) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { id, message: msg, type: options.type || 'blank', duration: options.duration || 3500 };
  toastListeners.forEach(listener => listener(newToast));
  return id;
};

export const toast = (msg, options) => notify(msg, { ...options, type: 'blank' });
toast.success = (msg, options) => notify(msg, { ...options, type: 'success' });
toast.error = (msg, options) => notify(msg, { ...options, type: 'error' });
toast.loading = (msg, options) => notify(msg, { ...options, type: 'loading' });

export const Toaster = ({ position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toastItem) => {
      setToasts(prev => [...prev, toastItem]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastItem.id));
      }, toastItem.duration);
    };

    toastListeners.push(handleNewToast);
    return () => {
      toastListeners = toastListeners.filter(l => l !== handleNewToast);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: position.includes('top') ? '24px' : 'auto',
      bottom: position.includes('bottom') ? '24px' : 'auto',
      right: position.includes('right') ? '24px' : 'auto',
      left: position.includes('left') ? '24px' : (position.includes('center') ? '50%' : 'auto'),
      transform: position.includes('center') ? 'translateX(-50%)' : 'none',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: '#ffffff',
            color: '#333333',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: t.type === 'error' ? '1px solid #fecaca' : t.type === 'success' ? '1px solid #bbf7d0' : '1px solid #e0e0e0',
            animation: 'slideIn 0.25s ease-out',
            pointerEvents: 'auto'
          }}
        >
          {t.type === 'success' && <span style={{ color: '#16a34a', fontSize: '1.1rem' }}>✓</span>}
          {t.type === 'error' && <span style={{ color: '#dc2626', fontSize: '1.1rem' }}>✕</span>}
          {t.type === 'loading' && <span style={{ color: '#2563eb', fontSize: '1.1rem' }}>⏳</span>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};

export default toast;
