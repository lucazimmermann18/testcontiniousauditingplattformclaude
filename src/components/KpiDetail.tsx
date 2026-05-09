"use client";
import { useState, useEffect, useCallback } from "react";
import type { Kpi } from "@/types";
import { AREAS, QUARTERS, CURRENT_QUARTER } from "@/data/audit-data";
import { StatusPill } from "@/components/ui/StatusDot";
import { Sparkline } from "@/components/ui/Sparkline";
import { RiskBars } from "@/components/ui/RiskBars";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";

type Tab = "agent" | "comments" | "tasks" | "approval" | "history";

// ─── Agent Report (static summary) ──────────────────────────

function AgentReport({ kpi }: { kpi: Kpi }) {
  const summaryText =
    kpi.status === "finding"
      ? `${kpi.agent} hat ${kpi.value} Auffälligkeiten identifiziert (${kpi.delta}). Schwellenwerte auf Hochrisiko-Konten wurden überschritten. Empfehlung: Finding bestätigen und Maßnahmen einleiten.`
      : kpi.status === "review"
      ? `Aktueller Wert: ${kpi.value} (${kpi.delta}). Der Agent hat Auffälligkeiten erkannt, bittet aber bei ${Math.round(kpi.confidence * 100)}% Konfidenz um menschliche Bewertung.`
      : kpi.status === "ok"
      ? `Kennzahl im erwarteten Korridor. ${Math.round(kpi.confidence * 100)}% der Datensätze geprüft — keine wesentlichen Beanstandungen. Empfehlung: freigeben.`
      : `Agent prüft aktuell. Datensammlung läuft.`;

  return (
    <div className="agent-report">
      <div className="ar-head">
        <div className="ar-agent">
          <div className="ar-agent-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="ar-agent-name">{kpi.agent}</div>
            <div className="ar-agent-sub">Letzter Lauf: {kpi.lastRun}</div>
          </div>
        </div>
      </div>
      <div className={`ar-summary ar-${kpi.status}`}>
        <div className="ar-summary-label">Agent-Einschätzung</div>
        <p className="ar-summary-text">{summaryText}</p>
      </div>
      <div className="ar-kpi-details">
        <div className="ar-detail-row"><span>Aktueller Wert</span><strong>{kpi.value}</strong></div>
        <div className="ar-detail-row"><span>Veränderung</span><strong>{kpi.delta}</strong></div>
        <div className="ar-detail-row"><span>Konfidenz</span><Confidence value={kpi.confidence} /></div>
        <div className="ar-detail-row"><span>Risiko</span><RiskBars risk={kpi.risk} /></div>
      </div>
    </div>
  );
}

// ─── Comments ────────────────────────────────────────────────

interface DbComment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null; role: string };
}

function CommentsTab({ kpiId }: { kpiId: string }) {
  const [comments, setComments] = useState<DbComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/kpis/${kpiId}/comments`);
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }, [kpiId]);

  useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/kpis/${kpiId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      setText("");
      await load();
    }
    setSubmitting(false);
  }

  if (loading) return <div className="tab-empty">Laden…</div>;

  return (
    <div className="comments">
      <div className="comments-list">
        {comments.length === 0 && <div className="tab-empty">Noch keine Kommentare. Starte die Diskussion.</div>}
        {comments.map((c) => {
          const initials = c.author.avatar ?? c.author.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const time = new Date(c.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          const roleLabel: Record<string, string> = { head_of_audit: "Head of Audit", owner: "Owner", reviewer: "Reviewer", admin: "Admin" };
          return (
            <div key={c.id} className="comment">
              <div className="comment-avatar">{initials}</div>
              <div className="comment-body">
                <div className="comment-head">
                  <span className="comment-author">{c.author.name}</span>
                  <span className="comment-role">{roleLabel[c.author.role] ?? c.author.role}</span>
                  <span className="comment-time">{time}</span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="comment-input-wrap">
        <textarea
          className="comment-input"
          placeholder="Kommentar hinzufügen… (@name für Mentions)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
        />
        <button className="btn btn-primary" onClick={submit} disabled={submitting || !text.trim()}>
          {submitting ? "Senden…" : "Absenden"}
        </button>
      </div>
    </div>
  );
}

// ─── Tasks ───────────────────────────────────────────────────

interface DbTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
  assignee: { id: string; name: string; avatar: string | null };
  createdBy: { id: string; name: string; avatar: string | null };
}

interface DbUser { id: string; name: string; avatar: string | null; role: string; }

const PRIORITY_COLOR: Record<string, string> = {
  critical: "var(--alert)", high: "var(--warn)", medium: "var(--info)", low: "var(--ink-3)"
};
const STATUS_LABEL: Record<string, string> = {
  open: "Offen", in_progress: "In Bearbeitung", done: "Erledigt", cancelled: "Abgebrochen"
};

function TasksTab({ kpiId }: { kpiId: string }) {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", assigneeId: "", priority: "medium", dueDate: "" });

  const load = useCallback(async () => {
    const [tRes, uRes] = await Promise.all([
      fetch(`/api/tasks?kpiId=${kpiId}`),
      fetch("/api/users"),
    ]);
    if (tRes.ok) setTasks(await tRes.json());
    if (uRes.ok) setUsers(await uRes.json());
    setLoading(false);
  }, [kpiId]);

  useEffect(() => { load(); }, [load]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.assigneeId) return;
    setCreating(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, kpiId }),
    });
    setForm({ title: "", assigneeId: "", priority: "medium", dueDate: "" });
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

  if (loading) return <div className="tab-empty">Laden…</div>;

  return (
    <div className="tasks-tab">
      <div className="tasks-list">
        {tasks.length === 0 && <div className="tab-empty">Keine Aufgaben für diesen KPI.</div>}
        {tasks.map((t) => (
          <div key={t.id} className={`task-item task-${t.status}`}>
            <div className="task-head">
              <span className="task-priority-dot" style={{ background: PRIORITY_COLOR[t.priority] }} />
              <span className="task-title">{t.title}</span>
              <select
                className="task-status-select"
                value={t.status}
                onChange={(e) => updateStatus(t.id, e.target.value)}
              >
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="task-meta">
              <span>Zugewiesen: {t.assignee.name}</span>
              {t.dueDate && <span>Fällig: {new Date(t.dueDate).toLocaleDateString("de-DE")}</span>}
              {t.completedAt && <span>✓ {new Date(t.completedAt).toLocaleDateString("de-DE")}</span>}
            </div>
          </div>
        ))}
      </div>

      <form className="task-create-form" onSubmit={createTask}>
        <div className="task-form-title">Neue Aufgabe</div>
        <input
          className="task-input"
          placeholder="Titel der Aufgabe…"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <div className="task-form-row">
          <select
            className="task-input task-select"
            value={form.assigneeId}
            onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
            required
          >
            <option value="">Zuweisen an…</option>
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
        <button type="submit" className="btn btn-primary" disabled={creating}>
          {creating ? "Erstellen…" : "Aufgabe erstellen"}
        </button>
      </form>
    </div>
  );
}

// ─── Approval Workflow ───────────────────────────────────────

interface ApprovalRecord {
  id: string;
  status: string;
  reviewerNote?: string;
  reviewedAt?: string;
  headAuditorNote?: string;
  headApprovedAt?: string;
  period: string;
}

function ApprovalTab({ kpiId, me }: { kpiId: string; me: { role: string } | null }) {
  const [approval, setApproval] = useState<ApprovalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/kpis/${kpiId}/approve`);
    if (res.ok) setApproval(await res.json());
    setLoading(false);
  }, [kpiId]);

  useEffect(() => { load(); }, [load]);

  async function act(action: string) {
    setActing(true);
    await fetch(`/api/kpis/${kpiId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setNote("");
    await load();
    setActing(false);
  }

  const role = me?.role ?? "";
  const canReview = role === "reviewer" || role === "head_of_audit" || role === "admin";
  const canHeadApprove = role === "head_of_audit" || role === "admin";

  const STEP_LABELS: Record<string, string> = {
    pending: "Ausstehend",
    reviewer_approved: "Reviewer freigegeben",
    head_approved: "Endgültig freigegeben ✓",
    rejected: "Abgelehnt",
  };
  const STEP_COLOR: Record<string, string> = {
    pending: "var(--ink-3)",
    reviewer_approved: "var(--warn)",
    head_approved: "var(--ok)",
    rejected: "var(--alert)",
  };

  if (loading) return <div className="tab-empty">Laden…</div>;

  const status = approval?.status ?? "pending";

  return (
    <div className="approval-tab">
      <div className="approval-workflow">
        <div className={`approval-step${status !== "pending" ? " done" : " current"}`}>
          <div className="appr-step-num">1</div>
          <div>
            <div className="appr-step-label">Reviewer-Freigabe</div>
            {approval?.reviewedAt && (
              <div className="appr-step-meta">
                {new Date(approval.reviewedAt).toLocaleString("de-DE")}
                {approval.reviewerNote && <div className="appr-note">„{approval.reviewerNote}"</div>}
              </div>
            )}
          </div>
        </div>
        <div className="appr-connector" />
        <div className={`approval-step${status === "head_approved" || status === "rejected" ? " done" : status === "reviewer_approved" ? " current" : ""}`}>
          <div className="appr-step-num">2</div>
          <div>
            <div className="appr-step-label">Head-of-Audit Endfreigabe</div>
            {approval?.headApprovedAt && (
              <div className="appr-step-meta">
                {new Date(approval.headApprovedAt).toLocaleString("de-DE")}
                {approval.headAuditorNote && <div className="appr-note">„{approval.headAuditorNote}"</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="approval-status-pill" style={{ color: STEP_COLOR[status] }}>
        Status: {STEP_LABELS[status]}
      </div>

      {status !== "head_approved" && status !== "rejected" && (
        <div className="approval-actions">
          <textarea
            className="comment-input"
            placeholder="Optionale Notiz…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="approval-btns">
            {canReview && status === "pending" && (
              <button className="btn btn-secondary" onClick={() => act("reviewer_approve")} disabled={acting}>
                ✓ Reviewer-Freigabe erteilen
              </button>
            )}
            {canHeadApprove && status === "reviewer_approved" && (
              <button className="btn btn-primary" onClick={() => act("head_approve")} disabled={acting}>
                ✓ Endgültig freigeben
              </button>
            )}
            {(canReview || canHeadApprove) && status !== "pending" && (
              <button className="btn btn-ghost" onClick={() => act("reject")} disabled={acting}>
                Ablehnen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────

function HistoryView({ kpi }: { kpi: Kpi }) {
  const rows = QUARTERS.map((q, i) => ({
    quarter: q, value: kpi.trend[i] ?? "—",
    status: i === QUARTERS.length - 1 ? kpi.status : "ok",
  })).reverse();
  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead><tr><th>Quartal</th><th>Wert</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i === 0 ? "history-current" : ""}>
              <td>{r.quarter}{i === 0 ? " (aktuell)" : ""}</td>
              <td className="tabular">{r.value}</td>
              <td><StatusPill status={r.status as any} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "agent",    label: "KI-Agent" },
  { id: "comments", label: "Diskussion" },
  { id: "tasks",    label: "Aufgaben" },
  { id: "approval", label: "Freigabe" },
  { id: "history",  label: "Historie" },
];

export function KpiDetail({
  kpi,
  onClose,
  onAction,
  me,
}: {
  kpi: Kpi;
  onClose: () => void;
  onAction: (action: string, kpi: Kpi) => void;
  me: { id: string; name: string; role: string; avatar: string | null } | null;
}) {
  const area = AREAS.find((a) => a.id === kpi.area);
  const [tab, setTab] = useState<Tab>("agent");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <header className="kd-head">
          <div className="kd-head-l">
            <div className="kd-breadcrumb">
              <AreaTag areaId={kpi.area} />
              <span>{area?.name}</span>
              <span className="bc-sep">/</span>
              <span className="kd-code">{kpi.code}</span>
            </div>
            <h2 className="kd-title">{kpi.title}</h2>
            <p className="kd-desc">{kpi.desc}</p>
          </div>
          <div className="kd-head-r">
            <StatusPill status={kpi.status} />
            <div className="kd-meta-grid">
              <div><span className="kd-meta-l">Owner</span><span className="kd-meta-v">{kpi.owner}</span></div>
              <div><span className="kd-meta-l">Reviewer</span><span className="kd-meta-v">{kpi.reviewer}</span></div>
              <div><span className="kd-meta-l">Risiko</span><span className="kd-meta-v"><RiskBars risk={kpi.risk} /></span></div>
              <div><span className="kd-meta-l">Quartal</span><span className="kd-meta-v">{CURRENT_QUARTER}</span></div>
            </div>
          </div>
        </header>

        <div className="kd-numbers">
          <div className="kd-num">
            <div className="kd-num-label">Aktueller Wert</div>
            <div className="kd-num-value">{kpi.value}</div>
            <div className="kd-num-delta">{kpi.delta}</div>
          </div>
          <div className="kd-num">
            <div className="kd-num-label">8-Quartale Trend</div>
            <Sparkline data={kpi.trend.filter((v) => v !== 0)} status={kpi.status} width={220} height={56} />
            <div className="kd-num-q">{QUARTERS[0]} → {CURRENT_QUARTER}</div>
          </div>
          <div className="kd-num">
            <div className="kd-num-label">KI-Konfidenz</div>
            <Confidence value={kpi.confidence} />
            <div className="kd-num-q">Agent: {kpi.agent}</div>
          </div>
          <div className="kd-num">
            <div className="kd-num-label">Letzter Lauf</div>
            <div className="kd-num-value-sm">{kpi.lastRun}</div>
            <button className="btn-link" onClick={() => onAction("rerun", kpi)}>Erneut prüfen ↻</button>
          </div>
        </div>

        <div className="kd-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`kd-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="kd-body">
          {tab === "agent"    && <AgentReport kpi={kpi} />}
          {tab === "comments" && <CommentsTab kpiId={kpi.id} />}
          {tab === "tasks"    && <TasksTab kpiId={kpi.id} />}
          {tab === "approval" && <ApprovalTab kpiId={kpi.id} me={me} />}
          {tab === "history"  && <HistoryView kpi={kpi} />}
        </div>

        <footer className="kd-actions">
          <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-secondary" onClick={() => onAction("snooze", kpi)}>Auf Reviewer eskalieren</button>
          <button className="btn btn-secondary" onClick={() => onAction("finding", kpi)}>Finding anlegen</button>
          <button className="btn btn-primary" onClick={() => onAction("approve", kpi)}>Als geprüft freigeben</button>
        </footer>
      </div>
    </div>
  );
}
