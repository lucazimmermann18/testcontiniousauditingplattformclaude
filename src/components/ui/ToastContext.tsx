"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastType = "ok" | "info" | "warn" | "alert";

interface ToastEntry {
  id: number;
  msg: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (msg: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

let _id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((msg: string, type: ToastType = "ok") => {
    const id = ++_id;
    setToasts((prev) => [...prev.slice(-2), { id, msg, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  useEffect(() => {
    const t = timers.current;
    return () => { Object.values(t).forEach(clearTimeout); };
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            role="alert"
          >
            <span className="toast-dot" />
            <span className="toast-msg">{t.msg}</span>
            <button className="toast-close" aria-label="Schließen">×</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx).toast;
}
