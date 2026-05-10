import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OwnerPortalClient } from "./OwnerPortalClient";

export const metadata = { title: "Mein Bereich · Continuum Audit" };

export default async function OwnerPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const [myKpis, myFindings, myResponses] = await Promise.all([
    db.kpi.findMany({
      where: { ownerId: userId },
      include: {
        area: true,
        findings: {
          where: { status: { not: "geschlossen" } },
          select: { id: true, title: true, severity: true, status: true, dueDate: true },
        },
        auditRuns: {
          where: { status: { not: "running" } },
          orderBy: { finishedAt: "desc" },
          take: 1,
          select: { summary: true, confidence: true, status: true, finishedAt: true },
        },
      },
      orderBy: [{ area: { id: "asc" } }, { code: "asc" }],
    }),
    db.finding.findMany({
      where: { ownerId: userId, status: { not: "geschlossen" } },
      include: {
        kpi: { select: { code: true, title: true, area: true } },
        response: { select: { status: true, aiScore: true, submittedAt: true } },
      },
      orderBy: { openedAt: "desc" },
    }),
    db.findingResponse.findMany({
      where: {
        finding: { ownerId: userId },
        status: { in: ["submitted", "rejected"] },
      },
      include: {
        finding: { select: { title: true, severity: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const data = {
    kpis: myKpis.map((k) => ({
      id: k.id,
      code: k.code,
      areaName: k.area.name,
      areaId: k.area.id,
      title: k.title,
      desc: k.desc,
      risk: k.risk,
      status: k.status,
      confidence: k.confidence,
      value: k.value,
      delta: k.delta,
      lastRun: k.lastRun,
      openFindings: k.findings.length,
      lastRunSummary: k.auditRuns[0]?.summary ?? null,
      lastRunStatus: k.auditRuns[0]?.status ?? null,
      lastRunConf: k.auditRuns[0]?.confidence ?? null,
    })),
    findings: myFindings.map((f) => ({
      id: f.id,
      kpiCode: f.kpi.code,
      kpiTitle: f.kpi.title,
      areaId: f.kpi.area.id,
      title: f.title,
      severity: f.severity,
      status: f.status,
      dueDate: f.dueDate.toISOString(),
      responseStatus: f.response?.status ?? null,
      aiScore: f.response?.aiScore ?? null,
    })),
    pendingResponses: myResponses.map((r) => ({
      id: r.id,
      findingTitle: r.finding.title,
      severity: r.finding.severity,
      status: r.status,
      aiScore: r.aiScore,
      reviewerNote: r.reviewerNote,
    })),
    userName: session.user.name ?? "Owner",
  };

  return <OwnerPortalClient data={data} />;
}
