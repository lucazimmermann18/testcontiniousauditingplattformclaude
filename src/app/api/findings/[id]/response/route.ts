import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { callAgentOnce } from "@/lib/agents/provider";
import { sendResponseSubmittedEmail, sendResponseReviewedEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

const SubmitSchema = z.object({
  content:     z.string().min(20, "Mindestens 20 Zeichen"),
  responsible: z.string().min(2),
  plannedDate: z.string(),
  action:      z.enum(["save_draft", "submit"]).default("submit"),
});

const ReviewSchema = z.object({
  action:      z.enum(["accept", "reject"]),
  reviewerNote: z.string().max(500).optional(),
});

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const response = await db.findingResponse.findUnique({ where: { findingId: id } });
  return NextResponse.json(response);
}

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Reviewer accept/reject
  if (body.action === "accept" || body.action === "reject") {
    const role = (session.user as any).role as string;
    if (role !== "reviewer" && role !== "head_of_audit" && role !== "admin") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const existing = await db.findingResponse.findUnique({ where: { findingId: id } });
    if (!existing) return NextResponse.json({ error: "Keine Stellungnahme vorhanden" }, { status: 404 });

    const updated = await db.findingResponse.update({
      where: { findingId: id },
      data: {
        status:       parsed.data.action === "accept" ? "accepted" : "rejected",
        reviewerNote: parsed.data.reviewerNote,
        reviewedAt:   new Date(),
      },
    });

    const finding = await db.finding.findUnique({
      where: { id },
      select: { title: true, kpiId: true, ownerId: true },
    });

    if (finding) {
      if (parsed.data.action === "accept") {
        await db.finding.update({ where: { id }, data: { status: "geschlossen" } });
      }
      await db.activity.create({
        data: {
          type:    "approved",
          kpiId:   finding.kpiId,
          userId:  session.user!.id,
          message: `Stellungnahme ${parsed.data.action === "accept" ? "akzeptiert" : "abgelehnt"}: ${finding.title}`,
        },
      });
      await db.notification.create({
        data: {
          userId:   finding.ownerId,
          type:     "approval_done",
          message:  `Ihre Stellungnahme zu „${finding.title}" wurde ${parsed.data.action === "accept" ? "akzeptiert ✓" : "zurückgewiesen ✗"}.`,
          metadata: JSON.stringify({ findingId: id }),
        },
      });
      // Send email to owner
      const owner = await db.user.findUnique({ where: { id: finding.ownerId }, select: { email: true, name: true } });
      if (owner) {
        sendResponseReviewedEmail({
          toEmail: owner.email, toName: owner.name,
          findingTitle: finding.title,
          accepted: parsed.data.action === "accept",
          reviewerNote: parsed.data.reviewerNote,
        }).catch(() => {});
      }
    }

    return NextResponse.json(updated);
  }

  // Business owner submit/draft
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const finding = await db.finding.findUnique({
    where: { id },
    include: { kpi: { select: { code: true, title: true, area: { select: { name: true } } } } },
  });
  if (!finding) return NextResponse.json({ error: "Finding nicht gefunden" }, { status: 404 });

  let aiEvaluation: string | null = null;
  let aiScore: number | null = null;

  if (parsed.data.action === "submit") {
    // AI evaluates the management response
    try {
      const evalPrompt = `Du bist ein erfahrener Revisionsleiter. Bewerte die folgende Management Response auf ein Audit-Finding.

## Finding
KPI: ${finding.kpi.code} — ${finding.kpi.title}
Bereich: ${finding.kpi.area.name}
Schweregrad: ${finding.severity}
Beschreibung: ${finding.desc}

## Management Response des Fachbereichs
${parsed.data.content}

Verantwortlich: ${parsed.data.responsible}
Geplanter Abschluss: ${parsed.data.plannedDate}

Bewerte die Angemessenheit der Stellungnahme auf einer Skala von 0-10 und gib eine kurze Einschätzung.
Antworte AUSSCHLIESSLICH mit JSON: { "score": <0-10>, "evaluation": "<2-3 Sätze>", "adequate": true|false }`;

      const raw = await callAgentOnce(
        "Du bist ein erfahrener Revisionsleiter der die Angemessenheit von Management Responses bewertet.",
        evalPrompt
      );
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        const result = JSON.parse(m[0]);
        aiScore = Math.min(10, Math.max(0, result.score ?? 5)) / 10;
        aiEvaluation = result.evaluation ?? null;
      }
    } catch { /* proceed without AI evaluation */ }
  }

  const response = await db.findingResponse.upsert({
    where:  { findingId: id },
    create: {
      findingId:    id,
      submittedById: session.user!.id,
      content:      parsed.data.content,
      responsible:  parsed.data.responsible,
      plannedDate:  new Date(parsed.data.plannedDate),
      status:       parsed.data.action === "submit" ? "submitted" : "draft",
      aiEvaluation,
      aiScore,
      submittedAt:  parsed.data.action === "submit" ? new Date() : null,
    },
    update: {
      content:      parsed.data.content,
      responsible:  parsed.data.responsible,
      plannedDate:  new Date(parsed.data.plannedDate),
      status:       parsed.data.action === "submit" ? "submitted" : "draft",
      aiEvaluation,
      aiScore,
      submittedAt:  parsed.data.action === "submit" ? new Date() : null,
    },
  });

  if (parsed.data.action === "submit") {
    await db.activity.create({
      data: {
        type:    "agent",
        kpiId:   finding.kpiId,
        userId:  session.user!.id,
        message: `Stellungnahme eingereicht: ${finding.title}`,
      },
    });

    // Notify reviewer + send email
    const kpiFull = await db.kpi.findUnique({
      where: { id: finding.kpiId },
      select: { reviewerId: true, code: true, title: true },
    });
    if (kpiFull) {
      await db.notification.create({
        data: {
          userId:   kpiFull.reviewerId,
          type:     "approval_requested",
          message:  `Neue Stellungnahme zu „${finding.title}" — bitte prüfen.`,
          metadata: JSON.stringify({ findingId: id }),
        },
      });
      const reviewer = await db.user.findUnique({ where: { id: kpiFull.reviewerId }, select: { email: true, name: true } });
      const submitter = await db.user.findUnique({ where: { id: session.user!.id! }, select: { name: true } });
      if (reviewer) {
        sendResponseSubmittedEmail({
          toEmail: reviewer.email, toName: reviewer.name,
          findingTitle: finding.title, kpiCode: kpiFull.code,
          ownerName: submitter?.name ?? "Fachbereich",
          aiScore: aiScore,
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json(response, { status: 201 });
}
