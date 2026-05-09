"use client";
import { useState } from "react";
import type { Kpi } from "@/types";
import { AREAS, FINDINGS, QUARTERS, CURRENT_QUARTER } from "@/data/audit-data";
import { StatusPill } from "@/components/ui/StatusDot";
import { Sparkline } from "@/components/ui/Sparkline";
import { RiskBars } from "@/components/ui/RiskBars";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";

type Tab = "agent" | "findings" | "evidence" | "comments" | "history";

interface Comment {
  author: string;
  role: string;
  time: string;
  text: string;
  avatar: string;
}

function AgentReport({ kpi }: { kpi: Kpi }) {
  const checks = [
    { name: "Datenvollständigkeit", status: "ok", detail: "8.412 / 8.412 Datensätze geladen" },
    { name: "Plausibilitäts-Korridor", status: kpi.status === "ok" ? "ok" : "warn", detail: kpi.delta },
    { name: "Regelwerk-Abgleich", status: kpi.status === "finding" ? "alert" : "ok", detail: "7 von 7 Regeln geprüft" },
    { name: "Historischer Vergleich", status: "ok", detail: `8 Quartale analysiert (${QUARTERS[0]} – ${CURRENT_QUARTER})` },
    { name: "Eskalationslogik", status: kpi.status === "finding" || kpi.status === "review" ? "warn" : "ok", detail: kpi.status === "finding" ? "Schwellenwert überschritten" : "Kein Handlungsbedarf" },
  ];

  const summaryText = kpi.status === "finding"
    ? `Ich habe ${kpi.value} relevante Auffälligkeiten identifiziert. Die Abweichung zum Vorquartal beträgt ${kpi.delta}. Zwei der ausgelösten Regeln betreffen Hochrisiko-Konten. Empfehlung: Finding bestätigen und Maßnahmen einleiten.`
    : kpi.status === "review"
    ? `Die Kennzahl liegt aktuell bei ${kpi.value} (${kpi.delta}). Der Agent hat eine Auffälligkeit identifiziert, ist sich aber nur zu ${Math.round(kpi.confidence * 100)}% sicher und bittet um menschliche Bewertung.`
    : kpi.status === "ok"
    ? `Die Kennzahl bewegt sich im erwarteten Korridor. Keine Auffälligkeiten in den geprüften ${Math.round(kpi.confidence * 100)}% der Datensätze. Empfehlung: als geprüft freigeben.`
    : `Agent prüft aktuell. Datensammlung abgeschlossen, Regelauswertung läuft. Voraussichtlicher Abschluss in 8 Min.`;

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
            <div className="ar-agent-sub">Autonomer Prüf-Agent · letzte Iteration {kpi.lastRun}</div>
          </div>
        </div>
        <div className="ar-tags">
          <span className="ar-tag">Datenquellen: 4</span>
          <span className="ar-tag">Regelwerke: 7</span>
          <span className="ar-tag">Laufzeit 42s</span>
        </div>
      </div>

      <div className={`ar-summary ar-${kpi.status}`}>
        <div className="ar-summary-label">Zusammenfassung des Agenten</div>
        <p className="ar-summary-text">{summaryText}</p>
      </div>

      <div className="ar-checks">
        <div className="ar-checks-head">Ausgeführte Prüfungen</div>
        {checks.map((c, i) => (
          <div key={i} className="ar-check">
            <span className={`ar-check-icon ar-check-${c.status}`}>
              {c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "×"}
            </span>
            <div className="ar-check-text">
              <span className="ar-check-name">{c.name}</span>
              <span className="ar-check-detail">{c.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindingsList({ kpiId }: { kpiId: string }) {
  const findings = FINDINGS.filter((f) => f.kpi === kpiId);
  if (findings.length === 0) return <div className="empty-state">Keine Findings für diese Kennzahl.</div>;
  return (
    <div className="findings-list">
      {findings.map((f) => (
        <div key={f.id} className={`finding-item finding-${f.severity}`}>
          <div className="finding-head">
            <span className={`severity-badge severity-${f.severity}`}>{f.severity.charAt(0).toUpperCase() + f.severity.slice(1)}</span>
            <span className="finding-status">{f.status.replace("_", " ")}</span>
          </div>
          <div className="finding-title">{f.title}</div>
          <div className="finding-desc">{f.desc}</div>
          <div className="finding-meta">
            <span>Owner: {f.owner}</span>
            <span>Fällig: {f.due}</span>
            <span>Eröffnet: {f.opened}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EvidenceList() {
  const items = [
    { name: "JournalEntries_Q2_2026.xlsx", size: "2.1 MB", type: "xlsx", date: "09.05.2026" },
    { name: "RiskMatrix_REW_2026.pdf", size: "842 KB", type: "pdf", date: "08.05.2026" },
    { name: "Kontenplan_Hauptbuch.csv", size: "1.4 MB", type: "csv", date: "07.05.2026" },
    { name: "Screenshot_Buchungsmaske.png", size: "312 KB", type: "img", date: "07.05.2026" },
    { name: "AgentLog_JournalSentry.txt", size: "56 KB", type: "txt", date: "09.05.2026" },
  ];
  return (
    <div className="evidence-list">
      {items.map((e, i) => (
        <div key={i} className="evidence-item">
          <div className="evidence-icon">{e.type === "pdf" ? "📄" : e.type === "xlsx" ? "📊" : e.type === "csv" ? "📋" : e.type === "img" ? "🖼" : "📝"}</div>
          <div className="evidence-info">
            <div className="evidence-name">{e.name}</div>
            <div className="evidence-meta">{e.size} · {e.date}</div>
          </div>
          <button className="btn-link">Download</button>
        </div>
      ))}
    </div>
  );
}

function CommentsThread({ comments, setComments, comment, setComment }: {
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
}) {
  const submit = () => {
    if (!comment.trim()) return;
    setComments((prev) => [...prev, { author: "A. Voss", role: "Head of Audit", time: "gerade eben", text: comment, avatar: "AV" }]);
    setComment("");
  };
  return (
    <div className="comments">
      <div className="comments-list">
        {comments.map((c, i) => (
          <div key={i} className="comment">
            <div className="comment-avatar">{c.avatar}</div>
            <div className="comment-body">
              <div className="comment-head">
                <span className="comment-author">{c.author}</span>
                <span className="comment-role">{c.role}</span>
                <span className="comment-time">{c.time}</span>
              </div>
              <div className="comment-text">{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="comment-input-wrap">
        <textarea
          className="comment-input"
          placeholder="Kommentar hinzufügen..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
        />
        <button className="btn btn-primary" onClick={submit}>Absenden</button>
      </div>
    </div>
  );
}

function HistoryView({ kpi }: { kpi: Kpi }) {
  const rows = QUARTERS.map((q, i) => ({
    quarter: q,
    value: kpi.trend[i] ?? "—",
    status: i === QUARTERS.length - 1 ? kpi.status : i >= 5 ? "ok" : "ok",
  })).reverse();
  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr><th>Quartal</th><th>Wert</th><th>Status</th></tr>
        </thead>
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

const TABS: { id: Tab; label: string }[] = [
  { id: "agent",    label: "KI-Agent Befund" },
  { id: "findings", label: "Findings" },
  { id: "evidence", label: "Evidenzen (5)" },
  { id: "comments", label: "Diskussion" },
  { id: "history",  label: "Historie" },
];

export function KpiDetail({
  kpi,
  onClose,
  onAction,
}: {
  kpi: Kpi;
  onClose: () => void;
  onAction: (action: string, kpi: Kpi) => void;
}) {
  const area = AREAS.find((a) => a.id === kpi.area);
  const [tab, setTab] = useState<Tab>("agent");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    { author: "S. Hartmann", role: "Reviewer", time: "vor 2 Std.", text: "Bitte prüfen ob die KI-Bewertung der drei neuen Klagen mit den vorhandenen Schriftsätzen übereinstimmt.", avatar: "SH" },
    { author: "Dr. M. Weiss", role: "Owner", time: "vor 1 Std.", text: "Habe die Akten gesichtet — KI-Klassifizierung in 2 von 3 Fällen korrekt. Anpassung Rückstellungen läuft.", avatar: "MW" },
  ]);

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
          {tab === "findings" && <FindingsList kpiId={kpi.id} />}
          {tab === "evidence" && <EvidenceList />}
          {tab === "comments" && <CommentsThread comments={comments} setComments={setComments} comment={comment} setComment={setComment} />}
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
