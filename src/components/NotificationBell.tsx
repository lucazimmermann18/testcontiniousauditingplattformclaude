"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { AppEvent } from "@/lib/events";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: string;
}

const TYPE_ICON: Record<string, string> = {
  comment_mention:   "💬",
  task_assigned:     "📋",
  task_due:          "⏰",
  finding_created:   "⚠️",
  approval_requested:"🔔",
  approval_done:     "✓",
  agent_completed:   "⚡",
  agent_done:        "⚡",
  finding_new:       "⚠️",
  approval_act:      "✅",
  task_done:         "📋",
};

export function NotificationBell({ onOpenKpi }: { onOpenKpi: (id: string) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) setNotifications(await res.json());
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // SSE connection for real-time push updates
  useEffect(() => {
    function connect() {
      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      es.onopen = () => setSseConnected(true);

      es.onmessage = (e) => {
        try {
          const event: AppEvent = JSON.parse(e.data);
          if (event.type === "ping") return;

          // Reload DB notifications to get the persisted version
          load();

          // Also add an optimistic local notification immediately
          if (event.type === "agent_done") {
            const msg = `Agent fertig für ${event.kpiCode}: ${event.status === "ok" ? "✓ OK" : event.status === "finding" ? "⚠ Finding" : event.status}`;
            pushLocal("agent_done", msg, { kpiId: event.kpiId });
          } else if (event.type === "finding_new") {
            pushLocal("finding_new", `Neues Finding: ${event.title} (${event.severity})`, { kpiId: event.kpiId });
          } else if (event.type === "approval_act") {
            pushLocal("approval_act", `Freigabe-Aktion für ${event.kpiCode}: ${event.action} von ${event.actor}`, { kpiId: event.kpiId });
          }
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Reconnect after 5s
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
    };
  }, [load]);

  function pushLocal(type: string, message: string, meta?: Record<string, string>) {
    const id = `local-${Date.now()}`;
    setNotifications((prev) => [
      { id, type, message, read: false, createdAt: new Date().toISOString(), metadata: meta ? JSON.stringify(meta) : undefined },
      ...prev.slice(0, 49),
    ]);
  }

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markOneRead(id: string) {
    if (id.startsWith("local-")) {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      return;
    }
    await fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        className="notif-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label="Benachrichtigungen"
        title={sseConnected ? "Live-verbunden" : "Verbinde…"}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
        {sseConnected && <span className="notif-live-dot" title="Live" />}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span className="notif-panel-title">Benachrichtigungen</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {sseConnected && <span className="notif-sse-badge">● Live</span>}
              {unread > 0 && (
                <button className="btn-link" onClick={markAllRead}>Alle gelesen</button>
              )}
            </div>
          </div>
          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">Keine Benachrichtigungen</div>
            )}
            {notifications.map((n) => {
              const meta = n.metadata ? (() => { try { return JSON.parse(n.metadata!); } catch { return {}; } })() : {};
              const time = new Date(n.createdAt).toLocaleString("de-DE", {
                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
              });
              return (
                <div
                  key={n.id}
                  className={`notif-item${n.read ? "" : " notif-unread"}`}
                  onClick={() => {
                    markOneRead(n.id);
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
