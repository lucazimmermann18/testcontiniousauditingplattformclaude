import type { Area, Kpi, Finding, Activity } from "@/types";

export const QUARTERS = ["Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"];
export const CURRENT_QUARTER = "Q2 2026";

export const AREAS: Area[] = [
  { id: "legal",       name: "Recht",            short: "LGL", color: "#7A5C3F" },
  { id: "compliance",  name: "Compliance",        short: "CMP", color: "#3F5E7A" },
  { id: "privacy",     name: "Datenschutz",       short: "DSG", color: "#4A6B5C" },
  { id: "accounting",  name: "Rechnungswesen",    short: "REW", color: "#6B4A5C" },
  { id: "finance",     name: "Finanzen",          short: "FIN", color: "#5C4A6B" },
  { id: "controlling", name: "Controlling",       short: "CTR", color: "#7A6B3F" },
  { id: "itsec",       name: "IT-Sicherheit",     short: "ITS", color: "#3F6B7A" },
  { id: "hr",          name: "HR",                short: "HR",  color: "#6B3F4A" },
  { id: "procurement", name: "Einkauf",           short: "PRC", color: "#4A7A6B" },
  { id: "esg",         name: "ESG",               short: "ESG", color: "#5A7A3F" },
];

export const KPIS: Kpi[] = [
  // LEGAL
  { id: "lgl-01", area: "legal", code: "LGL-01", title: "Vertragslaufzeiten & Kündigungsfristen", desc: "Prüfung aller aktiven Verträge auf eingehaltene Kündigungsfristen und ablaufende Lizenzen.", risk: 4, status: "review", confidence: 0.78, value: "12 von 847", delta: "+3 vs. Q1", owner: "Dr. M. Weiss", reviewer: "S. Hartmann", lastRun: "vor 2 Std.", agent: "ContractGuard v3.2", trend: [3,2,4,5,2,8,9,12] },
  { id: "lgl-02", area: "legal", code: "LGL-02", title: "Markenrechtliche Schutzlücken", desc: "Domain- und Markenüberwachung in DE, EU, US.", risk: 3, status: "ok", confidence: 0.94, value: "0 Verletzungen", delta: "stabil", owner: "Dr. M. Weiss", reviewer: "S. Hartmann", lastRun: "vor 6 Std.", agent: "BrandWatch v2.1", trend: [1,0,0,1,0,0,0,0] },
  { id: "lgl-03", area: "legal", code: "LGL-03", title: "Litigation Exposure", desc: "Rückstellungen vs. anhängige Rechtsstreitigkeiten.", risk: 5, status: "finding", confidence: 0.81, value: "€ 2,4 Mio.", delta: "+€ 0,8 Mio.", owner: "Dr. M. Weiss", reviewer: "S. Hartmann", lastRun: "vor 1 Tag", agent: "LitTrack v1.4", trend: [1.2,1.4,1.5,1.6,1.6,1.8,1.6,2.4] },
  // COMPLIANCE
  { id: "cmp-01", area: "compliance", code: "CMP-01", title: "Sanktionslisten-Screening", desc: "Abgleich Geschäftspartner mit EU/OFAC/UN Listen.", risk: 5, status: "ok", confidence: 0.99, value: "8.412 geprüft", delta: "0 Treffer", owner: "K. Berger", reviewer: "P. Albrecht", lastRun: "vor 30 Min.", agent: "SanctionScan v4.0", trend: [0,0,0,0,1,0,0,0] },
  { id: "cmp-02", area: "compliance", code: "CMP-02", title: "Geschenke & Einladungen >€100", desc: "Erfassungsquote und Genehmigungsprozess.", risk: 3, status: "review", confidence: 0.72, value: "84% erfasst", delta: "−6 pp", owner: "K. Berger", reviewer: "P. Albrecht", lastRun: "vor 4 Std.", agent: "GiftLog v2.3", trend: [92,90,91,89,88,90,90,84] },
  { id: "cmp-03", area: "compliance", code: "CMP-03", title: "Whistleblower-Hinweise SLA", desc: "Reaktionszeit auf eingegangene Meldungen.", risk: 4, status: "ok", confidence: 0.88, value: "Ø 3,2 Tage", delta: "−0,4 Tage", owner: "K. Berger", reviewer: "P. Albrecht", lastRun: "vor 1 Std.", agent: "WBLine v1.8", trend: [4.2,4.0,3.8,3.9,3.6,3.7,3.6,3.2] },
  { id: "cmp-04", area: "compliance", code: "CMP-04", title: "Schulungsquote Code of Conduct", desc: "Pflichtschulung pro Mitarbeitendem im Geschäftsjahr.", risk: 2, status: "running", confidence: 0, value: "—", delta: "—", owner: "K. Berger", reviewer: "P. Albrecht", lastRun: "läuft", agent: "TrainSync v1.2", trend: [88,90,92,93,94,95,96,0] },
  // DATENSCHUTZ
  { id: "dsg-01", area: "privacy", code: "DSG-01", title: "Auskunftsersuchen Art. 15 DSGVO", desc: "Bearbeitung innerhalb der Monatsfrist.", risk: 4, status: "review", confidence: 0.69, value: "94% on-time", delta: "−3 pp", owner: "T. Lindner", reviewer: "P. Albrecht", lastRun: "vor 3 Std.", agent: "GDPR-Watch v2.0", trend: [98,97,96,98,97,97,97,94] },
  { id: "dsg-02", area: "privacy", code: "DSG-02", title: "Verarbeitungsverzeichnis Aktualität", desc: "Drift zwischen System-Inventar und VVT.", risk: 3, status: "finding", confidence: 0.85, value: "23 Drifts", delta: "+11", owner: "T. Lindner", reviewer: "P. Albrecht", lastRun: "vor 8 Std.", agent: "RecordSync v1.5", trend: [4,6,8,7,9,10,12,23] },
  { id: "dsg-03", area: "privacy", code: "DSG-03", title: "Auftragsverarbeiter-Prüfungen", desc: "Aktive AVVs mit fälligen Reviews.", risk: 3, status: "ok", confidence: 0.91, value: "147 / 152 aktuell", delta: "+2", owner: "T. Lindner", reviewer: "P. Albrecht", lastRun: "vor 1 Tag", agent: "DPA-Track v1.1", trend: [140,142,144,145,146,145,145,147] },
  // RECHNUNGSWESEN
  { id: "rew-01", area: "accounting", code: "REW-01", title: "Manuelle Buchungen außerhalb Geschäftszeiten", desc: "Fokus auf Hochrisiko-Konten (Erträge, Rückstellungen).", risk: 5, status: "finding", confidence: 0.92, value: "47 auffällig", delta: "+18", owner: "F. Krüger", reviewer: "A. Voss", lastRun: "vor 1 Std.", agent: "JournalSentry v3.1", trend: [12,14,18,20,22,25,29,47] },
  { id: "rew-02", area: "accounting", code: "REW-02", title: "Konten-Abstimmungs-Backlog", desc: "Offene Posten > 60 Tage in Hauptbuch-Konten.", risk: 4, status: "review", confidence: 0.74, value: "€ 412 Tsd.", delta: "+€ 91 Tsd.", owner: "F. Krüger", reviewer: "A. Voss", lastRun: "vor 5 Std.", agent: "ReconAI v2.2", trend: [180,210,240,260,290,310,321,412] },
  { id: "rew-03", area: "accounting", code: "REW-03", title: "Periodenabgrenzung Vollständigkeit", desc: "Plausibilität der Abgrenzungen Q-on-Q.", risk: 4, status: "ok", confidence: 0.86, value: "Δ 1,2%", delta: "im Korridor", owner: "F. Krüger", reviewer: "A. Voss", lastRun: "vor 12 Std.", agent: "AccrualCheck v1.7", trend: [1.0,1.1,0.9,1.2,1.0,1.1,1.0,1.2] },
  { id: "rew-04", area: "accounting", code: "REW-04", title: "Lieferantenrechnungen Duplikate", desc: "Verdacht auf Doppelzahlungen.", risk: 3, status: "ok", confidence: 0.97, value: "3 Verdachtsfälle", delta: "alle geklärt", owner: "F. Krüger", reviewer: "A. Voss", lastRun: "vor 2 Std.", agent: "DupeFinder v2.0", trend: [5,4,6,3,4,5,3,3] },
  // FINANZEN
  { id: "fin-01", area: "finance", code: "FIN-01", title: "Liquiditätsreserve vs. Kovenanten", desc: "Headroom zur Covenant-Verletzung.", risk: 5, status: "ok", confidence: 0.95, value: "€ 38 Mio. HR", delta: "+€ 4 Mio.", owner: "B. Hoffmann", reviewer: "A. Voss", lastRun: "vor 45 Min.", agent: "TreasuryAI v2.5", trend: [28,30,31,32,34,33,34,38] },
  { id: "fin-02", area: "finance", code: "FIN-02", title: "FX-Exposure Hedging-Quote", desc: "Abdeckung netto Fremdwährungspositionen.", risk: 4, status: "review", confidence: 0.81, value: "72%", delta: "−8 pp", owner: "B. Hoffmann", reviewer: "A. Voss", lastRun: "vor 3 Std.", agent: "FXMonitor v1.9", trend: [82,80,81,80,78,79,80,72] },
  { id: "fin-03", area: "finance", code: "FIN-03", title: "Bankverbindungen Vier-Augen-Prinzip", desc: "Änderungen Stammdaten Zahlläufe.", risk: 5, status: "ok", confidence: 0.99, value: "100% konform", delta: "stabil", owner: "B. Hoffmann", reviewer: "A. Voss", lastRun: "vor 1 Std.", agent: "PayCtrl v3.0", trend: [100,100,100,100,100,99,100,100] },
  // CONTROLLING
  { id: "ctr-01", area: "controlling", code: "CTR-01", title: "Forecast-Genauigkeit EBIT", desc: "Abweichung Forecast vs. Ist im rollierenden Horizont.", risk: 3, status: "review", confidence: 0.76, value: "±8,4%", delta: "+2,1 pp", owner: "N. Schwarz", reviewer: "A. Voss", lastRun: "vor 4 Std.", agent: "ForecastAI v2.1", trend: [5.2,5.8,6.1,6.0,6.4,6.2,6.3,8.4] },
  { id: "ctr-02", area: "controlling", code: "CTR-02", title: "Kostenstellen-Drift", desc: "Abweichung Plan/Ist > 15% pro KSt.", risk: 3, status: "ok", confidence: 0.89, value: "12 von 184", delta: "−3", owner: "N. Schwarz", reviewer: "A. Voss", lastRun: "vor 6 Std.", agent: "CostDrift v1.6", trend: [18,16,17,14,13,15,15,12] },
  { id: "ctr-03", area: "controlling", code: "CTR-03", title: "Investitionsantrags-Genehmigungen", desc: "CapEx über Schwellenwert ohne Board-Approval.", risk: 4, status: "pending", confidence: 0, value: "—", delta: "—", owner: "N. Schwarz", reviewer: "A. Voss", lastRun: "fällig", agent: "CapExGate v1.3", trend: [0,1,0,0,1,0,0,0] },
  // IT-SECURITY
  { id: "its-01", area: "itsec", code: "ITS-01", title: "Privilegierte Zugänge Review", desc: "Dormant Admin-Accounts und Stale Permissions.", risk: 5, status: "finding", confidence: 0.94, value: "31 dormant", delta: "+9", owner: "M. Bauer", reviewer: "C. Roth", lastRun: "vor 2 Std.", agent: "PAM-Sentry v3.4", trend: [14,16,18,20,22,21,22,31] },
  { id: "its-02", area: "itsec", code: "ITS-02", title: "Patch-Compliance Critical Systems", desc: "SLA: < 14 Tage für Critical CVEs.", risk: 5, status: "review", confidence: 0.83, value: "89%", delta: "−4 pp", owner: "M. Bauer", reviewer: "C. Roth", lastRun: "vor 1 Std.", agent: "VulnAI v2.7", trend: [94,93,93,94,93,92,93,89] },
  { id: "its-03", area: "itsec", code: "ITS-03", title: "Phishing-Simulation Klickrate", desc: "Quartalskampagne, alle Mitarbeitenden.", risk: 3, status: "ok", confidence: 0.91, value: "4,1%", delta: "−1,3 pp", owner: "M. Bauer", reviewer: "C. Roth", lastRun: "vor 1 Tag", agent: "PhishTest v1.5", trend: [8.2,7.4,6.8,6.2,5.8,5.5,5.4,4.1] },
  // HR
  { id: "hr-01", area: "hr", code: "HR-01", title: "Arbeitszeitgesetz-Verstöße", desc: "Überschreitungen 10h-Tag und Ruhezeiten.", risk: 4, status: "review", confidence: 0.77, value: "28 Fälle", delta: "+6", owner: "J. Fischer", reviewer: "C. Roth", lastRun: "vor 2 Std.", agent: "TimeGuard v2.0", trend: [12,14,16,18,20,22,22,28] },
  { id: "hr-02", area: "hr", code: "HR-02", title: "Headcount-Abweichung vs. Budget", desc: "FTE-Delta Soll/Ist nach Bereich.", risk: 3, status: "ok", confidence: 0.87, value: "+2 FTE", delta: "−1 vs. Q1", owner: "J. Fischer", reviewer: "C. Roth", lastRun: "vor 8 Std.", agent: "HRSync v1.4", trend: [5,4,6,3,4,3,3,2] },
  // EINKAUF
  { id: "prc-01", area: "procurement", code: "PRC-01", title: "Maverick Buying Quote", desc: "Einkäufe außerhalb genehmigter Lieferanten.", risk: 3, status: "ok", confidence: 0.84, value: "7,2%", delta: "−1,1 pp", owner: "R. Meier", reviewer: "A. Voss", lastRun: "vor 4 Std.", agent: "ProcureAI v1.9", trend: [11,10,9,9,8,9,8,7.2] },
  { id: "prc-02", area: "procurement", code: "PRC-02", title: "Lieferantenbewertung Review", desc: "Fällige Jahresbewertungen nach KPI-Set.", risk: 2, status: "pending", confidence: 0, value: "—", delta: "—", owner: "R. Meier", reviewer: "A. Voss", lastRun: "fällig", agent: "VendorRate v1.1", trend: [0,0,0,1,0,0,0,0] },
  // ESG
  { id: "esg-01", area: "esg", code: "ESG-01", title: "CO₂-Emissionen Scope 1+2", desc: "Monatliche Fortschrittsmessung vs. Reduktionspfad.", risk: 4, status: "ok", confidence: 0.90, value: "−12% ggü. VJ", delta: "on track", owner: "L. Schmidt", reviewer: "S. Hartmann", lastRun: "vor 1 Tag", agent: "ClimateAI v2.2", trend: [0,-2,-4,-5,-6,-8,-10,-12] },
  { id: "esg-02", area: "esg", code: "ESG-02", title: "Lieferkettensorgfalt LkSG", desc: "Risikoanalysen und Abhilfemaßnahmen.", risk: 4, status: "review", confidence: 0.73, value: "4 offen", delta: "+2", owner: "L. Schmidt", reviewer: "S. Hartmann", lastRun: "vor 6 Std.", agent: "ChainWatch v1.3", trend: [1,1,2,1,2,2,2,4] },
];

export const FINDINGS: Finding[] = [
  { id: "f-01", assignee: null, kpi: "lgl-03", title: "Rückstellungen für Litigation unterschätzt", severity: "hoch", status: "offen", owner: "Dr. M. Weiss", due: "15.06.2026", opened: "02.05.2026", desc: "KI-Agent identifizierte € 0,8 Mio. Gap zwischen Rückstellungen und erwarteter Zahlungsverpflichtung in 3 Rechtsstreitigkeiten." },
  { id: "f-02", assignee: null, kpi: "rew-01", title: "47 manuelle Buchungen außerhalb Geschäftszeiten", severity: "hoch", status: "in_bearbeitung", owner: "F. Krüger", due: "20.06.2026", opened: "01.05.2026", desc: "Signifikanter Anstieg manueller Buchungen auf Hochrisiko-Konten zwischen 22:00 und 05:00 Uhr." },
  { id: "f-03", assignee: null, kpi: "its-01", title: "31 dormante Admin-Accounts aktiv", severity: "hoch", status: "offen", owner: "M. Bauer", due: "12.06.2026", opened: "03.05.2026", desc: "Privilegierte Accounts ehemaliger Mitarbeitender nicht deaktiviert, davon 4 mit erhöhten Rechten." },
  { id: "f-04", assignee: null, kpi: "dsg-02", title: "23 Drift-Einträge im Verarbeitungsverzeichnis", severity: "mittel", status: "offen", owner: "T. Lindner", due: "30.06.2026", opened: "04.05.2026", desc: "System-Inventar und VVT weichen in 23 Punkten ab, davon 8 mit potenziell datenschutzrechtlicher Relevanz." },
];

export const ACTIVITIES: Activity[] = [
  { id: "a-01", type: "finding", kpiCode: "REW-01", kpiId: "rew-01", user: "JournalSentry", avatar: "JS", time: "vor 14 Min.", msg: "Finding: 47 manuelle Buchungen außerhalb Geschäftszeiten identifiziert" },
  { id: "a-02", type: "approved", kpiCode: "FIN-03", kpiId: "fin-03", user: "A. Voss", avatar: "AV", time: "vor 28 Min.", msg: "FIN-03 als geprüft freigegeben – alle Zahlläufe konform" },
  { id: "a-03", type: "rerun", kpiCode: "CMP-04", kpiId: "cmp-04", user: "TrainSync", avatar: "TS", time: "vor 41 Min.", msg: "Agent neu gestartet – Schulungsquoten werden aktualisiert" },
  { id: "a-04", type: "comment", kpiCode: "LGL-01", kpiId: "lgl-01", user: "S. Hartmann", avatar: "SH", time: "vor 1 Std.", msg: "Bitte prüfen ob KI-Bewertung der neuen Klagen mit Schriftsätzen übereinstimmt" },
  { id: "a-05", type: "finding", kpiCode: "ITS-01", kpiId: "its-01", user: "PAM-Sentry", avatar: "PS", time: "vor 2 Std.", msg: "31 dormante Admin-Accounts identifiziert – Sofortmaßnahme erforderlich" },
  { id: "a-06", type: "approved", kpiCode: "CMP-01", kpiId: "cmp-01", user: "K. Berger", avatar: "KB", time: "vor 3 Std.", msg: "CMP-01 freigegeben – 8.412 Geschäftspartner ohne Treffer" },
  { id: "a-07", type: "agent", kpiCode: "DSG-02", kpiId: "dsg-02", user: "RecordSync", avatar: "RS", time: "vor 8 Std.", msg: "Verarbeitungsverzeichnis-Drift auf 23 gestiegen – Finding ausgelöst" },
];
