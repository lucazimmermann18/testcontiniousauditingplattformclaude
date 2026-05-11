"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Kpi } from "@/types";
import type { AgentResult } from "@/lib/agents/types";
import { AREAS, QUARTERS, CURRENT_QUARTER } from "@/data/audit-data";
import { StatusPill } from "@/components/ui/StatusDot";
import { Sparkline } from "@/components/ui/Sparkline";
import { RiskBars } from "@/components/ui/RiskBars";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";
import { AgentResultDisplay } from "@/components/ui/AgentResultDisplay";
import { TabSkeleton, EmptyState } from "@/components/ui/EmptyState";

type Tab = "agent" | "comments" | "tasks" | "approval" | "history";

// ─── Agent Report (real data) ────────────────────────────────

interface LastRun {
  id: string;
  status: string;
  confidence: number;
  summary: string | null;
  rawOutput: string | null;
  finishedAt: string | null;
  durationMs: number | null;
}

function AgentReport({ kpi, onKpiUpdated }: { kpi: Kpi; onKpiUpdated?: () => void }) {
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);
  const [editingValues, setEditingValues] = useState(false);
  const [value, setValue] = useState(kpi.value);
  const [delta, setDelta] = useState(kpi.delta);
  const [savingValues, setSavingValues] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${kpi.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { setLastRun(data); setLoadingRun(false); });
  }, [kpi.id]);

  const result = useMemo<AgentResult | null>(() => {
    if (!lastRun?.rawOutput) return null;
    try {
      const m = lastRun.rawOutput.match(/\{[\s\S]*\}/);
      return m ? (JSON.parse(m[0]) as AgentResult) : null;
    } catch { return null; }
  }, [lastRun]);

  async function saveValues() {
    setSavingValues(true);
    await fetch(`/api/kpis/${kpi.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, delta }),
    });
    setSavingValues(false);
    setEditingValues(false);
    onKpiUpdated?.();
  }

  const runTime = lastRun?.finishedAt
    ? new Date(lastRun.finishedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : kpi.lastRun;

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
            <div className="ar-agent-sub">Letzter Lauf: {runTime}</div>
          </div>
        </div>
        {lastRun && !loadingRun && (
          <div className={`agent-result-badge agent-result-${lastRun.status}`}>
            {lastRun.status === "ok" ? "✓ OK" : lastRun.status === "review" ? "⚠ Review" : lastRun.status === "finding" ? "⛔ Finding" : lastRun.status}
          </div>
        )}
      </div>

      {/* Real agent result or fallback */}
      {loadingRun ? (
        <div className="tab-empty">Lade letzten Agent-Lauf…</div>
      ) : !lastRun ? (
        <div className="ar-no-run">
          Noch kein Agent-Lauf für diesen KPI. Starte den Agenten im Tab <strong>KI-Agenten</strong> oder klicke auf <em>Erneut prüfen</em>.
        </div>
      ) : result ? (
        <AgentResultDisplay result={result} />
      ) : (
        <div className={`ar-summary ar-${lastRun.status}`}>
          <div className="ar-summary-label">Agent-Einschätzung</div>
          <p className="ar-summary-text">{lastRun.summary ?? "Keine Zusammenfassung verfügbar."}</p>
        </div>
      )}

      {/* KPI values — editable */}
      <div className="ar-kpi-details" style={{ marginTop: "1.25rem" }}>
        <div className="ar-detail-row">
          <span>Aktueller Wert</span>
          {editingValues
            ? <input className="ar-value-input" value={value} onChange={(e) => setValue(e.target.value)} />
            : <strong>{kpi.value}</strong>}
        </div>
        <div className="ar-detail-row">
          <span>Veränderung</span>
          {editingValues
            ? <input className="ar-value-input" value={delta} onChange={(e) => setDelta(e.target.value)} />
            : <strong>{kpi.delta}</strong>}
        </div>
        <div className="ar-detail-row"><span>Konfidenz</span><Confidence value={kpi.confidence} /></div>
        <div className="ar-detail-row"><span>Risiko</span><RiskBars risk={kpi.risk} /></div>
        <div className="ar-detail-row">
          {editingValues ? (
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "4px 12px" }} onClick={saveValues} disabled={savingValues}>
                {savingValues ? "Speichern…" : "Speichern"}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "4px 12px" }} onClick={() => { setValue(kpi.value); setDelta(kpi.delta); setEditingValues(false); }}>
                Abbrechen
              </button>
            </div>
          ) : (
            <button className="btn-link" style={{ fontSize: "0.8rem" }} onClick={() => setEditingValues(true)}>
              Werte bearbeiten ✎
            </button>
          )}
        </div>
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

interface MentionUser { id: string; name: string; avatar: string | null; }

function renderCommentText(text: string) {
  const parts = text.split(/(@\w[\w\s]*\b)/g);
  return parts.map((part, i) =>
    part.startsWith("@")
      ? <span key={i} className="comment-mention">{part}</span>
      : part
  );
}

function CommentsTab({ kpiId }: { kpiId: string }) {
  const [comments, setComments] = useState<DbComment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<MentionUser[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionIdx, setMentionIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/kpis/${kpiId}/comments`);
    if (res.ok) setComments(await res.json());
    setLoading(false);
  }, [kpiId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/users").then((r) => r.ok ? r.json() : []).then(setAllUsers);
  }, []);

  const mentionMatches = mentionQuery !== null
    ? allUsers.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    const pos = e.target.selectionStart ?? val.length;
    setText(val);

    // Find @ trigger
    const before = val.slice(0, pos);
    const atMatch = before.match(/@([\w\s]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionStart(pos - atMatch[0].length);
      setMentionIdx(0);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(user: MentionUser) {
    const after = text.slice(mentionStart + (mentionQuery?.length ?? 0) + 1);
    const newText = text.slice(0, mentionStart) + `@${user.name} ` + after;
    setText(newText);
    setMentionQuery(null);
    textareaRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && mentionMatches.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx((i) => Math.min(i + 1, mentionMatches.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIdx((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(mentionMatches[mentionIdx]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
  }

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/kpis/${kpiId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) { setText(""); setMentionQuery(null); await load(); }
    setSubmitting(false);
  }

  if (loading) return <TabSkeleton rows={4} />;

  const roleLabel: Record<string, string> = { head_of_audit: "Head of Audit", owner: "Owner", reviewer: "Reviewer", admin: "Admin" };

  return (
    <div className="comments">
      <div className="comments-list">
        {comments.length === 0 && <EmptyState compact icon="💬" title="Noch keine Kommentare" sub="Starte die Diskussion unten." />}
        {comments.map((c) => {
          const initials = c.author.avatar ?? c.author.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const time = new Date(c.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
          return (
            <div key={c.id} className="comment">
              <div className="comment-avatar">{initials}</div>
              <div className="comment-body">
                <div className="comment-head">
                  <span className="comment-author">{c.author.name}</span>
                  <span className="comment-role">{roleLabel[c.author.role] ?? c.author.role}</span>
                  <span className="comment-time">{time}</span>
                </div>
                <div className="comment-text">{renderCommentText(c.text)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="comment-input-wrap" style={{ position: "relative" }}>
        {/* @mention dropdown */}
        {mentionQuery !== null && mentionMatches.length > 0 && (
          <div className="mention-dropdown">
            {mentionMatches.map((u, i) => {
              const initials = u.avatar ?? u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <button
                  key={u.id}
                  className={`mention-item${i === mentionIdx ? " mention-item-active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                >
                  <span className="mention-avatar">{initials}</span>
                  <span className="mention-name">{u.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="comment-input"
          placeholder="Kommentar hinzufügen… @Name für Erwähnungen, ⌘↵ senden"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKey}
          rows={3}
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
    const [tRes, uRes] = await Promise.all([fetch(`/api/tasks?kpiId=${kpiId}`), fetch("/api/users")]);
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

  if (loading) return <TabSkeleton rows={3} />;

  return (
    <div className="tasks-tab">
      <div className="tasks-list">
        {tasks.length === 0 && <EmptyState compact icon="✅" title="Keine Aufgaben" sub="Noch keine Aufgaben für diesen KPI." />}
        {tasks.map((t) => (
          <div key={t.id} className={`task-item task-${t.status}`}>
            <div className="task-head">
              <span className="task-priority-dot" style={{ background: PRIORITY_COLOR[t.priority] }} />
              <span className="task-title">{t.title}</span>
              <select className="task-status-select" value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
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
        <input className="task-input" placeholder="Titel der Aufgabe…" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        <div className="task-form-row">
          <select className="task-input task-select" value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))} required>
            <option value="">Zuweisen an…</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="task-input task-select" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="critical">Kritisch</option>
          </select>
          <input className="task-input" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
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
    pending: "var(--ink-3)", reviewer_approved: "var(--warn)", head_approved: "var(--ok)", rejected: "var(--alert)",
  };

  if (loading) return <TabSkeleton rows={3} />;

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
          <textarea className="comment-input" placeholder="Optionale Notiz…" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
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
              <button className="btn btn-ghost" onClick={() => act("reject")} disabled={acting}>Ablehnen</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────

interface AuditRunRecord {
  id: string;
  status: string;
  confidence: number;
  summary: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
}

function HistoryView({ kpi }: { kpi: Kpi }) {
  const [runs, setRuns] = useState<AuditRunRecord[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/audit-runs?kpiId=${kpi.id}&limit=20`)
      .then((r) => r.ok ? r.json() : [])
      .then(setRuns)
      .finally(() => setLoadingRuns(false));
  }, [kpi.id]);

  const statusIcon = (s: string) =>
    s === "ok" ? "✓" : s === "finding" ? "⛔" : s === "review" ? "⚠" : s === "error" ? "✗" : "◌";

  if (loadingRuns) return <div className="tab-empty">Lade Prüfläufe…</div>;

  return (
    <div className="kpi-run-history">
      {/* Quarter trend row */}
      <div className="krh-trend-row">
        {QUARTERS.map((q, i) => (
          <div key={q} className="krh-quarter-cell">
            <div className="krh-q-label">{q}</div>
            <div className={`krh-q-bar${i === QUARTERS.length - 1 ? " krh-q-bar-current" : ""}`}
              style={{ height: `${Math.max(8, (kpi.trend[i] ?? 0) / Math.max(...kpi.trend, 1) * 48)}px` }} />
            <div className="krh-q-val">{kpi.trend[i] ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Real audit run list */}
      <div className="krh-runs-title">Agent-Läufe ({runs.length})</div>
      {runs.length === 0 && <div className="tab-empty">Noch keine Agent-Läufe aufgezeichnet.</div>}
      <div className="krh-runs">
        {runs.map((run) => {
          const dt = new Date(run.startedAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
          const dur = run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—";
          const isOpen = expanded === run.id;
          return (
            <div key={run.id} className={`krh-run krh-run-${run.status}`}>
              <div className="krh-run-head" onClick={() => setExpanded(isOpen ? null : run.id)}>
                <span className={`krh-run-icon krh-run-icon-${run.status}`}>{statusIcon(run.status)}</span>
                <span className="krh-run-dt">{dt}</span>
                <span className="krh-run-dur">{dur}</span>
                <StatusPill status={run.status as any} />
                <span className="krh-run-conf">{Math.round(run.confidence * 100)}%</span>
                <span className="krh-run-chevron">{isOpen ? "▲" : "▼"}</span>
              </div>
              {isOpen && run.summary && (
                <div className="krh-run-summary">{run.summary}</div>
              )}
            </div>
          );
        })}
      </div>
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
  onKpiUpdated,
  me,
}: {
  kpi: Kpi;
  onClose: () => void;
  onAction: (action: string, kpi: Kpi) => void;
  onKpiUpdated?: () => void;
  me: { id: string; name: string; role: string; avatar: string | null } | null;
}) {
  const area = AREAS.find((a) => a.id === kpi.area);
  const [tab, setTab] = useState<Tab>("agent");

  // Listen for quick-action tab switch (dispatched by AppShell handleQuickAction)
  useEffect(() => {
    function handler(e: CustomEvent<{ kpiId: string; tab: string }>) {
      if (e.detail.kpiId === kpi.id) setTab(e.detail.tab as Tab);
    }
    window.addEventListener("kpi-quick-tab", handler as EventListener);
    return () => window.removeEventListener("kpi-quick-tab", handler as EventListener);
  }, [kpi.id]);

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
            <button key={t.id} className={`kd-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="kd-body">
          {tab === "agent"    && <AgentReport kpi={kpi} onKpiUpdated={onKpiUpdated} />}
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
