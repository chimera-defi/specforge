import { useEffect, useState } from "react";

export type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
};

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast["type"] = "info", duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, message, type, duration };
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ToastContainer = () => {
    if (toasts.length === 0) return null;

    return (
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#dc2626" : "#3b82f6",
              color: "white",
              fontSize: "0.875rem",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
              animation: "slideIn 0.3s ease-out",
              minWidth: "200px",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    );
  };

  return { showToast, removeToast, ToastContainer };
}