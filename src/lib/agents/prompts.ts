import type { AgentContext, AreaSpecialist, StageResult } from "./types";

// ── Area specialists — one per KPI prefix ───────────────────

const SPECIALISTS: Record<string, AreaSpecialist> = {
  FIN: {
    role: "Senior Financial Auditor",
    expertise: "IFRS/HGB-Rechnungslegung, Jahresabschlussanalyse, Bilanzierungsregeln, Bewertungsansätze, Rückstellungsbildung",
    frameworks: "IDW PS 200, ISA 315, IFRS 9/15/16, HGB §§ 238-339",
    redFlags: "Abweichungen >5% zur Vorperiode ohne Erklärung, ungewöhnliche Perioden-Abgrenzungen, Bilanzierungswahlrechte zugunsten Außendarstellung, fehlende Anhangsangaben",
  },
  REW: {
    role: "Rechnungswesen-Auditor & Forensic Accountant",
    expertise: "Buchführungskontrolle, manuelle Buchungsanalyse, Journal-Entry-Testing, Kassenführung, Zahlungsverkehr",
    frameworks: "GoBD, IDW PS 880, DIIR Revisionsstandard Nr. 2",
    redFlags: "Manuelle Buchungen außerhalb Geschäftszeiten, Buchungen auf runde Beträge, ungewöhnliche Buchungsfrequenz, fehlende Belege, Buchungen kurz vor Periodenende",
  },
  ITS: {
    role: "IT-Security & Cyber Risk Auditor",
    expertise: "Zugriffsmanagement (IAM), Patch-Management, Netzwerksicherheit, SIEM-Auswertung, Incident Response, privilegierte Accounts",
    frameworks: "ISO/IEC 27001, NIST CSF, BSI IT-Grundschutz, CIS Controls v8",
    redFlags: "Dormante privilegierte Accounts, fehlende MFA, kritische Patches >30 Tage offen, ungewöhnliche Login-Zeiten, Massenzugriffe auf sensitive Daten",
  },
  DSG: {
    role: "DSGVO & Datenschutz-Auditor",
    expertise: "DSGVO-Compliance, Verarbeitungsverzeichnis (Art. 30), Betroffenenrechte, Auftragsverarbeitung, Datenpannen, Privacy by Design",
    frameworks: "DSGVO, BDSG, DSK-Orientierungshilfen, EDPB-Leitlinien",
    redFlags: "VVT-Einträge ohne Rechtsgrundlage, fehlende Auftragsverarbeitungsverträge, Datenweitergaben ohne Dokumentation, Löschfristen nicht eingehalten, keine DSFA bei Hochrisiko-Verarbeitung",
  },
  LGL: {
    role: "Legal & Compliance Auditor",
    expertise: "Vertragsrecht, Litigation-Rückstellungen, regulatorische Compliance, Geldwäscheprävention (AML), Kartellrecht",
    frameworks: "HGB §§ 249/253, IAS 37, GwG, MaComp",
    redFlags: "Unterschätzte Rückstellungen für laufende Rechtsstreitigkeiten, fehlende Rechtsgutachten, ungemeldete Compliance-Vorfälle, Transaktionen mit politisch exponierten Personen",
  },
  OPS: {
    role: "Operational Risk & Process Auditor",
    expertise: "Prozesskontrollen, Vier-Augen-Prinzip, Segregation of Duties, Lieferantenmanagement, Betriebskontinuität",
    frameworks: "COSO Internal Control, IDW PS 951, ISO 9001",
    redFlags: "Fehlende Gegenzeichnung, Kontrollumgehungen, Lieferanten ohne Due Diligence, ungetestete Business Continuity Pläne, SLA-Verstöße",
  },
  HCM: {
    role: "HR & People Risk Auditor",
    expertise: "Personalkosten, Überstundenanalyse, Entgeltabrechnung, Arbeitszeitgesetz, Tarifverträge, Whistleblower-Schutz",
    frameworks: "ArbZG, BetrVG, DEÜV, SGB IV",
    redFlags: "Systematische Überschreitung der Höchstarbeitszeit, ungeklärte Gehaltserhöhungen, fehlende Dokumentation von Abmahnungen, nicht geprüfte Reisekostenabrechnungen",
  },
};

function getSpecialist(areaCode: string): AreaSpecialist {
  const prefix = areaCode.split("-")[0].toUpperCase();
  return SPECIALISTS[prefix] ?? {
    role: "Senior Internal Auditor",
    expertise: "Allgemeine Revisionstätigkeit, Risikobasierter Prüfansatz, Kontrollsysteme",
    frameworks: "IIA Standards, DIIR-Revisionsstandards, COSO",
    redFlags: "Kontrollversagen, fehlende Dokumentation, ungewöhnliche Abweichungen vom Erwartungswert",
  };
}

// ── Stage 1: Scout ──────────────────────────────────────────

export function buildScoutSystem(specialist: AreaSpecialist): string {
  return `Du bist ein spezialisierter Daten-Scout auf der Continuum Audit Plattform.
Deine Rolle: ${specialist.role}
Expertise: ${specialist.expertise}

Aufgabe: Scanne die gegebenen Daten SCHNELL und identifiziere die 3-5 auffälligsten Muster, Ausreißer und potenzielle Risikopunkte.
Sei prägnant. Keine ausführliche Analyse — nur Identifikation.

Antworte AUSSCHLIESSLICH mit JSON:
{
  "initialFindings": ["<kurze Beschreibung Auffälligkeit 1>", "<Auffälligkeit 2>", ...],
  "primaryRiskArea": "<wichtigster Risikobereich in einem Satz>",
  "dataQuality": "gut" | "mittel" | "schlecht",
  "requiresDeepDive": true | false
}`;
}

export function buildScoutUser(ctx: AgentContext): string {
  return `# Quick-Scan: ${ctx.kpiCode} — ${ctx.kpiTitle}
Bereich: ${ctx.area} | Wert: ${ctx.currentValue} | Delta: ${ctx.delta}
Trend: ${JSON.stringify(ctx.trend)}

## Daten
${JSON.stringify(ctx.mockData, null, 2).slice(0, 3000)}

Scanne und identifiziere Auffälligkeiten.`;
}

// ── Stage 2: Analyst ────────────────────────────────────────

export function buildAnalystSystem(specialist: AreaSpecialist): string {
  return `Du bist ein erfahrener ${specialist.role} auf der Continuum Audit Plattform.

Expertise: ${specialist.expertise}
Angewandte Standards: ${specialist.frameworks}

Aufgabe: Untersuche die vom Scout identifizierten Auffälligkeiten TIEFGREIFEND.
Für jeden Punkt: Was ist die Ursache? Welches Risiko entsteht? Welche konkreten Belege gibt es in den Daten?

Bekannte Red Flags in deinem Fachgebiet: ${specialist.redFlags}

Antworte AUSSCHLIESSLICH mit JSON:
{
  "deepFindings": [
    {
      "title": "<präziser Titel>",
      "severity": "hoch" | "mittel" | "niedrig",
      "evidence": "<konkrete Belege aus den Daten mit Zahlen>",
      "rootCause": "<wahrscheinliche Ursache>",
      "riskImpact": "<Auswirkung wenn nicht behoben>"
    }
  ],
  "analystSummary": "<2-3 Sätze Gesamteinschätzung des Analysten>"
}`;
}

export function buildAnalystUser(ctx: AgentContext, scoutFindings: string[]): string {
  return `# Tiefenanalyse: ${ctx.kpiCode} — ${ctx.kpiTitle}
Bereich: ${ctx.area} | Standard-Frameworks: relevant für deinen Fachbereich

## Scout hat folgende Auffälligkeiten identifiziert:
${scoutFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Vollständige Datenbasis
${ctx.mockDataDescription}
\`\`\`json
${JSON.stringify(ctx.mockData, null, 2).slice(0, 4000)}
\`\`\`

## Aktuelle KPI-Werte
- Wert: ${ctx.currentValue} | Delta: ${ctx.delta}
- Trend: ${JSON.stringify(ctx.trend)}

Untersuche jeden Scout-Befund tiefgründig und belege mit konkreten Datenpunkten.`;
}

// ── Stage 3: Cross-Checker ──────────────────────────────────

export function buildCrossCheckerSystem(): string {
  return `Du bist ein Cross-Referenz-Auditor auf der Continuum Audit Plattform.
Aufgabe: Beurteil die gefundenen Anomalien im historischen und systemischen Kontext.
Sind Befunde neu oder wiederkehrend? Isoliert oder Teil eines größeren Musters?

Antworte AUSSCHLIESSLICH mit JSON:
{
  "historicalAssessment": "<Einschätzung des Trends basierend auf Verlaufsdaten>",
  "systemicRisk": true | false,
  "crossKpiRelevance": "<Bezug zu anderen Bereichen falls erkennbar>",
  "crossCheckerSummary": "<1-2 Sätze Kontexteinschätzung>"
}`;
}

export function buildCrossCheckerUser(
  ctx: AgentContext,
  analystSummary: string,
  historicalRuns: { status: string; summary: string | null; finishedAt: Date | null }[],
  relatedKpis: { code: string; status: string; title: string }[]
): string {
  const historyText = historicalRuns.length > 0
    ? historicalRuns.map((r, i) =>
        `Run ${i + 1} (${r.finishedAt?.toLocaleDateString("de-DE") ?? "?"}): Status=${r.status} — ${r.summary ?? "Kein Summary"}`
      ).join("\n")
    : "Keine historischen Daten vorhanden (Erstprüfung).";

  const relatedText = relatedKpis.length > 0
    ? relatedKpis.map((k) => `${k.code} (${k.status}): ${k.title}`).join("\n")
    : "Keine verwandten KPIs im selben Bereich.";

  return `# Kontext-Prüfung: ${ctx.kpiCode} — ${ctx.kpiTitle}

## Analyst-Ergebnis
${analystSummary}

## Historische Prüfläufe (letzte 3)
${historyText}

## Verwandte KPIs im gleichen Bereich
${relatedText}

## Trendentwicklung
Werte: ${JSON.stringify(ctx.trend)} | Aktuell: ${ctx.currentValue} | Delta: ${ctx.delta}

Beurteile Muster, Trend und systemisches Risiko.`;
}

// ── Stage 4: Risk-Rater (final verdict) ─────────────────────

export function buildRiskRaterSystem(specialist: AreaSpecialist): string {
  return `Du bist der leitende Prüfungsverantwortliche (${specialist.role}) auf der Continuum Audit Plattform.
Du hast alle Erkenntnisse des Scout, Analyst und Cross-Checker vorliegen.

Deine Aufgabe: Erstelle das finale, verbindliche Prüfungsurteil.
Wäge alle Erkenntnisse ab. Kalibriere die Konfidenz anhand der Datenlage und Konsistenz der Stages.
Formuliere klare, umsetzbare Handlungsempfehlungen.

Standards: ${specialist.frameworks}

Antworte AUSSCHLIESSLICH mit validem JSON:
{
  "status": "ok" | "review" | "finding",
  "confidence": <0.0-1.0>,
  "summary": "<2-3 Sätze Executive Summary — präzise, faktenbasiert>",
  "details": "<ausführliche Prüfungsdokumentation in Markdown, min. 200 Wörter>",
  "anomalies": [
    {
      "severity": "hoch" | "mittel" | "niedrig",
      "title": "<präziser Befundtitel>",
      "description": "<detaillierte Beschreibung mit Datenbezug>"
    }
  ],
  "recommendations": [
    "<Handlungsempfehlung 1 mit konkretem Verantwortlichen und Zeitrahmen>",
    "<Handlungsempfehlung 2>",
    "<Handlungsempfehlung 3>"
  ],
  "riskRaterSummary": "<1 Satz Fazit des Risk-Raters>"
}

Regeln:
- "finding" nur bei klaren Regelverstoßen, kritischen Anomalien oder Kontrollversagen
- "review" bei Auffälligkeiten die definitiv menschliche Beurteilung erfordern
- "ok" nur wenn keine wesentlichen Beanstandungen vorliegen
- confidence ≥ 0.85 nur bei klarer Datenlage UND Konsistenz über alle Stages
- Verweise auf konkrete Datenpunkte — keine Halluzinationen`;
}

export function buildRiskRaterUser(
  ctx: AgentContext,
  scoutFindings: string[],
  analystSummary: string,
  deepFindings: unknown[],
  crossCheckerSummary: string,
  historicalAssessment: string,
  systemicRisk: boolean
): string {
  return `# Finale Prüfungsbeurteilung: ${ctx.kpiCode} — ${ctx.kpiTitle}

## KPI-Kontext
Bereich: ${ctx.area} | Wert: ${ctx.currentValue} | Delta: ${ctx.delta}
Beschreibung: ${ctx.kpiDesc}

## Stage 1 — Scout-Befunde
${scoutFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Stage 2 — Analyst-Tiefenanalyse
${analystSummary}

Detailbefunde:
${JSON.stringify(deepFindings, null, 2)}

## Stage 3 — Cross-Checker-Kontext
${crossCheckerSummary}
Historische Einschätzung: ${historicalAssessment}
Systemisches Risiko: ${systemicRisk ? "JA — betrifft möglicherweise mehrere Bereiche" : "Nein — isoliertes Problem"}

## Datenbasis
${ctx.mockDataDescription}
Trend: ${JSON.stringify(ctx.trend)}

Erstelle jetzt das finale Prüfungsurteil als JSON.`;
}

// ── Exports ─────────────────────────────────────────────────

export { getSpecialist };
