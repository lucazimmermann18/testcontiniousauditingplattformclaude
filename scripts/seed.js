// scripts/seed.js — Production seed (plain ESM, no TypeScript, no devDeps)
// Run with: node scripts/seed.js
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "file:/data/app.db";
const adapter = new PrismaLibSql({ url });
const db = new PrismaClient({ adapter });

async function main() {
  // Skip if users already exist
  const count = await db.user.count();
  if (count > 0) {
    console.log(`[seed] Database already has ${count} users — skipping seed.`);
    return;
  }

  console.log("[seed] Seeding database...");

  const hash = (pw) => bcrypt.hash(pw, 12);

  const users = await Promise.all([
    db.user.upsert({ where: { email: "a.voss@continuum-audit.de" }, update: {}, create: { email: "a.voss@continuum-audit.de", name: "A. Voss", password: await hash("audit2026!"), role: "head_of_audit", avatar: "AV" } }),
    db.user.upsert({ where: { email: "m.weiss@continuum-audit.de" }, update: {}, create: { email: "m.weiss@continuum-audit.de", name: "Dr. M. Weiss", password: await hash("audit2026!"), role: "owner", avatar: "MW" } }),
    db.user.upsert({ where: { email: "s.hartmann@continuum-audit.de" }, update: {}, create: { email: "s.hartmann@continuum-audit.de", name: "S. Hartmann", password: await hash("audit2026!"), role: "reviewer", avatar: "SH" } }),
    db.user.upsert({ where: { email: "k.berger@continuum-audit.de" }, update: {}, create: { email: "k.berger@continuum-audit.de", name: "K. Berger", password: await hash("audit2026!"), role: "owner", avatar: "KB" } }),
    db.user.upsert({ where: { email: "t.lindner@continuum-audit.de" }, update: {}, create: { email: "t.lindner@continuum-audit.de", name: "T. Lindner", password: await hash("audit2026!"), role: "owner", avatar: "TL" } }),
    db.user.upsert({ where: { email: "f.krueger@continuum-audit.de" }, update: {}, create: { email: "f.krueger@continuum-audit.de", name: "F. Krüger", password: await hash("audit2026!"), role: "owner", avatar: "FK" } }),
    db.user.upsert({ where: { email: "p.albrecht@continuum-audit.de" }, update: {}, create: { email: "p.albrecht@continuum-audit.de", name: "P. Albrecht", password: await hash("audit2026!"), role: "reviewer", avatar: "PA" } }),
    db.user.upsert({ where: { email: "admin@continuum-audit.de" }, update: {}, create: { email: "admin@continuum-audit.de", name: "Admin", password: await hash("admin2026!"), role: "admin", avatar: "AD" } }),
  ]);
  const [voss, weiss, hartmann, berger, lindner, krueger, albrecht] = users;
  console.log(`[seed] ${users.length} users created`);

  const areas = [
    { id: "legal",       name: "Recht",         short: "LGL", color: "#7A5C3F" },
    { id: "compliance",  name: "Compliance",     short: "CMP", color: "#3F5E7A" },
    { id: "privacy",     name: "Datenschutz",    short: "DSG", color: "#4A6B5C" },
    { id: "accounting",  name: "Rechnungswesen", short: "REW", color: "#6B4A5C" },
    { id: "finance",     name: "Finanzen",       short: "FIN", color: "#5C4A6B" },
    { id: "controlling", name: "Controlling",    short: "CTR", color: "#7A6B3F" },
    { id: "itsec",       name: "IT-Sicherheit",  short: "ITS", color: "#3F6B7A" },
    { id: "hr",          name: "HR",             short: "HR",  color: "#6B3F4A" },
    { id: "procurement", name: "Einkauf",        short: "PRC", color: "#4A7A6B" },
    { id: "esg",         name: "ESG",            short: "ESG", color: "#5A7A3F" },
  ];
  for (const a of areas) await db.area.upsert({ where: { id: a.id }, update: {}, create: a });
  console.log(`[seed] ${areas.length} areas created`);

  const kpiData = [
    { code: "LGL-01", areaId: "legal",      title: "Vertragslaufzeiten & Kündigungsfristen", desc: "Prüfung aller aktiven Verträge auf eingehaltene Kündigungsfristen und ablaufende Lizenzen.", risk: 4, status: "review",   confidence: 0.78, value: "12 von 847",      delta: "+3 vs. Q1",    ownerId: weiss.id,   reviewerId: hartmann.id, lastRun: "vor 2 Std.",  agent: "ContractGuard v3.2", trend: [3,2,4,5,2,8,9,12] },
    { code: "LGL-02", areaId: "legal",      title: "Markenrechtliche Schutzlücken",          desc: "Domain- und Markenüberwachung in DE, EU, US.",                                              risk: 3, status: "ok",      confidence: 0.94, value: "0 Verletzungen",    delta: "stabil",       ownerId: weiss.id,   reviewerId: hartmann.id, lastRun: "vor 6 Std.",  agent: "BrandWatch v2.1",   trend: [1,0,0,1,0,0,0,0] },
    { code: "LGL-03", areaId: "legal",      title: "Litigation Exposure",                    desc: "Rückstellungen vs. anhängige Rechtsstreitigkeiten.",                                       risk: 5, status: "finding",  confidence: 0.81, value: "€ 2,4 Mio.",       delta: "+€ 0,8 Mio.",  ownerId: weiss.id,   reviewerId: hartmann.id, lastRun: "vor 1 Tag",   agent: "LitTrack v1.4",     trend: [1.2,1.4,1.5,1.6,1.6,1.8,1.6,2.4] },
    { code: "CMP-01", areaId: "compliance", title: "Sanktionslisten-Screening",              desc: "Abgleich Geschäftspartner mit EU/OFAC/UN Listen.",                                         risk: 5, status: "ok",      confidence: 0.99, value: "8.412 geprüft",    delta: "0 Treffer",    ownerId: berger.id,  reviewerId: albrecht.id, lastRun: "vor 30 Min.", agent: "SanctionScan v4.0", trend: [0,0,0,0,1,0,0,0] },
    { code: "CMP-02", areaId: "compliance", title: "Geschenke & Einladungen >€100",         desc: "Erfassungsquote und Genehmigungsprozess.",                                                  risk: 3, status: "review",   confidence: 0.72, value: "84% erfasst",      delta: "−6 pp",        ownerId: berger.id,  reviewerId: albrecht.id, lastRun: "vor 4 Std.",  agent: "GiftLog v2.3",      trend: [92,90,91,89,88,90,90,84] },
    { code: "CMP-03", areaId: "compliance", title: "Whistleblower-Hinweise SLA",            desc: "Reaktionszeit auf eingegangene Meldungen.",                                                 risk: 4, status: "ok",      confidence: 0.88, value: "Ø 3,2 Tage",       delta: "−0,4 Tage",    ownerId: berger.id,  reviewerId: albrecht.id, lastRun: "vor 1 Std.",  agent: "WBLine v1.8",       trend: [4.2,4.0,3.8,3.9,3.6,3.7,3.6,3.2] },
    { code: "CMP-04", areaId: "compliance", title: "Schulungsquote Code of Conduct",        desc: "Pflichtschulung pro Mitarbeitendem im Geschäftsjahr.",                                      risk: 2, status: "running",  confidence: 0,    value: "—",                delta: "—",             ownerId: berger.id,  reviewerId: albrecht.id, lastRun: "läuft",       agent: "TrainSync v1.2",    trend: [88,90,92,93,94,95,96,0] },
    { code: "DSG-01", areaId: "privacy",    title: "Auskunftsersuchen Art. 15 DSGVO",       desc: "Bearbeitung innerhalb der Monatsfrist.",                                                    risk: 4, status: "review",   confidence: 0.69, value: "94% on-time",      delta: "−3 pp",        ownerId: lindner.id, reviewerId: albrecht.id, lastRun: "vor 3 Std.",  agent: "GDPR-Watch v2.0",   trend: [98,97,96,98,97,97,97,94] },
    { code: "DSG-02", areaId: "privacy",    title: "Verarbeitungsverzeichnis Aktualität",   desc: "Drift zwischen System-Inventar und VVT.",                                                   risk: 3, status: "finding",  confidence: 0.85, value: "23 Drifts",        delta: "+11",           ownerId: lindner.id, reviewerId: albrecht.id, lastRun: "vor 8 Std.",  agent: "RecordSync v1.5",   trend: [4,6,8,7,9,10,12,23] },
    { code: "DSG-03", areaId: "privacy",    title: "Auftragsverarbeiter-Prüfungen",         desc: "Aktive AVVs mit fälligen Reviews.",                                                         risk: 3, status: "ok",      confidence: 0.91, value: "147 / 152 aktuell", delta: "+2",           ownerId: lindner.id, reviewerId: albrecht.id, lastRun: "vor 1 Tag",   agent: "DPA-Track v1.1",    trend: [140,142,144,145,146,145,145,147] },
    { code: "REW-01", areaId: "accounting", title: "Manuelle Buchungen außerhalb Geschäftszeiten", desc: "Fokus auf Hochrisiko-Konten (Erträge, Rückstellungen).",                           risk: 5, status: "finding",  confidence: 0.92, value: "47 auffällig",     delta: "+18",           ownerId: krueger.id, reviewerId: voss.id,     lastRun: "vor 1 Std.",  agent: "JournalSentry v3.1",trend: [12,14,18,20,22,25,29,47] },
    { code: "REW-02", areaId: "accounting", title: "Konten-Abstimmungs-Backlog",            desc: "Offene Posten > 60 Tage in Hauptbuch-Konten.",                                              risk: 4, status: "review",   confidence: 0.74, value: "€ 412 Tsd.",       delta: "+€ 91 Tsd.",   ownerId: krueger.id, reviewerId: voss.id,     lastRun: "vor 5 Std.",  agent: "ReconAI v2.2",      trend: [180,210,240,260,290,310,321,412] },
    { code: "REW-03", areaId: "accounting", title: "Periodenabgrenzung Vollständigkeit",    desc: "Plausibilität der Abgrenzungen Q-on-Q.",                                                    risk: 4, status: "ok",      confidence: 0.86, value: "Δ 1,2%",           delta: "im Korridor",  ownerId: krueger.id, reviewerId: voss.id,     lastRun: "vor 12 Std.", agent: "AccrualCheck v1.7", trend: [1.0,1.1,0.9,1.2,1.0,1.1,1.0,1.2] },
    { code: "REW-04", areaId: "accounting", title: "Lieferantenrechnungen Duplikate",       desc: "Verdacht auf Doppelzahlungen.",                                                             risk: 3, status: "ok",      confidence: 0.97, value: "3 Verdachtsfälle",  delta: "alle geklärt", ownerId: krueger.id, reviewerId: voss.id,     lastRun: "vor 2 Std.",  agent: "DupeFinder v2.0",   trend: [5,4,6,3,4,5,3,3] },
    { code: "ITS-01", areaId: "itsec",      title: "Privilegierte Zugänge Review",          desc: "Dormant Admin-Accounts und Stale Permissions.",                                             risk: 5, status: "finding",  confidence: 0.94, value: "31 dormant",       delta: "+9",            ownerId: weiss.id,   reviewerId: voss.id,     lastRun: "vor 2 Std.",  agent: "PAM-Sentry v3.4",   trend: [14,16,18,20,22,21,22,31] },
    { code: "ITS-02", areaId: "itsec",      title: "Patch-Compliance Critical Systems",    desc: "SLA: < 14 Tage für Critical CVEs.",                                                         risk: 5, status: "review",   confidence: 0.83, value: "89%",              delta: "−4 pp",        ownerId: weiss.id,   reviewerId: voss.id,     lastRun: "vor 1 Std.",  agent: "VulnAI v2.7",       trend: [94,93,93,94,93,92,93,89] },
    { code: "ITS-03", areaId: "itsec",      title: "Phishing-Simulation Klickrate",         desc: "Quartalskampagne, alle Mitarbeitenden.",                                                    risk: 3, status: "ok",      confidence: 0.91, value: "4,1%",             delta: "−1,3 pp",      ownerId: weiss.id,   reviewerId: voss.id,     lastRun: "vor 1 Tag",   agent: "PhishTest v1.5",    trend: [8.2,7.4,6.8,6.2,5.8,5.5,5.4,4.1] },
  ];

  const createdKpis = {};
  for (const kpi of kpiData) {
    const { trend, ...rest } = kpi;
    const created = await db.kpi.upsert({
      where: { code: kpi.code },
      update: {},
      create: { ...rest, trend: JSON.stringify(trend) },
    });
    createdKpis[kpi.code] = created.id;
  }
  console.log(`[seed] ${kpiData.length} KPIs created`);

  const findingsData = [
    { kpiCode: "LGL-03", title: "Rückstellungen für Litigation unterschätzt",     desc: "KI-Agent identifizierte € 0,8 Mio. Gap zwischen Rückstellungen und erwarteter Zahlungsverpflichtung.",  severity: "hoch",   status: "offen",          ownerId: weiss.id,   dueDate: new Date("2026-06-15") },
    { kpiCode: "REW-01", title: "47 manuelle Buchungen außerhalb Geschäftszeiten", desc: "Signifikanter Anstieg manueller Buchungen auf Hochrisiko-Konten zwischen 22:00 und 05:00 Uhr.",         severity: "hoch",   status: "in_bearbeitung", ownerId: krueger.id, dueDate: new Date("2026-06-20") },
    { kpiCode: "ITS-01", title: "31 dormante Admin-Accounts aktiv",               desc: "Privilegierte Accounts ehemaliger Mitarbeitender nicht deaktiviert, 4 mit erhöhten Rechten.",            severity: "hoch",   status: "offen",          ownerId: weiss.id,   dueDate: new Date("2026-06-12") },
    { kpiCode: "DSG-02", title: "23 Drift-Einträge im Verarbeitungsverzeichnis",  desc: "System-Inventar und VVT weichen in 23 Punkten ab, 8 mit potenziell datenschutzrechtlicher Relevanz.",  severity: "mittel", status: "offen",          ownerId: lindner.id, dueDate: new Date("2026-06-30") },
  ];
  for (const f of findingsData) {
    const { kpiCode, ...rest } = f;
    const kpiId = createdKpis[kpiCode];
    if (kpiId) await db.finding.create({ data: { ...rest, kpiId } });
  }
  console.log(`[seed] ${findingsData.length} findings created`);

  const activitiesData = [
    { type: "finding", kpiCode: "REW-01", userId: voss.id,   message: "Finding: 47 manuelle Buchungen außerhalb Geschäftszeiten identifiziert" },
    { type: "approved", kpiCode: "CMP-01", userId: berger.id, message: "CMP-01 als geprüft freigegeben – 8.412 Geschäftspartner ohne Treffer" },
    { type: "rerun",    kpiCode: "CMP-04", userId: voss.id,   message: "Agent neu gestartet – Schulungsquoten werden aktualisiert" },
    { type: "finding",  kpiCode: "ITS-01", userId: voss.id,   message: "31 dormante Admin-Accounts identifiziert – Sofortmaßnahme erforderlich" },
    { type: "agent",    kpiCode: "DSG-02", userId: voss.id,   message: "Verarbeitungsverzeichnis-Drift auf 23 gestiegen – Finding ausgelöst" },
  ];
  for (const a of activitiesData) {
    const { kpiCode, ...rest } = a;
    const kpiId = createdKpis[kpiCode];
    if (kpiId) await db.activity.create({ data: { ...rest, kpiId } });
  }
  console.log(`[seed] ${activitiesData.length} activities created`);

  const lgl01Id = createdKpis["LGL-01"];
  if (lgl01Id) {
    await db.comment.createMany({
      data: [
        { kpiId: lgl01Id, authorId: hartmann.id, text: "Bitte prüfen ob die KI-Bewertung der drei neuen Klagen mit den vorhandenen Schriftsätzen übereinstimmt." },
        { kpiId: lgl01Id, authorId: weiss.id,    text: "Habe die Akten gesichtet — KI-Klassifizierung in 2 von 3 Fällen korrekt. Anpassung Rückstellungen läuft." },
      ],
    });
  }

  console.log("[seed] Done!");
  console.log("");
  console.log("Demo-Logins:");
  console.log("  Head of Audit:  a.voss@continuum-audit.de    / audit2026!");
  console.log("  Admin:          admin@continuum-audit.de      / admin2026!");
}

main()
  .catch((e) => { console.error("[seed] Error:", e); process.exit(1); })
  .finally(() => db.$disconnect());
