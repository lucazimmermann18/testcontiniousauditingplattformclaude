import nodemailer from "nodemailer";

// Uses Ethereal (fake SMTP) in dev; configure real SMTP via env vars in prod
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal test account — logs preview URL to console
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
  return transporter;
}

const FROM = process.env.EMAIL_FROM ?? "noreply@continuum-audit.local";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
  .card { background: #fff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; }
  .header { background: #1a1a2e; padding: 24px 32px; color: #fff; }
  .header-brand { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; color: #888; margin-bottom: 4px; }
  .header-title { font-size: 20px; font-weight: 700; }
  .body { padding: 28px 32px; color: #333; line-height: 1.6; }
  .body p { margin: 0 0 16px; }
  .btn { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 8px; }
  .footer { padding: 16px 32px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; }
  .badge-hoch { background: #fee2e2; color: #991b1b; }
  .badge-mittel { background: #fef3c7; color: #92400e; }
  .badge-niedrig { background: #d1fae5; color: #065f46; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="header-brand">CONTINUUM·AUDIT</div>
    <div class="header-title">${title}</div>
  </div>
  <div class="body">${body}</div>
  <div class="footer">Continuum Audit Platform · Automatische Benachrichtigung</div>
</div>
</body>
</html>`;
}

export async function sendFindingCreatedEmail({
  toEmail, toName, kpiCode, kpiTitle, findingTitle, severity, dueDate, findingId,
}: {
  toEmail: string; toName: string; kpiCode: string; kpiTitle: string;
  findingTitle: string; severity: string; dueDate: Date; findingId: string;
}) {
  const t = await getTransporter();
  const due = dueDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const body = `
    <p>Guten Tag ${toName},</p>
    <p>für den KPI <strong>${kpiCode} – ${kpiTitle}</strong> wurde ein neues Finding angelegt, das Ihrer Verantwortung zugewiesen ist:</p>
    <p><strong>${findingTitle}</strong> &nbsp; <span class="badge badge-${severity}">${severity.charAt(0).toUpperCase() + severity.slice(1)}</span></p>
    <p>Bitte reichen Sie bis <strong>${due}</strong> einen Maßnahmenplan ein.</p>
    <a href="${BASE_URL}/owner" class="btn">Maßnahmenplan einreichen →</a>
  `;
  const info = await t.sendMail({
    from: FROM, to: toEmail,
    subject: `[Continuum Audit] Neues Finding: ${findingTitle}`,
    html: baseTemplate(`Neues Audit-Finding: ${kpiCode}`, body),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Finding created →", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendResponseSubmittedEmail({
  toEmail, toName, findingTitle, kpiCode, ownerName, aiScore,
}: {
  toEmail: string; toName: string; findingTitle: string; kpiCode: string;
  ownerName: string; aiScore: number | null;
}) {
  const t = await getTransporter();
  const scoreText = aiScore !== null
    ? `<p>Die KI-Bewertung des Maßnahmenplans: <strong>${Math.round(aiScore * 10)}/10</strong></p>`
    : "";
  const body = `
    <p>Guten Tag ${toName},</p>
    <p>${ownerName} hat einen Maßnahmenplan für das Finding <strong>${findingTitle}</strong> (${kpiCode}) eingereicht.</p>
    ${scoreText}
    <p>Bitte prüfen Sie den Maßnahmenplan und geben Sie eine Rückmeldung.</p>
    <a href="${BASE_URL}/?view=findings" class="btn">Finding reviewen →</a>
  `;
  const info = await t.sendMail({
    from: FROM, to: toEmail,
    subject: `[Continuum Audit] Maßnahmenplan eingereicht: ${findingTitle}`,
    html: baseTemplate("Maßnahmenplan zur Prüfung", body),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Response submitted →", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendResponseReviewedEmail({
  toEmail, toName, findingTitle, accepted, reviewerNote,
}: {
  toEmail: string; toName: string; findingTitle: string; accepted: boolean; reviewerNote?: string;
}) {
  const t = await getTransporter();
  const noteText = reviewerNote ? `<p><strong>Anmerkung des Reviewers:</strong> ${reviewerNote}</p>` : "";
  const body = accepted
    ? `
      <p>Guten Tag ${toName},</p>
      <p>Ihr Maßnahmenplan für das Finding <strong>${findingTitle}</strong> wurde <strong>akzeptiert</strong> ✓</p>
      <p>Das Finding wurde damit als geschlossen markiert.</p>
    `
    : `
      <p>Guten Tag ${toName},</p>
      <p>Ihr Maßnahmenplan für das Finding <strong>${findingTitle}</strong> wurde leider <strong>abgelehnt</strong>.</p>
      ${noteText}
      <p>Bitte überarbeiten Sie den Maßnahmenplan und reichen ihn erneut ein.</p>
      <a href="${BASE_URL}/owner" class="btn">Maßnahmenplan überarbeiten →</a>
    `;
  const info = await t.sendMail({
    from: FROM, to: toEmail,
    subject: `[Continuum Audit] Maßnahmenplan ${accepted ? "akzeptiert ✓" : "abgelehnt"}: ${findingTitle}`,
    html: baseTemplate(accepted ? "Maßnahmenplan akzeptiert" : "Maßnahmenplan abgelehnt", body),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Response reviewed →", nodemailer.getTestMessageUrl(info));
  }
}

export async function sendAgentCompletedEmail({
  toEmail, toName, kpiCode, kpiTitle, status, confidence, summary,
}: {
  toEmail: string; toName: string; kpiCode: string; kpiTitle: string;
  status: string; confidence: number; summary?: string;
}) {
  const t = await getTransporter();
  const statusEmoji = status === "ok" ? "✓" : status === "finding" ? "⛔" : "⚠";
  const summaryText = summary ? `<p><em>${summary.slice(0, 200)}</em></p>` : "";
  const body = `
    <p>Guten Tag ${toName},</p>
    <p>Der KI-Agent hat die Prüfung von <strong>${kpiCode} – ${kpiTitle}</strong> abgeschlossen.</p>
    <p>Ergebnis: <strong>${statusEmoji} ${status.toUpperCase()}</strong> · Konfidenz: <strong>${Math.round(confidence * 100)}%</strong></p>
    ${summaryText}
    <a href="${BASE_URL}/" class="btn">Ergebnis ansehen →</a>
  `;
  const info = await t.sendMail({
    from: FROM, to: toEmail,
    subject: `[Continuum Audit] Agent-Prüfung abgeschlossen: ${kpiCode} — ${status.toUpperCase()}`,
    html: baseTemplate(`Agent-Ergebnis: ${kpiCode}`, body),
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[email] Agent completed →", nodemailer.getTestMessageUrl(info));
  }
}
