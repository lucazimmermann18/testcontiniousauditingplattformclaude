import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { streamAgentResponse } from "@/lib/agents/provider";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, history } = await req.json() as {
    message: string;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim()) return NextResponse.json({ error: "Keine Nachricht" }, { status: 400 });

  // Load full audit context
  const [kpis, findings, auditRuns] = await Promise.all([
    db.kpi.findMany({
      include: {
        area: true,
        owner: { select: { name: true } },
        auditRuns: {
          where: { status: { not: "running" } },
          orderBy: { finishedAt: "desc" },
          take: 1,
          select: { summary: true, confidence: true, finishedAt: true },
        },
      },
    }),
    db.finding.findMany({
      where: { status: { not: "geschlossen" } },
      include: { kpi: { select: { code: true } } },
      orderBy: { severity: "asc" },
    }),
    db.auditRun.aggregate({
      _count: { id: true },
      _avg:   { confidence: true },
    }),
  ]);

  const kpiSummary = kpis.map((k) => {
    const lastRun = k.auditRuns[0];
    return `${k.code} [${k.area.name}] Status:${k.status} Konfidenz:${Math.round(k.confidence * 100)}% Risiko:${k.risk}/5 Owner:${k.owner.name}${lastRun?.summary ? ` Letzter Befund:"${lastRun.summary.slice(0, 80)}"` : ""}`;
  }).join("\n");

  const findingSummary = findings.map((f) =>
    `${f.kpi.code} FINDING[${f.severity}]: ${f.title} — ${f.desc.slice(0, 100)}`
  ).join("\n");

  const systemPrompt = `Du bist der KI-Audit-Assistent der Continuum Audit Plattform. Du unterstützt Revisoren und Fachbereichsleiter bei ihrer täglichen Arbeit.

## Deine Fähigkeiten
- Analyse der aktuellen KPI- und Finding-Lage
- Entwurf von Prüfungsmitteilungen, Management Responses und Stellungnahmen
- Risikoeinschätzungen und Priorisierungsempfehlungen
- Erklärung von Audit-Befunden in verständlicher Sprache
- Hilfe beim Formulieren von Maßnahmenplänen

## Aktuelle Audit-Datenlage (${new Date().toLocaleDateString("de-DE")})

### KPI-Übersicht (${kpis.length} KPIs)
OK: ${kpis.filter((k) => k.status === "ok").length} | Review: ${kpis.filter((k) => k.status === "review").length} | Finding: ${kpis.filter((k) => k.status === "finding").length} | Laufend: ${kpis.filter((k) => k.status === "running").length}
Ø Konfidenz: ${Math.round(kpis.filter((k) => k.confidence > 0).reduce((s, k) => s + k.confidence, 0) / Math.max(kpis.filter((k) => k.confidence > 0).length, 1) * 100)}%
Gesamt Prüfläufe: ${auditRuns._count.id}

### Alle KPIs
${kpiSummary}

${findings.length > 0 ? `### Offene Findings (${findings.length})
${findingSummary}` : "### Keine offenen Findings"}

## Verhaltensregeln
- Antworte auf Deutsch, professionell und präzise
- Bei konkreten Fragen zu KPIs: Nutze die echten Daten aus dem Kontext
- Bei Drafting-Aufgaben: Erstelle vollständige, professionelle Texte
- Bei Risikoanalysen: Priorisiere nach Schweregrad und Systemwirkung
- Verweise auf konkrete KPI-Codes wenn möglich (z.B. LGL-03, REW-01)`;

  // Build conversation with history
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...history.slice(-6), // last 3 exchanges for context
    { role: "user", content: message },
  ];

  const userPrompt = messages.map((m) => `${m.role === "user" ? "Nutzer" : "Assistent"}: ${m.content}`).join("\n\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAgentResponse(systemPrompt, userPrompt)) {
          if (chunk.type === "text") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "text", content: chunk.content })}\n\n`));
          } else if (chunk.type === "error") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: chunk.error })}\n\n`));
            break;
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
