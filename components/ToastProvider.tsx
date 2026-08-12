"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = nextId.current++;
      // Keep at most 4 toasts on screen so a burst of actions doesn't stack forever
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Full-width above the home indicator on phones, corner-docked from sm up */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-4 z-[100] flex flex-col items-stretch sm:items-end gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-0 sm:pb-0 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`pointer-events-auto flex items-center gap-3 w-full sm:w-auto sm:max-w-sm rounded-xl border bg-surface px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${
                t.variant === "error"
                  ? "border-red-500/30"
                  : "border-emerald-500/30"
              }`}
            >
              {t.variant === "error" ? (
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
              <span className="flex-1 text-sm text-secondary font-medium leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 flex items-center justify-center w-8 h-8 shrink-0 text-muted hover:text-secondary transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
