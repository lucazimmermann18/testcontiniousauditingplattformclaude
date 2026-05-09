"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: string;
}

const TYPE_ICON: Record<string, string> = {
  comment_mention: "💬",
  task_assigned: "📋",
  task_due: "⏰",
  finding_created: "⚠",
  approval_requested: "🔔",
  approval_done: "✓",
  agent_completed: "⚡",
};

export function NotificationBell({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifications(await res.json());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        className="notif-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label="Benachrichtigungen"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span className="notif-panel-title">Benachrichtigungen</span>
            {unread > 0 && (
              <button className="btn-link" onClick={markAllRead}>Alle gelesen</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">Keine Benachrichtigungen</div>
            )}
            {notifications.map((n) => {
              const meta = n.metadata ? JSON.parse(n.metadata) : {};
              const time = new Date(n.createdAt).toLocaleString("de-DE", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
              });
              return (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? "" : " notif-unread"}`}
                  onClick={() => {
                    if (meta.kpiId) { onOpenKpi(meta.kpiId); setOpen(false); }
                  }}
                >
                  <span className="notif-icon">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="notif-content">
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{time}</div>
                  </div>
                  {!n.read && <span className="notif-dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
