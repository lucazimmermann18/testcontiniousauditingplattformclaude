"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";

type ApprovalStatus = "pending" | "reviewer_approved" | "head_approved" | "rejected";

interface ApprovalRecord {
  id: string;
  kpiId: string;
  status: ApprovalStatus;
  reviewerId: string | null;
  reviewerNote: string | null;
  reviewedAt: string | null;
  headAuditorId: string | null;
  headAuditorNote: string | null;
  headApprovedAt: string | null;
  period: string;
  updatedAt: string;
  reviewerUser: { id: string; name: string; avatar: string | null } | null;
  headAuditorUser: { id: string; name: string; avatar: string | null } | null;
  kpi: {
    id: string;
    code: string;
    title: string;
    risk: number;
    status: string;
    area: { name: string };
    owner: { id: string; name: string; avatar: string | null };
    reviewer: { id: string; name: string; avatar: string | null };
  };
}

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: "Ausstehend",
  reviewer_approved: "Reviewer OK",
  head_approved: "Endgültig freigegeben",
  rejected: "Abgelehnt",
};

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: "#f59e0b",
  reviewer_approved: "#3b82f6",
  head_approved: "#10b981",
  rejected: "#ef4444",
};

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function ActionModal({
  approval,
  action,
  onClose,
  onDone,
}: {
  approval: ApprovalRecord;
  action: "reviewer_approve" | "head_approve" | "reject";
  onClose: () => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const label =
    action === "reviewer_approve" ? "Reviewer-Freigabe erteilen" :
    action === "head_approve" ? "Endgültig freigeben" : "Ablehnen";

  async function submit() {
    setSaving(true);
    setErr(null);
    const res = await fetch(`/api/kpis/${approval.kpiId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: note || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Fehler"); setSaving(false); return; }
    onDone();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{label}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 12, fontSize: 14, color: "var(--ink-2)" }}>
            <strong>{approval.kpi.code}</strong> — {approval.kpi.title}
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>
            Anmerkung (optional)
          </label>
          <textarea
            className="settings-input"
            rows={3}
            placeholder="z.B. Begründung, Hinweise…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", resize: "vertical" }}
          />
          {err && <div className="settings-msg settings-msg-err" style={{ marginTop: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
            <button className="btn" onClick={onClose}>Abbrechen</button>
            <button
              className={`btn-primary${action === "reject" ? " btn-danger" : ""}`}
              onClick={submit}
              disabled={saving}
              style={action === "reject" ? { background: "#ef4444", borderColor: "#ef4444" } : {}}
            >
              {saving ? "…" : label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApprovalsView({ me }: { me: { id: string; role: string; name: string } | null }) {
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [modal, setModal] = useState<{ approval: ApprovalRecord; action: "reviewer_approve" | "head_approve" | "reject" } | null>(null);
  const showToast = useToast();

  const isHeadOrAdmin = me?.role === "head_of_audit" || me?.role === "admin";
  const isReviewer = me?.role === "reviewer" || isHeadOrAdmin;

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/approvals");
    if (res.ok) setApprovals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterStatus === "all"
    ? approvals
    : approvals.filter((a) => a.status === filterStatus);

  const counts = {
    all: approvals.length,
    pending: approvals.filter((a) => a.status === "pending").length,
    reviewer_approved: approvals.filter((a) => a.status === "reviewer_approved").length,
    head_approved: approvals.filter((a) => a.status === "head_approved").length,
    rejected: approvals.filter((a) => a.status === "rejected").length,
  };

  // My queue: what actions can I take?
  function myActions(a: ApprovalRecord): ("reviewer_approve" | "head_approve" | "reject")[] {
    if (!me) return [];
    const acts: ("reviewer_approve" | "head_approve" | "reject")[] = [];
    if (a.status === "pending" && isReviewer) acts.push("reviewer_approve");
    if (a.status === "reviewer_approved" && isHeadOrAdmin) acts.push("head_approve");
    if ((a.status === "pending" || a.status === "reviewer_approved") && isHeadOrAdmin) acts.push("reject");
    return acts;
  }

  const myPending = approvals.filter((a) => myActions(a).length > 0);

  return (
    <div>
      {modal && (
        <ActionModal
          approval={modal.approval}
          action={modal.action}
          onClose={() => setModal(null)}
          onDone={() => {
            const actionLabel = modal.action === "reviewer_approve" ? "Reviewer-Freigabe erteilt" :
              modal.action === "head_approve" ? "Endgültig freigegeben ✓" : "Abgelehnt";
            showToast(actionLabel, modal.action === "reject" ? "alert" : "ok");
            setModal(null);
            load();
          }}
        />
      )}

      <div className="view-header">
        <div>
          <h2 className="view-title">Freigabe-Dashboard</h2>
          <p className="view-sub">
            {counts.pending} ausstehend · {counts.reviewer_approved} warten auf Head-of-Audit · {myPending.length} erfordern deine Aktion
          </p>
        </div>
      </div>

      {/* My queue banner */}
      {myPending.length > 0 && (
        <div className="apv-summary" style={{ marginBottom: 20, background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: "14px 20px" }}>
          <div className="apv-stat">
            <div className="apv-stat-num" style={{ color: "var(--brand)" }}>{myPending.length}</div>
            <div className="apv-stat-label">Deine offenen Aktionen</div>
          </div>
          <div style={{ flex: 1, fontSize: 13, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 8 }}>
            {myPending.slice(0, 3).map((a) => (
              <span key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 6, padding: "3px 8px", fontSize: 12 }}>
                {a.kpi.code}
              </span>
            ))}
            {myPending.length > 3 && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>+{myPending.length - 3} weitere</span>}
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="apv-filter-tabs" style={{ marginBottom: 16 }}>
        {(["pending", "reviewer_approved", "head_approved", "rejected", "all"] as const).map((s) => (
          <button
            key={s}
            className={`apv-filter-tab${filterStatus === s ? " active" : ""}`}
            style={filterStatus === s && s !== "all" ? { borderColor: STATUS_COLORS[s as ApprovalStatus], color: STATUS_COLORS[s as ApprovalStatus] } : {}}
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? `Alle (${counts.all})` : `${STATUS_LABELS[s]} (${counts[s]})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="settings-empty">Lade…</div>
      ) : approvals.length === 0 ? (
        <EmptyState icon="🎉" title="Alle Freigaben erledigt" sub="Es gibt keine ausstehenden Genehmigungen." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Keine Einträge" sub="Wähle einen anderen Status-Filter." compact />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((a) => {
            const actions = myActions(a);
            const days = daysSince(a.updatedAt);
            const isOverdue = a.status !== "head_approved" && a.status !== "rejected" && days > 5;

            return (
              <div
                key={a.id}
                className="settings-card"
                style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: STATUS_COLORS[a.status],
                    boxShadow: `0 0 0 3px ${STATUS_COLORS[a.status]}22`,
                  }}
                />

                {/* KPI info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{a.kpi.code}</span>
                    <span style={{ fontSize: 13, color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                      {a.kpi.title}
                    </span>
                    <span className="area-tag">{a.kpi.area.name}</span>
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                        background: STATUS_COLORS[a.status] + "22",
                        color: STATUS_COLORS[a.status],
                      }}
                    >
                      {STATUS_LABELS[a.status]}
                    </span>
                    {isOverdue && (
                      <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700 }}>⚠ {days}d offen</span>
                    )}
                  </div>

                  {/* Workflow progress */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <WorkflowStep
                      label="Owner"
                      user={a.kpi.owner}
                      done={a.status !== "pending"}
                      active={a.status === "pending"}
                    />
                    <div style={{ width: 24, height: 1, background: "var(--line)" }} />
                    <WorkflowStep
                      label="Reviewer"
                      user={a.reviewerUser ?? a.kpi.reviewer}
                      done={a.status === "reviewer_approved" || a.status === "head_approved"}
                      active={a.status === "reviewer_approved"}
                      note={a.reviewerNote}
                    />
                    <div style={{ width: 24, height: 1, background: "var(--line)" }} />
                    <WorkflowStep
                      label="Head of Audit"
                      user={a.headAuditorUser}
                      done={a.status === "head_approved"}
                      active={false}
                      rejected={a.status === "rejected"}
                      note={a.headAuditorNote}
                    />
                  </div>
                </div>

                {/* Period */}
                <div style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{a.period}</div>

                {/* Actions */}
                {actions.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {actions.includes("reviewer_approve") && (
                      <button className="btn-sm" style={{ background: "rgba(59,130,246,0.1)", color: "var(--brand)", borderColor: "rgba(59,130,246,0.3)" }} onClick={() => setModal({ approval: a, action: "reviewer_approve" })}>
                        Reviewer OK
                      </button>
                    )}
                    {actions.includes("head_approve") && (
                      <button className="btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }} onClick={() => setModal({ approval: a, action: "head_approve" })}>
                        Endfreigabe
                      </button>
                    )}
                    {actions.includes("reject") && (
                      <button className="btn-sm btn-sm-danger" onClick={() => setModal({ approval: a, action: "reject" })}>
                        Ablehnen
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WorkflowStep({
  label, user, done, active, rejected, note,
}: {
  label: string;
  user: { name: string; avatar: string | null } | null;
  done: boolean;
  active: boolean;
  rejected?: boolean;
  note?: string | null;
}) {
  const color = rejected ? "#ef4444" : done ? "#10b981" : active ? "#f59e0b" : "var(--ink-4)";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }} title={note ?? undefined}>
      <div
        style={{
          width: 24, height: 24, borderRadius: "50%", border: `2px solid ${color}`,
          background: done || active ? color + "22" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color,
        }}
      >
        {rejected ? "✕" : done ? "✓" : active ? "●" : "○"}
      </div>
      <div style={{ fontSize: 10, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{user?.name?.split(" ")[0] ?? label}</div>
    </div>
  );
}
