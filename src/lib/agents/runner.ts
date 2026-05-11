import { db } from "@/lib/db";
import { emit } from "@/lib/events";
import { callAgentOnce, streamAgentResponse } from "./provider";
import {
  getSpecialist,
  buildScoutSystem, buildScoutUser,
  buildAnalystSystem, buildAnalystUser,
  buildCrossCheckerSystem, buildCrossCheckerUser,
  buildRiskRaterSystem, buildRiskRaterUser,
} from "./prompts";
import { MOCK_DATA } from "./mock-data";
import type { AgentResult, AgentContext, StageResult, StreamChunk } from "./types";

// ── Helpers ──────────────────────────────────────────────────

function parseJSON<T>(raw: string): T {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Kein gültiges JSON in Agent-Antwort");
  return JSON.parse(m[0]) as T;
}

async function buildContext(kpiId: string): Promise<AgentContext> {
  const kpi = await db.kpi.findUnique({
    where: { id: kpiId },
    include: { area: true, mockData: true, dataSource: true },
  });
  if (!kpi) throw new Error(`KPI ${kpiId} nicht gefunden`);

  let dataDescription: string;
  let data: unknown;
  let dataSourceLabel = "Mock-Daten";

  if (kpi.dataSource?.active && kpi.dataSource.lastData) {
    try {
      data = JSON.parse(kpi.dataSource.lastData);
      dataDescription = `Echtdaten aus "${kpi.dataSource.name}" (${kpi.dataSource.type}), abgerufen am ${kpi.dataSource.lastFetchedAt?.toLocaleString("de-DE") ?? "unbekannt"}`;
      dataSourceLabel = kpi.dataSource.name;
    } catch { /* fall through */ }
  }

  if (data === undefined) {
    const mockEntry = kpi.mockData
      ? { description: kpi.mockData.description, data: JSON.parse(kpi.mockData.data) }
      : MOCK_DATA[kpi.code] ?? { description: "Keine Daten verfügbar", data: {} };
    dataDescription = mockEntry.description;
    data = mockEntry.data;
  }

  return {
    kpiCode: kpi.code,
    kpiTitle: kpi.title,
    kpiDesc: kpi.desc,
    agentName: kpi.agent,
    area: kpi.area.name,
    areaCode: kpi.code,
    currentValue: kpi.value,
    delta: kpi.delta,
    trend: JSON.parse(kpi.trend || "[]"),
    mockDataDescription: dataDescription!,
    mockData: data,
    dataSourceLabel,
  };
}

async function getHistoricalRuns(kpiId: string) {
  return db.auditRun.findMany({
    where: { kpiId, status: { not: "running" }, finishedAt: { not: null } },
    orderBy: { finishedAt: "desc" },
    take: 3,
    select: { status: true, summary: true, finishedAt: true },
  });
}

async function getRelatedKpis(kpiCode: string) {
  const prefix = kpiCode.split("-")[0];
  const related = await db.kpi.findMany({
    where: { code: { startsWith: prefix }, NOT: { code: kpiCode } },
    select: { code: true, status: true, title: true },
    take: 5,
  });
  return related;
}

// ── Multi-stage streaming pipeline ───────────────────────────

export async function* streamAgent(kpiId: string): AsyncGenerator<StreamChunk> {
  const ctx = await buildContext(kpiId);
  const specialist = getSpecialist(ctx.kpiCode);
  const startedAt = new Date();
  const stages: StageResult[] = [];
  let raw = "";

  const auditRun = await db.auditRun.create({
    data: { kpiId, agent: ctx.agentName, status: "running" },
  });

  try {
    // ─── Stage 1: Scout ───────────────────────────────────────
    yield {
      type: "stage_start",
      stage: "scout",
      label: "Scout scannt Datenmuster…",
      agentName: `Scout · ${specialist.role}`,
    };

    const scoutRaw = await callAgentOnce(
      buildScoutSystem(specialist),
      buildScoutUser(ctx)
    );

    let scoutFindings: string[] = [];
    let primaryRisk = "";
    try {
      const scoutResult = parseJSON<{ initialFindings: string[]; primaryRiskArea: string }>(scoutRaw);
      scoutFindings = scoutResult.initialFindings ?? [];
      primaryRisk = scoutResult.primaryRiskArea ?? "";
    } catch {
      scoutFindings = ["Daten wurden gescannt — manuelle Überprüfung empfohlen"];
    }

    const scoutStage: StageResult = {
      stage: "scout",
      label: "Scout · Datenscan",
      agentName: `Scout · ${specialist.role}`,
      summary: primaryRisk || "Datenscan abgeschlossen",
      keyFindings: scoutFindings.slice(0, 5),
    };
    stages.push(scoutStage);
    yield { type: "stage_done", stage: "scout", stageSummary: scoutStage.summary };

    // ─── Stage 2: Analyst (streamed) ──────────────────────────
    yield {
      type: "stage_start",
      stage: "analyst",
      label: "Analyst untersucht Auffälligkeiten…",
      agentName: `Analyst · ${specialist.role}`,
    };

    let analystRaw = "";
    for await (const chunk of streamAgentResponse(
      buildAnalystSystem(specialist),
      buildAnalystUser(ctx, scoutFindings)
    )) {
      if (chunk.type === "text") {
        analystRaw += chunk.content;
        raw += chunk.content;
        yield { type: "text", content: chunk.content };
      } else if (chunk.type === "error") {
        yield { type: "error", error: chunk.error };
        return;
      }
    }

    let deepFindings: unknown[] = [];
    let analystSummary = "";
    try {
      const analystResult = parseJSON<{ deepFindings: unknown[]; analystSummary: string }>(analystRaw);
      deepFindings = analystResult.deepFindings ?? [];
      analystSummary = analystResult.analystSummary ?? "";
    } catch {
      analystSummary = "Tiefenanalyse abgeschlossen";
    }

    const analystStage: StageResult = {
      stage: "analyst",
      label: "Analyst · Tiefenanalyse",
      agentName: `Analyst · ${specialist.role}`,
      summary: analystSummary,
      keyFindings: deepFindings.slice(0, 3).map((f: any) => f.title ?? String(f)),
    };
    stages.push(analystStage);
    yield { type: "stage_done", stage: "analyst", stageSummary: analystStage.summary };

    // ─── Stage 3: Cross-Checker ───────────────────────────────
    yield {
      type: "stage_start",
      stage: "cross_checker",
      label: "Cross-Checker prüft historischen Kontext…",
      agentName: "Cross-Checker · Kontextanalyse",
    };

    const [historicalRuns, relatedKpis] = await Promise.all([
      getHistoricalRuns(kpiId),
      getRelatedKpis(ctx.kpiCode),
    ]);

    const crossRaw = await callAgentOnce(
      buildCrossCheckerSystem(),
      buildCrossCheckerUser(ctx, analystSummary, historicalRuns, relatedKpis)
    );

    let historicalAssessment = "";
    let crossCheckerSummary = "";
    let systemicRisk = false;
    let crossKpiInsights = "";
    try {
      const crossResult = parseJSON<{
        historicalAssessment: string;
        systemicRisk: boolean;
        crossKpiRelevance: string;
        crossCheckerSummary: string;
      }>(crossRaw);
      historicalAssessment = crossResult.historicalAssessment ?? "";
      crossCheckerSummary = crossResult.crossCheckerSummary ?? "";
      systemicRisk = crossResult.systemicRisk ?? false;
      crossKpiInsights = crossResult.crossKpiRelevance ?? "";
    } catch {
      crossCheckerSummary = "Kontext-Check abgeschlossen";
    }

    const crossStage: StageResult = {
      stage: "cross_checker",
      label: "Cross-Checker · Kontext",
      agentName: "Cross-Checker · Kontextanalyse",
      summary: crossCheckerSummary,
      keyFindings: [
        historicalAssessment || "Keine historischen Vergleichsdaten",
        systemicRisk ? "Systemisches Risiko erkannt" : "Kein systemisches Risiko",
      ].filter(Boolean),
    };
    stages.push(crossStage);
    yield { type: "stage_done", stage: "cross_checker", stageSummary: crossStage.summary };

    // ─── Stage 4: Risk-Rater (streamed final verdict) ─────────
    yield {
      type: "stage_start",
      stage: "risk_rater",
      label: "Risk-Rater erstellt finales Prüfungsurteil…",
      agentName: `Risk-Rater · ${specialist.role}`,
    };

    let riskRaw = "";
    for await (const chunk of streamAgentResponse(
      buildRiskRaterSystem(specialist),
      buildRiskRaterUser(ctx, scoutFindings, analystSummary, deepFindings, crossCheckerSummary, historicalAssessment, systemicRisk)
    )) {
      if (chunk.type === "text") {
        riskRaw += chunk.content;
        raw += chunk.content;
        yield { type: "text", content: chunk.content };
      } else if (chunk.type === "error") {
        yield { type: "error", error: chunk.error };
        return;
      }
    }

    const result = parseJSON<AgentResult>(riskRaw);
    const riskRaterSummary = (result as any).riskRaterSummary ?? result.summary;

    const riskStage: StageResult = {
      stage: "risk_rater",
      label: "Risk-Rater · Urteil",
      agentName: `Risk-Rater · ${specialist.role}`,
      summary: riskRaterSummary,
      keyFindings: result.recommendations?.slice(0, 2) ?? [],
    };
    stages.push(riskStage);
    yield { type: "stage_done", stage: "risk_rater", stageSummary: riskStage.summary };

    // ─── Compose final result ─────────────────────────────────
    const finalResult: AgentResult = {
      ...result,
      stages,
      historicalTrend: historicalAssessment || undefined,
      crossKpiInsights: crossKpiInsights || undefined,
    };

    const durationMs = Date.now() - startedAt.getTime();

    await db.auditRun.update({
      where: { id: auditRun.id },
      data: {
        status: result.status as any,
        confidence: result.confidence,
        summary: result.summary,
        rawOutput: raw.slice(0, 50000),
        finishedAt: new Date(),
        durationMs,
      },
    });

    await db.kpi.update({
      where: { id: kpiId },
      data: { status: result.status as any, confidence: result.confidence, lastRun: "vor wenigen Sek." },
    });

    await db.activity.create({
      data: {
        type: result.status === "finding" ? "finding" : result.status === "ok" ? "approved" : "agent",
        kpiId,
        message: `${ctx.agentName} (4-Stage): ${result.summary}`,
      },
    });

    if (result.status === "finding" && result.anomalies.length > 0) {
      const kpiOwner = await db.kpi.findUnique({ where: { id: kpiId }, select: { ownerId: true } });
      if (kpiOwner) {
        await db.finding.create({
          data: {
            kpiId,
            title: result.anomalies[0].title,
            desc: result.summary,
            severity: result.anomalies[0].severity as any,
            ownerId: kpiOwner.ownerId,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    await db.agentSchedule.upsert({
      where: { kpiId },
      create: { kpiId, lastRunAt: new Date(), nextRunAt: null },
      update: { lastRunAt: new Date() },
    });

    // Push real-time SSE event to all connected clients
    emit({ type: "agent_done", kpiId, kpiCode: ctx.kpiCode, status: result.status, summary: result.summary });

    yield { type: "done", result: finalResult };
  } catch (err) {
    await db.auditRun.update({
      where: { id: auditRun.id },
      data: { status: "error", finishedAt: new Date() },
    }).catch(() => {});
    yield { type: "error", error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getLastAuditRun(kpiId: string) {
  return db.auditRun.findFirst({
    where: { kpiId, status: { not: "running" } },
    orderBy: { finishedAt: "desc" },
  });
}

export async function getDueScheduledKpis(): Promise<string[]> {
  const now = new Date();
  const schedules = await db.agentSchedule.findMany({
    where: { enabled: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
  });
  return schedules.map((s) => s.kpiId);
}
