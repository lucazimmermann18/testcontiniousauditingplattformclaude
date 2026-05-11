"use client";
import { useState, useEffect, useCallback } from "react";
import type { Kpi } from "@/types";
import { CURRENT_QUARTER, QUARTERS } from "@/data/audit-data";

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

export function AuditPlanView({ kpis, me }: { kpis: Kpi[]; me: { role: string; name: string } | null }) {
  const [plan, setPlan] = useState<PlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quarter, setQuarter] = useState(CURRENT_QUARTER);
  const isAdmin = me?.role === "admin" || me?.role === "head_of_audit";

  const loadPlan = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit-plan?quarter=${encodeURIComponent(q)}`);
      if (res.ok) {
        const dbEntries: any[] = await res.json();
        if (dbEntries.length > 0) {
          const restored: PlanEntry[] = dbEntries
            .map((e) => {
              const kpi = kpis.find((k) => k.id === e.kpiId);
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
          return;
        }
      }
    } catch { /* fall through to auto-generate */ }

    // Auto-generate from KPIs
    const generated = kpis
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
  }, [kpis]);

  useEffect(() => {
    loadPlan(quarter);
    setLoading(false);
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

  return (
    <div>
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
