"use client";
import { useState, useEffect } from "react";
import type { Kpi, Finding } from "@/types";
import { AreaTag } from "@/components/ui/AreaTag";
import { exportFindingsExcel } from "@/lib/export";

const SEVERITY_COLOR = {
  hoch:    "var(--alert)",
  mittel:  "var(--warn)",
  niedrig: "var(--ok)",
};
const SEVERITY_BG = {
  hoch:    "var(--alert-bg)",
  mittel:  "var(--warn-bg)",
  niedrig: "var(--ok-bg)",
};

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
};

// ── Comment thread ──────────────────────────────────────────

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string; avatar: string | null };
}

function CommentThread({ kpiId }: { kpiId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/kpis/${kpiId}/comments`)
      .then((r) => r.ok ? r.json() : [])
      .then(setComments);
  }, [kpiId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/kpis/${kpiId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const c = await res.json();
      setComments((prev) => [...prev, c]);
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="comment-thread" onClick={(e) => e.stopPropagation()}>
      <div className="comment-list">
        {comments.length === 0 && <div className="comment-empty">Noch keine Kommentare.</div>}
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-avatar">{c.author.avatar ?? c.author.name.slice(0, 2).toUpperCase()}</div>
            <div className="comment-body">
              <div className="comment-meta">
                <span className="comment-author">{c.author.name}</span>
                <span className="comment-time">
                  {new Date(c.createdAt).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="comment-text">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <form className="comment-form" onSubmit={send}>
        <input
          className="comment-input"
          placeholder="Kommentar schreiben… (@name für Mention)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="comment-send-btn" disabled={sending || !text.trim()}>
          {sending ? "…" : "Senden"}
        </button>
      </form>
    </div>
  );
}

// ── Finding row ─────────────────────────────────────────────

interface User { id: string; name: string; avatar: string | null }

interface FindingWithAssignee extends Finding {
  assignee: User | null;
  ownerId?: string;
}

function FindingRow({
  finding,
  kpi,
  users,
  selected,
  onSelect,
  onOpenKpi,
  onStatusChange,
  onAssigneeChange,
}: {
  finding: FindingWithAssignee;
  kpi: Kpi | undefined;
  users: User[];
  selected: boolean;
  onSelect: () => void;
  onOpenKpi: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAssigneeChange: (id: string, assigneeId: string | null) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    setSaving(true);
    await onStatusChange(finding.id, e.target.value);
    setSaving(false);
  }

  async function handleAssigneeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation();
    const val = e.target.value || null;
    setSaving(true);
    await onAssigneeChange(finding.id, val);
    setSaving(false);
  }

  return (
    <div className={`finding-row-wrap${selected ? " finding-row-selected" : ""}`}>
      <div className="finding-row" onClick={() => kpi && onOpenKpi(kpi.id)}>
        <div className="fr-check" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <input type="checkbox" checked={selected} onChange={onSelect} className="fr-checkbox" />
        </div>
        <div className="fr-sev-bar" style={{ background: SEVERITY_COLOR[finding.severity] }} />
        <div className="fr-body">
          <div className="fr-head">
            <span className="severity-badge" style={{ background: SEVERITY_BG[finding.severity], color: SEVERITY_COLOR[finding.severity] }}>
              {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
            </span>
            {kpi && <AreaTag areaId={kpi.area} />}
            {kpi && <span className="kpi-code">{kpi.code}</span>}
          </div>
          <div className="fr-title">{finding.title}</div>
          <div className="fr-desc">{finding.desc}</div>
          <div className="fr-meta">
            <span>Owner: {finding.owner}</span>
            <span>·</span>
            <span>Fällig: <strong>{finding.due}</strong></span>
            <span>·</span>
            <span>Eröffnet: {finding.opened}</span>
          </div>
        </div>
        <div className="fr-actions" onClick={(e) => e.stopPropagation()}>
          <select className="finding-assignee-select" value={finding.assignee?.id ?? ""} onChange={handleAssigneeChange} disabled={saving}>
            <option value="">Kein Assignee</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="finding-status-select" value={finding.status} onChange={handleStatusChange} disabled={saving}>
            <option value="offen">Offen</option>
            <option value="in_bearbeitung">In Bearbeitung</option>
            <option value="geschlossen">Geschlossen</option>
          </select>
          <button className="fr-comment-btn" onClick={(e) => { e.stopPropagation(); setShowComments((v) => !v); }}
            title="Kommentare">
            💬
          </button>
        </div>
      </div>
      {showComments && kpi && <CommentThread kpiId={kpi.id} />}
    </div>
  );
}

// ── Main view ───────────────────────────────────────────────

interface CreateFindingForm {
  kpiId: string;
  title: string;
  desc: string;
  severity: "hoch" | "mittel" | "niedrig";
  dueDate: string;
  assigneeId: string;
}

export function FindingsView({
  kpis,
  findings,
  onOpenKpi,
  onFindingsUpdated,
}: {
  kpis: Kpi[];
  findings: FindingWithAssignee[];
  onOpenKpi: (id: string) => void;
  onFindingsUpdated: () => void;
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFindingForm>({
    kpiId: kpis[0]?.id ?? "",
    title: "",
    desc: "",
    severity: "mittel",
    dueDate: tomorrow(),
    assigneeId: "",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/users").then((r) => r.ok ? r.json() : []).then((data: { id: string; name: string; avatar: string | null }[]) => setUsers(data));
  }, []);

  const openFindings = findings.filter((f) => f.status !== "geschlossen");
  const closedFindings = findings.filter((f) => f.status === "geschlossen");

  async function handleStatusChange(id: string, status: string) {
    const res = await fetch(`/api/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) onFindingsUpdated();
  }

  async function handleAssigneeChange(id: string, assigneeId: string | null) {
    const res = await fetch(`/api/findings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId }),
    });
    if (res.ok) onFindingsUpdated();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.kpiId || !form.title || !form.desc) {
      setCreateError("Alle Pflichtfelder ausfüllen.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/findings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assigneeId: form.assigneeId || undefined }),
    });
    setCreating(false);
    if (res.ok) {
      setShowCreateForm(false);
      setForm({ kpiId: kpis[0]?.id ?? "", title: "", desc: "", severity: "mittel", dueDate: tomorrow(), assigneeId: "" });
      onFindingsUpdated();
    } else {
      const err = await res.json().catch(() => ({}));
      setCreateError(err.error ?? "Fehler beim Anlegen");
    }
  }

  async function bulkClose() {
    await Promise.all([...selected].map((id) =>
      fetch(`/api/findings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "geschlossen" }),
      })
    ));
    setSelected(new Set());
    onFindingsUpdated();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleExport() {
    exportFindingsExcel(findings, kpis);
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Findings</h2>
          <p className="view-sub">{openFindings.length} offene Befunde · {closedFindings.length} geschlossen</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={handleExport}>⬇ Excel-Export</button>
          <button className="btn-primary" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? "✕ Abbrechen" : "+ Finding anlegen"}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form className="finding-create-form" onSubmit={handleCreate}>
          <div className="fcf-row">
            <div className="fcf-field">
              <label className="fcf-label">KPI</label>
              <select className="fcf-select" value={form.kpiId} onChange={(e) => setForm((f) => ({ ...f, kpiId: e.target.value }))}>
                {kpis.map((k) => <option key={k.id} value={k.id}>{k.code} – {k.title}</option>)}
              </select>
            </div>
            <div className="fcf-field">
              <label className="fcf-label">Schwere</label>
              <select className="fcf-select" value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as "hoch" | "mittel" | "niedrig" }))}>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
              </select>
            </div>
            <div className="fcf-field">
              <label className="fcf-label">Assignee</label>
              <select className="fcf-select" value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}>
                <option value="">Kein Assignee</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="fcf-field">
              <label className="fcf-label">Fällig am</label>
              <input type="date" className="fcf-input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="fcf-field">
            <label className="fcf-label">Titel</label>
            <input type="text" className="fcf-input" placeholder="Kurze Beschreibung des Findings" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="fcf-field">
            <label className="fcf-label">Beschreibung</label>
            <textarea className="fcf-textarea" rows={3} placeholder="Detaillierte Beschreibung, Ursache, Auswirkung…" value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} />
          </div>
          {createError && <div className="fcf-error">{createError}</div>}
          <div className="fcf-actions">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Wird gespeichert…" : "Finding anlegen"}
            </button>
          </div>
        </form>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-count">{selected.size} ausgewählt</span>
          <button className="bulk-btn bulk-btn-close" onClick={bulkClose}>✓ Alle schließen</button>
          <button className="bulk-btn" onClick={() => setSelected(new Set())}>Auswahl aufheben</button>
        </div>
      )}

      {/* Summary cards */}
      <div className="findings-summary">
        {(["hoch", "mittel", "niedrig"] as const).map((sev) => {
          const count = openFindings.filter((f) => f.severity === sev).length;
          return (
            <div key={sev} className="findings-summary-card" style={{ borderColor: SEVERITY_COLOR[sev], background: SEVERITY_BG[sev] }}>
              <div className="fsc-num" style={{ color: SEVERITY_COLOR[sev] }}>{count}</div>
              <div className="fsc-label">{sev.charAt(0).toUpperCase() + sev.slice(1)}</div>
            </div>
          );
        })}
      </div>

      {/* Open findings */}
      <div className="findings-table-wrap">
        {openFindings.map((f) => {
          const kpi = kpis.find((k) => k.id === f.kpi);
          return (
            <FindingRow
              key={f.id}
              finding={f}
              kpi={kpi}
              users={users}
              selected={selected.has(f.id)}
              onSelect={() => toggleSelect(f.id)}
              onOpenKpi={onOpenKpi}
              onStatusChange={handleStatusChange}
              onAssigneeChange={handleAssigneeChange}
            />
          );
        })}
        {openFindings.length === 0 && (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--ink-3)", fontSize: "0.875rem" }}>
            Keine offenen Findings
          </div>
        )}
      </div>

      {/* Closed findings */}
      {closedFindings.length > 0 && (
        <details className="finding-closed-section">
          <summary className="finding-closed-summary">Geschlossene Findings ({closedFindings.length})</summary>
          <div className="findings-table-wrap" style={{ marginTop: "0.5rem" }}>
            {closedFindings.map((f) => {
              const kpi = kpis.find((k) => k.id === f.kpi);
              return (
                <FindingRow
                  key={f.id}
                  finding={f}
                  kpi={kpi}
                  users={users}
                  selected={selected.has(f.id)}
                  onSelect={() => toggleSelect(f.id)}
                  onOpenKpi={onOpenKpi}
                  onStatusChange={handleStatusChange}
                  onAssigneeChange={handleAssigneeChange}
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
