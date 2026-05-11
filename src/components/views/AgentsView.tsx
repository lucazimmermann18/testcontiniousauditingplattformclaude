"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import type { Kpi } from "@/types";
import type { AgentResult, StageResult } from "@/lib/agents/types";
import { StatusPill } from "@/components/ui/StatusDot";
import { Confidence } from "@/components/ui/Confidence";
import { AreaTag } from "@/components/ui/AreaTag";
import { AgentResultDisplay } from "@/components/ui/AgentResultDisplay";

type StageId = "scout" | "analyst" | "cross_checker" | "risk_rater";

interface StageState {
  id: StageId;
  label: string;
  agentName: string;
  status: "pending" | "running" | "done";
  summary?: string;
}

interface LogLine {
  ts: string;
  kind: "info" | "stage" | "done" | "error" | "text";
  msg: string;
}

interface RunState {
  kpiId: string;
  status: "streaming" | "done" | "error";
  text: string;
  result?: AgentResult;
  error?: string;
  stages: StageState[];
  currentStage?: StageId;
  log: LogLine[];
}

function nowTs() {
  return new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const STAGE_DEFS: { id: StageId; label: string; icon: string; description: string }[] = [
  { id: "scout",         label: "Scout",         icon: "🔍", description: "Datenmuster scannen" },
  { id: "analyst",       label: "Analyst",        icon: "🧪", description: "Tiefenanalyse" },
  { id: "cross_checker", label: "Cross-Checker",  icon: "🔗", description: "Kontext & Historie" },
  { id: "risk_rater",    label: "Risk-Rater",     icon: "⚖️", description: "Finales Urteil" },
];

function StagePipeline({ stages, currentStage }: { stages: StageState[]; currentStage?: StageId }) {
  const stageMap = Object.fromEntries(stages.map((s) => [s.id, s]));

  return (
    <div className="stage-pipeline">
      {STAGE_DEFS.map((def, i) => {
        const state = stageMap[def.id];
        const status = state?.status ?? "pending";
        const isActive = currentStage === def.id;

        return (
          <div key={def.id} className={`stage-step stage-step-${status}${isActive ? " stage-step-active" : ""}`}>
            <div className="stage-connector-left">{i > 0 && <div className={`stage-line${status !== "pending" ? " stage-line-done" : ""}`} />}</div>
            <div className="stage-dot-wrap">
              <div className={`stage-dot${isActive ? " stage-dot-pulse" : ""}`}>
                {status === "done" ? "✓" : isActive ? "▶" : def.icon}
              </div>
            </div>
            <div className="stage-info">
              <div className="stage-name">{def.label}</div>
              <div className="stage-desc">
                {status === "running" || isActive ? (
                  <span className="stage-running-text">{state?.label ?? def.description}</span>
                ) : state?.summary ? (
                  <span className="stage-summary">{state.summary}</span>
                ) : (
                  <span className="stage-desc-text">{def.description}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function initStages(): StageState[] {
  return STAGE_DEFS.map((d) => ({ id: d.id, label: d.description, agentName: d.label, status: "pending" }));
}

// ── Terminal Log ─────────────────────────────────────────────

function AgentTerminal({ log, status }: { log: LogLine[]; status: RunState["status"] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  return (
    <div className="agent-terminal">
      <div className="agent-terminal-bar">
        <span className="atb-dot atb-red" /><span className="atb-dot atb-yellow" /><span className="atb-dot atb-green" />
        <span className="atb-title">audit-agent — log</span>
        {status === "streaming" && <span className="atb-live">● LIVE</span>}
      </div>
      <div className="agent-terminal-body">
        {log.map((line, i) => (
          <div key={i} className={`atl-line atl-${line.kind}`}>
            <span className="atl-ts">[{line.ts}]</span>
            <span className="atl-msg">{line.msg}</span>
          </div>
        ))}
        {status === "streaming" && <div className="atl-cursor">█</div>}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Scheduling ───────────────────────────────────────────────

interface Schedule {
  id: string;
  kpiId: string;
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  kpi: { code: string; title: string; agent: string };
}

function SchedulingSection({ kpis }: { kpis: Kpi[] }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [cronTriggering, setCronTriggering] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents/schedule").then((r) => r.ok ? r.json() : []).then(setSchedules);
  }, []);

  async function triggerCronNow() {
    setCronTriggering(true);
    setCronResult(null);
    const secret = prompt("CRON_SECRET eingeben (nur für Administratoren):");
    if (!secret) { setCronTriggering(false); return; }
    const res = await fetch("/api/cron/run-scheduled-agents", {
      method: "POST",
      headers: { "x-cron-secret": secret },
    });
    const data = await res.json();
    if (res.ok) {
      setCronResult(`✓ ${data.ran} Agent${data.ran !== 1 ? "en" : ""} gestartet (${data.totalDueKpis} fällig, ${data.durationMs}ms)`);
      fetch("/api/agents/schedule").then((r) => r.ok ? r.json() : []).then(setSchedules);
    } else {
      setCronResult(`✗ ${data.error ?? "Fehler"}`);
    }
    setCronTriggering(false);
  }

  async function updateSchedule(kpiId: string, patch: { enabled?: boolean; intervalHours?: number }) {
    setSaving((s) => ({ ...s, [kpiId]: true }));
    const current = schedules.find((s) => s.kpiId === kpiId);
    const body = {
      kpiId,
      enabled: patch.enabled ?? current?.enabled ?? false,
      intervalHours: patch.intervalHours ?? current?.intervalHours ?? 24,
    };
    const res = await fetch("/api/agents/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setSchedules((prev) => {
        const idx = prev.findIndex((s) => s.kpiId === kpiId);
        if (idx >= 0) { const next = [...prev]; next[idx] = { ...next[idx], ...updated }; return next; }
        const kpi = kpis.find((k) => k.id === kpiId);
        return [...prev, { ...updated, kpi: { code: kpi?.code ?? "", title: kpi?.title ?? "", agent: kpi?.agent ?? "" } }];
      });
    }
    setSaving((s) => ({ ...s, [kpiId]: false }));
  }

  const scheduleMap = Object.fromEntries(schedules.map((s) => [s.kpiId, s]));

  const enabledCount = schedules.filter((s) => s.enabled).length;
  const dueNow = schedules.filter((s) => s.enabled && s.nextRunAt && new Date(s.nextRunAt) <= new Date()).length;

  return (
    <div className="schedule-section">
      <div className="schedule-title-row">
        <div>
          <div className="schedule-title">Automatische Ausführung</div>
          <div className="schedule-subtitle">
            {enabledCount > 0
              ? `${enabledCount} aktiv · ${dueNow > 0 ? `${dueNow} jetzt fällig` : "alle aktuell"}`
              : "Keine aktiven Zeitpläne"}
          </div>
        </div>
        <button
          className={`btn btn-ghost${cronTriggering ? " btn-loading" : ""}`}
          onClick={triggerCronNow}
          disabled={cronTriggering}
          title="Alle fälligen Agenten jetzt manuell starten (erfordert CRON_SECRET)"
          style={{ fontSize: 12 }}
        >
          {cronTriggering ? "Starte…" : "▶ Jetzt ausführen"}
        </button>
      </div>

      {cronResult && (
        <div className={`schedule-cron-result${cronResult.startsWith("✓") ? " schedule-cron-ok" : " schedule-cron-err"}`}>
          {cronResult}
        </div>
      )}

      <div className="schedule-table">
        {kpis.map((kpi) => {
          const sched = scheduleMap[kpi.id];
          const enabled = sched?.enabled ?? false;
          const intervalHours = sched?.intervalHours ?? 24;
          const nextRunAt = sched?.nextRunAt ? new Date(sched.nextRunAt) : null;
          const lastRunAt = sched?.lastRunAt ? new Date(sched.lastRunAt) : null;
          const isDue = enabled && nextRunAt && nextRunAt <= new Date();
          return (
            <div key={kpi.id} className={`schedule-row${isDue ? " schedule-row-due" : ""}`}>
              <div className="schedule-row-info">
                <span className="schedule-code">{kpi.code}</span>
                <span className="schedule-agent">{kpi.agent}</span>
                {lastRunAt && (
                  <span className="schedule-last-run" title={`Zuletzt: ${lastRunAt.toLocaleString("de-DE")}`}>
                    {lastRunAt.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                {isDue && <span className="schedule-due-badge">Fällig</span>}
              </div>
              <div className="schedule-controls">
                <button
                  className={`schedule-toggle${enabled ? " schedule-toggle-on" : ""}`}
                  onClick={() => updateSchedule(kpi.id, { enabled: !enabled })}
                  disabled={saving[kpi.id]}
                >
                  {enabled ? "Ein" : "Aus"}
                </button>
                <select
                  className="schedule-interval"
                  value={intervalHours}
                  disabled={!enabled || saving[kpi.id]}
                  onChange={(e) => updateSchedule(kpi.id, { intervalHours: Number(e.target.value) })}
                >
                  <option value={1}>Stündlich</option>
                  <option value={6}>Alle 6 Std.</option>
                  <option value={12}>Alle 12 Std.</option>
                  <option value={24}>Täglich</option>
                  <option value={168}>Wöchentlich</option>
                  <option value={720}>Monatlich</option>
                </select>
                {enabled && nextRunAt && (
                  <span className="schedule-next-run">
                    {isDue ? "Jetzt fällig" : `nächste: ${nextRunAt.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main view ────────────────────────────────────────────────

export function AgentsView({ kpis, onKpisUpdated }: { kpis: Kpi[]; onKpisUpdated?: () => void }) {
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [activeKpiId, setActiveKpiId] = useState<string | null>(null);
  const abortRefs = useRef<Record<string, AbortController>>({});

  const agentGroups = kpis.reduce<Record<string, Kpi[]>>((acc, k) => {
    acc[k.agent] = acc[k.agent] ?? [];
    acc[k.agent].push(k);
    return acc;
  }, {});

  const running = kpis.filter((k) => k.status === "running").length;
  const total = Object.keys(agentGroups).length;

  const addLog = useCallback((kpiId: string, kind: LogLine["kind"], msg: string) => {
    setRuns((prev) => {
      const run = prev[kpiId];
      if (!run) return prev;
      return { ...prev, [kpiId]: { ...run, log: [...run.log, { ts: nowTs(), kind, msg }] } };
    });
  }, []);

  const startAgent = useCallback(async (kpiId: string) => {
    abortRefs.current[kpiId]?.abort();
    const ctrl = new AbortController();
    abortRefs.current[kpiId] = ctrl;

    const initLog: LogLine[] = [{ ts: nowTs(), kind: "info", msg: "Initialisiere 4-Stage Agent Pipeline…" }];
    setRuns((prev) => ({
      ...prev,
      [kpiId]: { kpiId, status: "streaming", text: "", stages: initStages(), log: initLog },
    }));
    setActiveKpiId(kpiId);

    try {
      const res = await fetch(`/api/agents/${kpiId}`, { method: "POST", signal: ctrl.signal });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Verbindungsfehler" }));
        setRuns((prev) => ({ ...prev, [kpiId]: { kpiId, status: "error", text: "", error: err.error, stages: [], log: [{ ts: nowTs(), kind: "error", msg: err.error }] } }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = JSON.parse(line.slice(6));

          if (chunk.type === "stage_start") {
            const stageDef = STAGE_DEFS.find((d) => d.id === chunk.stage);
            addLog(kpiId, "stage", `▶ Stage ${stageDef?.icon ?? ""} ${stageDef?.label ?? chunk.stage} gestartet — ${chunk.label ?? stageDef?.description}`);
            setRuns((prev) => {
              const run = prev[kpiId] ?? { kpiId, status: "streaming", text: "", stages: initStages(), log: [] };
              return {
                ...prev,
                [kpiId]: {
                  ...run,
                  currentStage: chunk.stage,
                  stages: run.stages.map((s) =>
                    s.id === chunk.stage
                      ? { ...s, status: "running", label: chunk.label, agentName: chunk.agentName ?? s.agentName }
                      : s
                  ),
                },
              };
            });
          } else if (chunk.type === "stage_done") {
            const stageDef = STAGE_DEFS.find((d) => d.id === chunk.stage);
            addLog(kpiId, "done", `✓ ${stageDef?.label ?? chunk.stage} abgeschlossen${chunk.stageSummary ? ` — ${chunk.stageSummary.slice(0, 80)}` : ""}`);
            setRuns((prev) => {
              const run = prev[kpiId];
              if (!run) return prev;
              return {
                ...prev,
                [kpiId]: {
                  ...run,
                  stages: run.stages.map((s) =>
                    s.id === chunk.stage
                      ? { ...s, status: "done", summary: chunk.stageSummary }
                      : s
                  ),
                },
              };
            });
          } else if (chunk.type === "text") {
            setRuns((prev) => ({
              ...prev,
              [kpiId]: { ...prev[kpiId], text: (prev[kpiId]?.text ?? "") + chunk.content },
            }));
          } else if (chunk.type === "done") {
            addLog(kpiId, "done", `✓ Analyse abgeschlossen — Status: ${chunk.result?.status?.toUpperCase() ?? "OK"} · Konfidenz: ${Math.round((chunk.result?.confidence ?? 0) * 100)}%`);
            setRuns((prev) => ({
              ...prev,
              [kpiId]: { ...prev[kpiId], status: "done", result: chunk.result, currentStage: undefined },
            }));
            onKpisUpdated?.();
          } else if (chunk.type === "error") {
            addLog(kpiId, "error", `✗ Fehler: ${chunk.error}`);
            setRuns((prev) => ({
              ...prev,
              [kpiId]: { ...prev[kpiId], status: "error", error: chunk.error },
            }));
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setRuns((prev) => ({
        ...prev,
        [kpiId]: { ...prev[kpiId], kpiId, status: "error", text: "", error: String(err), stages: prev[kpiId]?.stages ?? [], log: [...(prev[kpiId]?.log ?? []), { ts: nowTs(), kind: "error", msg: String(err) }] },
      }));
    }
  }, [onKpisUpdated, addLog]);

  const activeRun = activeKpiId ? runs[activeKpiId] : null;
  const activeKpi = activeKpiId ? kpis.find((k) => k.id === activeKpiId) : null;

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">KI-Agenten</h2>
          <p className="view-sub">{total} autonome Prüf-Agenten · {running} gerade aktiv</p>
        </div>
        <a href="/settings" className="btn-settings-link">⚙ Einstellungen</a>
      </div>

      <div className="agents-stats">
        <div className="agent-stat-card"><div className="asc-num">{total}</div><div className="asc-label">Agenten gesamt</div></div>
        <div className="agent-stat-card agent-stat-ok"><div className="asc-num">{kpis.filter((k) => k.status === "ok").length}</div><div className="asc-label">Ohne Befund</div></div>
        <div className="agent-stat-card agent-stat-running"><div className="asc-num">{running}</div><div className="asc-label">Läuft gerade</div></div>
        <div className="agent-stat-card agent-stat-alert"><div className="asc-num">{kpis.filter((k) => k.status === "finding").length}</div><div className="asc-label">Finding ausgelöst</div></div>
      </div>

      <div className="agents-layout">
        {/* Agent cards */}
        <div className="agents-grid">
          {Object.entries(agentGroups).map(([agentName, agentKpis]) => {
            const kpi = agentKpis[0];
            const avgConf = agentKpis.filter((k) => k.confidence > 0).reduce((s, k) => s + k.confidence, 0) /
              Math.max(agentKpis.filter((k) => k.confidence > 0).length, 1);
            const run = runs[kpi.id];
            const isStreaming = run?.status === "streaming";
            const currentStageDef = run?.currentStage ? STAGE_DEFS.find((d) => d.id === run.currentStage) : null;

            return (
              <div
                key={agentName}
                className={`agent-card agent-card-${kpi.status}${activeKpiId === kpi.id ? " agent-card-selected" : ""}`}
                onClick={() => setActiveKpiId(kpi.id)}
              >
                <div className="agent-card-head">
                  <div className={`agent-icon${isStreaming ? " agent-icon-pulse" : ""}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="agent-name">{agentName}</div>
                    <div className="agent-kpi-ref">{agentKpis.map((k) => <AreaTag key={k.id} areaId={k.area} />)}</div>
                  </div>
                  <StatusPill status={isStreaming ? "running" : kpi.status} />
                </div>

                <div className="agent-card-body">
                  <div className="agent-kpi-title">{agentKpis.map((k) => k.code).join(", ")} · {kpi.title}</div>
                  {isStreaming && currentStageDef && (
                    <div className="agent-stage-badge">
                      {currentStageDef.icon} {currentStageDef.label} läuft…
                    </div>
                  )}
                  <div className="agent-meta-row">
                    <span className="agent-meta-item">
                      <span className="agent-meta-label">Konfidenz</span>
                      <Confidence value={avgConf} />
                    </span>
                    <span className="agent-meta-item">
                      <span className="agent-meta-label">Letzter Lauf</span>
                      <span className="agent-meta-val">{kpi.lastRun}</span>
                    </span>
                  </div>
                </div>

                <div className="agent-card-foot">
                  <button
                    className={`agent-run-btn${isStreaming ? " agent-run-btn-running" : ""}`}
                    onClick={(e) => { e.stopPropagation(); startAgent(kpi.id); }}
                    disabled={isStreaming}
                  >
                    {isStreaming ? (
                      <><span className="login-spinner" style={{ width: 12, height: 12 }} /> Analysiert…</>
                    ) : (
                      <>▶ 4-Stage Agent starten</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live output panel */}
        {activeKpi && (
          <div className="agent-output-panel">
            <div className="agent-output-head">
              <div>
                <div className="agent-output-title">{activeKpi.agent}</div>
                <div className="agent-output-sub">{activeKpi.code} · {activeKpi.title}</div>
              </div>
              {activeRun?.status === "done" && activeRun.result && (
                <div className={`agent-result-badge agent-result-${activeRun.result.status}`}>
                  {activeRun.result.status === "ok" ? "✓ OK" : activeRun.result.status === "review" ? "⚠ Review" : "⛔ Finding"}
                </div>
              )}
            </div>

            {/* Stage pipeline progress */}
            {activeRun && activeRun.stages.length > 0 && (
              <StagePipeline stages={activeRun.stages} currentStage={activeRun.currentStage} />
            )}

            {!activeRun && (
              <div className="agent-output-empty">
                <p>Klicke auf „4-Stage Agent starten" um eine mehrstufige KI-Prüfung zu starten.</p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--ink-3)" }}>
                  Scout → Analyst → Cross-Checker → Risk-Rater · Spezialisierter Experte für {activeKpi.code}
                </p>
              </div>
            )}

            {activeRun?.status === "error" && (
              <div className="agent-output-error">
                <strong>Fehler:</strong> {activeRun.error}
                {activeRun.error?.includes("API-Key") && (
                  <div style={{ marginTop: "8px" }}>
                    <a href="/settings?tab=apikeys" className="agent-setup-link">
                      → Jetzt API-Key in den Einstellungen hinterlegen
                    </a>
                  </div>
                )}
              </div>
            )}

            {activeRun && activeRun.status !== "error" && (
              <div className="agent-output-body">
                {activeRun.result ? (
                  <AgentResultDisplay result={activeRun.result} />
                ) : (
                  activeRun.currentStage && (
                    <pre className="agent-stream-pre">{activeRun.text}<span className="agent-cursor">▋</span></pre>
                  )
                )}
              </div>
            )}

            {/* Live terminal log */}
            {activeRun && activeRun.log.length > 0 && (
              <AgentTerminal log={activeRun.log} status={activeRun.status} />
            )}
          </div>
        )}
      </div>

      <SchedulingSection kpis={kpis} />
    </div>
  );
}
