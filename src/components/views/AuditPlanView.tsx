"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Kpi } from "@/types";
import { CURRENT_QUARTER, QUARTERS, AREAS } from "@/data/audit-data";

interface PlanEntry {
  kpiId: string;
  kpi: Kpi;
  assignee: string;
  priority: "critical" | "high" | "medium" | "low";
  plannedDate: string;
  notes: string;
  done: boolean;
}

const PRIORITY_LABELS = { critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" };
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

function autoAssign(kpi: Kpi): string {
  return kpi.reviewer || kpi.owner || "—";
}

function autoPriority(kpi: Kpi): PlanEntry["priority"] {
  if (kpi.status === "finding") return "critical";
  if (kpi.status === "review") return "high";
  if (kpi.risk >= 4) return "high";
  if (kpi.risk === 3) return "medium";
  return "low";
}

function nextWorkday(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface NewKpiForm {
  code: string;
  title: string;
  desc: string;
  areaId: string;
  risk: number;
  agent: string;
  ownerId: string;
  reviewerId: string;
}

interface SimpleUser { id: string; name: string; role: string; }

function NewKpiModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (kpi: Kpi) => void;
}) {
  const [form, setForm] = useState<NewKpiForm>({
    code: "", title: "", desc: "", areaId: AREAS[0]?.id ?? "",
    risk: 3, agent: "Audit-Assistent", ownerId: "", reviewerId: "",
  });
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users").then((r) => r.ok ? r.json() : []).then(setUsers).catch(() => {});
  }, []);

  const set = (patch: Partial<NewKpiForm>) => setForm((f) => ({ ...f, ...patch }));

  async function submit() {
    if (!form.code.trim() || !form.title.trim() || !form.ownerId || !form.reviewerId) {
      setErr("Code, Titel, Verantwortlicher und Reviewer sind Pflichtfelder.");
      return;
    }
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/kpis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        areaId: form.areaId,
        title: form.title.trim(),
        desc: form.desc.trim(),
        risk: form.risk,
        agent: form.agent.trim() || "Audit-Assistent",
        ownerId: form.ownerId,
        reviewerId: form.reviewerId,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Fehler beim Anlegen."); setSaving(false); return; }
    onCreated(data);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">Neuen KPI anlegen</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
            <div>
              <label className="settings-label">KPI-Code *</label>
              <input
                className="settings-input"
                placeholder="z.B. LGL-05"
                value={form.code}
                onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                style={{ fontFamily: "monospace", textTransform: "uppercase" }}
              />
            </div>
            <div>
              <label className="settings-label">Titel *</label>
              <input className="settings-input" placeholder="KPI-Bezeichnung" value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="settings-label">Prüfbereich *</label>
              <select className="settings-input settings-select" value={form.areaId} onChange={(e) => set({ areaId: e.target.value })}>
                {AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="settings-label">Risiko (1–5) *</label>
              <select className="settings-input settings-select" value={form.risk} onChange={(e) => set({ risk: Number(e.target.value) })}>
                <option value={5}>5 — Kritisch</option>
                <option value={4}>4 — Hoch</option>
                <option value={3}>3 — Mittel</option>
                <option value={2}>2 — Niedrig</option>
                <option value={1}>1 — Minimal</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="settings-label">Verantwortlicher (Owner) *</label>
              <select className="settings-input settings-select" value={form.ownerId} onChange={(e) => set({ ownerId: e.target.value })}>
                <option value="">— auswählen —</option>
                {users.filter((u) => u.role === "owner" || u.role === "admin").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="settings-label">Reviewer *</label>
              <select className="settings-input settings-select" value={form.reviewerId} onChange={(e) => set({ reviewerId: e.target.value })}>
                <option value="">— auswählen —</option>
                {users.filter((u) => u.role === "reviewer" || u.role === "head_of_audit" || u.role === "admin").map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="settings-label">KI-Agent</label>
            <input className="settings-input" value={form.agent} onChange={(e) => set({ agent: e.target.value })} placeholder="z.B. Compliance-Agent" />
          </div>

          <div>
            <label className="settings-label">Beschreibung</label>
            <textarea className="settings-input" rows={2} value={form.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Kurzbeschreibung des KPIs (optional)" style={{ resize: "vertical" }} />
          </div>

          {err && <div className="settings-msg settings-msg-err">{err}</div>}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button className="btn" onClick={onClose}>Abbrechen</button>
            <button className="btn-primary" onClick={submit} disabled={saving}>
              {saving ? "Anlegen…" : "KPI anlegen & zum Plan hinzufügen"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditPlanView({ kpis: initialKpis, me, onKpisUpdated }: { kpis: Kpi[]; me: { role: string; name: string } | null; onKpisUpdated?: () => void }) {
  const [kpis, setKpis] = useState<Kpi[]>(initialKpis);
  const kpisRef = useRef<Kpi[]>(initialKpis);
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showNewKpiModal, setShowNewKpiModal] = useState(false);
  const [quarter, setQuarter] = useState(CURRENT_QUARTER);
  const isAdmin = me?.role === "admin" || me?.role === "head_of_audit";

  // Keep ref in sync — loadPlan reads from ref to avoid stale closures
  useEffect(() => {
    setKpis(initialKpis);
    kpisRef.current = initialKpis;
  }, [initialKpis]);

  const loadPlan = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-plan?quarter=${encodeURIComponent(q)}`);
      if (res.ok) {
        const dbEntries: any[] = await res.json();
        if (dbEntries.length > 0) {
          const currentKpis = kpisRef.current;
          const restored: PlanEntry[] = dbEntries
            .map((e) => {
              const kpi = currentKpis.find((k) => k.id === e.kpiId);
              if (!kpi) return null;
              return {
                kpiId: e.kpiId,
                kpi,
                assignee: e.assignee,
                priority: e.priority as PlanEntry["priority"],
                plannedDate: e.plannedDate,
                notes: e.notes,
                done: e.done,
              };
            })
            .filter(Boolean) as PlanEntry[];
          setPlan(restored);
          setLoading(false);
          return;
        }
      }
    } catch { /* fall through to auto-generate */ }

    // Auto-generate from KPIs
    const generated = kpisRef.current
      .filter((k) => k.status !== "pending")
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[autoPriority(a)];
        const pb = PRIORITY_ORDER[autoPriority(b)];
        return pa !== pb ? pa - pb : b.risk - a.risk;
      })
      .map((k): PlanEntry => ({
        kpiId: k.id, kpi: k,
        assignee: autoAssign(k),
        priority: autoPriority(k),
        plannedDate: nextWorkday(14),
        notes: "",
        done: false,
      }));
    setPlan(generated);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // reads kpisRef — no re-creation on KPI list change

  useEffect(() => {
    loadPlan(quarter);
  }, [quarter, loadPlan]);

  const savePlan = useCallback(async () => {
    setSaving(true);
    try {
      const entries = plan.map(({ kpi: _kpi, ...rest }) => rest);
      const res = await fetch("/api/audit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter, entries }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [plan, quarter]);

  async function updateEntry(kpiId: string, patch: Partial<PlanEntry>) {
    setPlan((prev) => prev.map((e) => e.kpiId === kpiId ? { ...e, ...patch } : e));
    // Persist single entry immediately
    try {
      await fetch("/api/audit-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarter, kpiId, ...patch }),
      });
    } catch { /* ignore, plan state is updated locally */ }
  }

  const filtered = filterPriority === "all" ? plan : plan.filter((e) => e.priority === filterPriority);
  const done = plan.filter((e) => e.done).length;
  const critical = plan.filter((e) => e.priority === "critical").length;
  const overdue = plan.filter((e) => !e.done && e.plannedDate < new Date().toISOString().slice(0, 10)).length;

  function handleKpiCreated(newKpi: Kpi) {
    // Add to local kpis list and immediately add to plan
    const enriched: Kpi = { ...newKpi, areaName: AREAS.find((a) => a.id === newKpi.area)?.name };
    setKpis((prev) => [...prev, enriched]);
    const entry: PlanEntry = {
      kpiId: enriched.id,
      kpi: enriched,
      assignee: enriched.reviewer || enriched.owner || "",
      priority: autoPriority(enriched),
      plannedDate: nextWorkday(14),
      notes: "",
      done: false,
    };
    setPlan((prev) => [entry, ...prev]);
    setShowNewKpiModal(false);
    onKpisUpdated?.();
  }

  return (
    <div>
      {showNewKpiModal && (
        <NewKpiModal onClose={() => setShowNewKpiModal(false)} onCreated={handleKpiCreated} />
      )}
      <div className="view-header">
        <div>
          <h2 className="view-title">Prüfplanung</h2>
          <p className="view-sub">{loading ? "Lade…" : `Quartal ${quarter} · ${plan.length} KPIs geplant · ${done} abgeschlossen`}</p>
        </div>
        <div className="apv-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Quarter selector */}
          <select
            className="settings-input settings-select"
            style={{ padding: "6px 12px", fontSize: 13 }}
            value={quarter}
            onChange={(e) => setQuarter(e.target.value)}
          >
            {QUARTERS.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
          {isAdmin && (
            <button className="btn btn-ghost" onClick={() => setShowNewKpiModal(true)} style={{ fontSize: 13 }}>
              + Neuer KPI
            </button>
          )}
          {isAdmin && (
            <button className="btn btn-primary" onClick={savePlan} disabled={saving}>
              {saving ? "Speichern…" : saved ? "✓ Gespeichert" : "Prüfplan speichern"}
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="apv-summary">
        <div className="apv-stat apv-stat-critical">
          <div className="apv-stat-num">{critical}</div>
          <div className="apv-stat-label">Kritisch</div>
        </div>
        <div className="apv-stat apv-stat-overdue">
          <div className="apv-stat-num">{overdue}</div>
          <div className="apv-stat-label">Überfällig</div>
        </div>
        <div className="apv-stat apv-stat-done">
          <div className="apv-stat-num">{done}</div>
          <div className="apv-stat-label">Erledigt</div>
        </div>
        <div className="apv-stat">
          <div className="apv-stat-num">{plan.length - done}</div>
          <div className="apv-stat-label">Ausstehend</div>
        </div>
        <div className="apv-progress-wrap">
          <div className="apv-progress-label">Fortschritt {plan.length > 0 ? Math.round(done / plan.length * 100) : 0}%</div>
          <div className="apv-progress-bar">
            <div className="apv-progress-fill" style={{ width: `${plan.length > 0 ? done / plan.length * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="apv-filter-tabs">
        {["all", "critical", "high", "medium", "low"].map((p) => (
          <button
            key={p}
            className={`apv-filter-tab apv-filter-${p}${filterPriority === p ? " active" : ""}`}
            onClick={() => setFilterPriority(p)}
          >
            {p === "all" ? `Alle (${plan.length})` : `${PRIORITY_LABELS[p as keyof typeof PRIORITY_LABELS]} (${plan.filter((e) => e.priority === p).length})`}
          </button>
        ))}
      </div>

      {/* Plan table */}
      <div className="apv-table-wrap">
        <table className="apv-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>✓</th>
              <th>KPI</th>
              <th>Priorität</th>
              <th>Verantwortlich</th>
              <th>Geplant bis</th>
              <th>Notizen</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const isEditing = editId === entry.kpiId;
              const isOverdue = !entry.done && entry.plannedDate < new Date().toISOString().slice(0, 10);
              return (
                <tr
                  key={entry.kpiId}
                  className={`apv-row apv-row-${entry.priority}${entry.done ? " apv-row-done" : ""}${isOverdue ? " apv-row-overdue" : ""}`}
                >
                  <td>
                    <input
                      type="checkbox"
                      className="apv-check"
                      checked={entry.done}
                      onChange={(e) => updateEntry(entry.kpiId, { done: e.target.checked })}
                    />
                  </td>
                  <td>
                    <div className="apv-kpi-code">{entry.kpi.code}</div>
                    <div className="apv-kpi-title">{entry.kpi.title}</div>
                    <div className="apv-kpi-area">{entry.kpi.areaName ?? entry.kpi.area}</div>
                  </td>
                  <td>
                    {isEditing && isAdmin ? (
                      <select
                        className="apv-select"
                        value={entry.priority}
                        onChange={(e) => updateEntry(entry.kpiId, { priority: e.target.value as PlanEntry["priority"] })}
                      >
                        {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    ) : (
                      <span className={`apv-priority-badge apv-prio-${entry.priority}`}>{PRIORITY_LABELS[entry.priority]}</span>
                    )}
                  </td>
                  <td>
                    {isEditing && isAdmin ? (
                      <input
                        className="apv-input"
                        value={entry.assignee}
                        onChange={(e) => updateEntry(entry.kpiId, { assignee: e.target.value })}
                      />
                    ) : (
                      <span className="apv-assignee">{entry.assignee}</span>
                    )}
                  </td>
                  <td>
                    {isEditing && isAdmin ? (
                      <input
                        type="date"
                        className="apv-input"
                        value={entry.plannedDate}
                        onChange={(e) => updateEntry(entry.kpiId, { plannedDate: e.target.value })}
                      />
                    ) : (
                      <span className={`apv-date${isOverdue ? " apv-date-overdue" : ""}`}>
                        {entry.plannedDate
                          ? new Date(entry.plannedDate).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
                          : "—"}
                        {isOverdue && " ⚠"}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing && isAdmin ? (
                      <input
                        className="apv-input"
                        placeholder="Notizen…"
                        value={entry.notes}
                        onChange={(e) => updateEntry(entry.kpiId, { notes: e.target.value })}
                      />
                    ) : (
                      <span className="apv-notes">{entry.notes || "—"}</span>
                    )}
                  </td>
                  <td>
                    <div className="apv-actions">
                      <span className={`apv-kpi-status apv-kpi-status-${entry.kpi.status}`}>{entry.kpi.status}</span>
                      {isAdmin && (
                        <button
                          className="apv-edit-btn"
                          onClick={() => setEditId(isEditing ? null : entry.kpiId)}
                        >
                          {isEditing ? "✓" : "✎"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
