import React, { useState, useCallback } from "react";
import Toast from "./Toast";

export interface ToastItem {
  id: number;
  message: string;
  type?: "success" | "error";
  duration?: number;
}

interface ToastManagerContextProps {
  showToast: (message: string, type?: "success" | "error", duration?: number) => void;
}

export const ToastManagerContext = React.createContext<ToastManagerContextProps | undefined>(undefined);

let toastId = 0;

export const ToastManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" = "success", duration: number = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastManagerContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999, display: "flex", flexDirection: "column-reverse", gap: "0.5em" }}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastManagerContext.Provider>
  );
};
