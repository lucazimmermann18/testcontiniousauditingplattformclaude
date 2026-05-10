import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CURRENT_QUARTER } from "@/data/audit-data";
import { ReportClient } from "./ReportClient";

export const metadata = { title: `Audit-Bericht ${CURRENT_QUARTER} · Continuum Audit` };

export default async function ReportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [kpis, findings, auditRuns, allUsers] = await Promise.all([
    db.kpi.findMany({
      include: {
        area: true,
        owner: { select: { name: true } },
        reviewer: { select: { name: true } },
        auditRuns: {
          where: { status: { not: "running" } },
          orderBy: { finishedAt: "desc" },
          take: 1,
          select: { status: true, confidence: true, summary: true, finishedAt: true, durationMs: true },
        },
      },
      orderBy: [{ area: { id: "asc" } }, { code: "asc" }],
    }),
    db.finding.findMany({
      where: { status: { not: "geschlossen" } },
      include: {
        kpi: { select: { code: true, title: true } },
      },
      orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
    }),
    db.auditRun.findMany({
      where: { finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      take: 50,
      select: { status: true, finishedAt: true },
    }),
    db.user.findMany({ select: { id: true, name: true } }),
  ]);

  const userMap = Object.fromEntries(allUsers.map((u) => [u.id, u.name]));

  const statusCounts = {
    ok: kpis.filter((k) => k.status === "ok").length,
    review: kpis.filter((k) => k.status === "review").length,
    finding: kpis.filter((k) => k.status === "finding").length,
    pending: kpis.filter((k) => k.status === "pending" || k.status === "running").length,
  };

  const avgConfidence = kpis.filter((k) => k.confidence > 0).reduce((acc, k, _, arr) =>
    acc + k.confidence / arr.length, 0);

  const openFindings = findings.length;
  const criticalFindings = findings.filter((f) => f.severity === "hoch").length;

  const mappedKpis = kpis.map((k) => ({
    id: k.id,
    code: k.code,
    title: k.title,
    areaName: k.area.name,
    areaShort: k.area.short,
    areaColor: k.area.color,
    risk: k.risk,
    status: k.status,
    confidence: k.confidence,
    value: k.value,
    delta: k.delta,
    owner: k.owner.name,
    reviewer: k.reviewer.name,
    lastRunSummary: k.auditRuns[0]?.summary ?? null,
    lastRunAt: k.auditRuns[0]?.finishedAt?.toISOString() ?? null,
  }));

  const mappedFindings = findings.map((f) => ({
    id: f.id,
    title: f.title,
    desc: f.desc,
    severity: f.severity,
    status: f.status,
    kpiCode: f.kpi?.code ?? "—",
    kpiTitle: f.kpi?.title ?? "—",
    owner: userMap[f.ownerId] ?? "—",
    createdAt: f.createdAt.toISOString(),
    dueDate: f.dueDate?.toISOString() ?? null,
  }));

  return (
    <ReportClient
      quarter={CURRENT_QUARTER}
      generatedAt={new Date().toISOString()}
      statusCounts={statusCounts}
      avgConfidence={avgConfidence}
      openFindings={openFindings}
      criticalFindings={criticalFindings}
      kpis={mappedKpis}
      findings={mappedFindings}
      totalRuns={auditRuns.length}
    />
  );
}
