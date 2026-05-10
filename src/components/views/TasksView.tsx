"use client";
import { useState, useEffect, useCallback } from "react";

interface DbTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  kpi?: { id: string; code: string; title: string } | null;
  finding?: { id: string; title: string } | null;
  assignee: { id: string; name: string; avatar: string | null };
  createdBy: { id: string; name: string; avatar: string | null };
}

interface DbUser { id: string; name: string; avatar: string | null; role: string; }

const PRIORITY_COLOR: Record<string, string> = {
  critical: "var(--alert)", high: "var(--warn)", medium: "var(--info)", low: "var(--ink-3)",
};
const PRIORITY_LABEL: Record<string, string> = {
  critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Offen", in_progress: "In Bearbeitung", done: "Erledigt", cancelled: "Abgebrochen",
};
const STATUS_COLOR: Record<string, string> = {
  open: "var(--ink-3)", in_progress: "var(--info)", done: "var(--ok)", cancelled: "var(--ink-4)",
};

type FilterStatus = "all" | "open" | "in_progress" | "done";
type FilterPriority = "all" | "critical" | "high" | "medium" | "low";

export function TasksView() {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [filterMine, setFilterMine] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", assigneeId: "", priority: "medium", dueDate: "",
  });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    const [tRes, uRes, meRes] = await Promise.all([
      fetch(`/api/tasks?${params}`),
      fetch("/api/users"),
      fetch("/api/me"),
    ]);
    if (tRes.ok) setTasks(await tRes.json());
    if (uRes.ok) setUsers(await uRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setMeId(me.id ?? null);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.assigneeId) return;
    setCreating(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", description: "", assigneeId: "", priority: "medium", dueDate: "" });
    setShowForm(false);
    await load();
    setCreating(false);
  }

  async function updateStatus(taskId: string, status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    await load();
  }

  const filtered = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterMine && t.assignee.id !== meId) return false;
    return true;
  });

  const grouped: Record<string, DbTask[]> = {
    open: filtered.filter((t) => t.status === "open"),
    in_progress: filtered.filter((t) => t.status === "in_progress"),
    done: filtered.filter((t) => t.status === "done"),
    cancelled: filtered.filter((t) => t.status === "cancelled"),
  };

  const totalOpen = tasks.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const totalDone = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="tasks-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Aufgaben</h2>
          <p className="view-sub">
            {totalOpen} offen · {totalDone} erledigt
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Abbrechen" : "+ Neue Aufgabe"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form className="task-create-panel" onSubmit={createTask}>
          <div className="tcp-title">Neue Aufgabe erstellen</div>
          <input
            className="task-input"
            placeholder="Titel der Aufgabe *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
          <textarea
            className="task-input"
            placeholder="Beschreibung (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
          <div className="task-form-row">
            <select
              className="task-input task-select"
              value={form.assigneeId}
              onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
              required
            >
              <option value="">Zuweisen an… *</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select
              className="task-input task-select"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="critical">Kritisch</option>
            </select>
            <input
              className="task-input"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Erstellen…" : "Aufgabe erstellen"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="tasks-filters">
        <div className="filter-group">
          <button
            className={`filter-chip${filterMine ? " active" : ""}`}
            onClick={() => setFilterMine((v) => !v)}
          >
            Nur meine
          </button>
          {(["all", "open", "in_progress", "done"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              className={`filter-chip${filterStatus === s ? " active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === "all" ? "Alle Status" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="filter-group">
          {(["all", "critical", "high", "medium", "low"] as FilterPriority[]).map((p) => (
            <button
              key={p}
              className={`filter-chip${filterPriority === p ? " active" : ""}`}
              onClick={() => setFilterPriority(p)}
              style={p !== "all" && filterPriority === p ? { borderColor: PRIORITY_COLOR[p] } : {}}
            >
              {p === "all" ? "Alle Prioritäten" : PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="tab-empty">Aufgaben werden geladen…</div>
      ) : filtered.length === 0 ? (
        <div className="tab-empty">Keine Aufgaben gefunden.</div>
      ) : (
        <div className="tasks-kanban">
          {(["open", "in_progress", "done"] as const).map((col) => {
            const colTasks = grouped[col] ?? [];
            return (
              <div key={col} className="tasks-column">
                <div className="tasks-col-head">
                  <span
                    className="tasks-col-dot"
                    style={{ background: STATUS_COLOR[col] }}
                  />
                  <span className="tasks-col-label">{STATUS_LABEL[col]}</span>
                  <span className="tasks-col-count">{colTasks.length}</span>
                </div>
                <div className="tasks-col-body">
                  {colTasks.length === 0 && (
                    <div className="tasks-empty-col">Keine Aufgaben</div>
                  )}
                  {colTasks.map((t) => (
                    <div key={t.id} className={`task-card task-card-${t.priority}`}>
                      <div className="task-card-head">
                        <span
                          className="task-priority-badge"
                          style={{ background: PRIORITY_COLOR[t.priority] + "22", color: PRIORITY_COLOR[t.priority] }}
                        >
                          {PRIORITY_LABEL[t.priority]}
                        </span>
                        <button
                          className="task-delete-btn"
                          onClick={() => deleteTask(t.id)}
                          title="Löschen"
                        >×</button>
                      </div>
                      <div className="task-card-title">{t.title}</div>
                      {t.description && (
                        <div className="task-card-desc">{t.description}</div>
                      )}
                      {t.kpi && (
                        <div className="task-card-kpi">KPI: {t.kpi.code}</div>
                      )}
                      <div className="task-card-meta">
                        <span className="task-card-assignee">
                          <span className="task-avatar">
                            {(t.assignee.avatar ?? t.assignee.name.slice(0, 1)).toUpperCase()}
                          </span>
                          {t.assignee.name}
                        </span>
                        {t.dueDate && (
                          <span className="task-card-due">
                            {new Date(t.dueDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <div className="task-card-actions">
                        {col === "open" && (
                          <button
                            className="btn-link task-action"
                            onClick={() => updateStatus(t.id, "in_progress")}
                          >
                            → In Bearbeitung
                          </button>
                        )}
                        {col === "in_progress" && (
                          <button
                            className="btn-link task-action"
                            onClick={() => updateStatus(t.id, "done")}
                          >
                            ✓ Erledigen
                          </button>
                        )}
                        {col === "done" && (
                          <button
                            className="btn-link task-action"
                            onClick={() => updateStatus(t.id, "open")}
                          >
                            ↩ Wieder öffnen
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
