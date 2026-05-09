import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter } as any);

const MOCK_DESCRIPTIONS: Record<string, string> = {
  "LGL-01": "Vertragsdaten: 847 aktive Verträge mit Laufzeit- und Kündigungsfrist-Details",
  "LGL-02": "Marken- und Domain-Monitoring-Ergebnisse (DE/EU/US)",
  "LGL-03": "Rückstellungsdaten vs. anhängige Rechtsstreitigkeiten Q2 2026",
  "CMP-01": "Sanktionslistenscreening 8.412 Geschäftspartner (EU/OFAC/UN)",
  "CMP-02": "Geschenke & Einladungen Register Q2 2026",
  "CMP-03": "Whistleblower-Hinweise SLA-Tracking Q2 2026",
  "CMP-04": "Code-of-Conduct-Schulungsquoten GJ 2026",
  "DSG-01": "DSGVO Art. 15 Auskunftsersuchen Q2 2026",
  "DSG-02": "Verarbeitungsverzeichnis (VVT) Drift-Analyse: 23 Abweichungen",
  "DSG-03": "Auftragsverarbeiter (AVV) Review-Status: 152 aktive AVVs",
  "REW-01": "Journal-Einträge außerhalb Geschäftszeiten (22:00–05:00) auf Hochrisiko-Konten",
  "REW-02": "Konten-Abstimmungs-Backlog: Offene Posten >60 Tage",
  "REW-03": "Periodenabgrenzung Plausibilitätsprüfung Q2 2026",
  "REW-04": "Lieferantenrechnung Duplikat-Screening: 3.847 Rechnungen geprüft",
  "FIN-01": "Liquiditätsreserve vs. Kovenanten-Anforderungen",
  "FIN-02": "FX-Exposure Hedging-Analyse",
  "FIN-03": "Bankverbindungs-Änderungen Vier-Augen-Prinzip Q2 2026",
  "CTR-01": "Forecast-Genauigkeit EBIT Q2 2026",
  "CTR-02": "Kostenstellen-Drift Q2 2026",
  "CTR-03": "CapEx-Genehmigungen über Schwellenwert",
  "ITS-01": "Privilegierte Accounts Inventur per 09.05.2026",
  "ITS-02": "Patch-Compliance Critical Systems (CVEs ≥ 9.0)",
  "ITS-03": "Phishing-Simulation Q2 2026: Kampagnenergebnis",
  "HR-01": "Arbeitszeitgesetz-Verstöße Q2 2026",
  "HR-02": "Headcount Soll/Ist-Vergleich Q2 2026",
  "PRC-01": "Maverick-Buying-Analyse Q2 2026",
  "PRC-02": "Lieferantenbewertung Review-Status GJ 2025",
  "ESG-01": "CO₂-Emissionen Scope 1+2 Q2 2026",
  "ESG-02": "LkSG Risikoanalysen Q2 2026",
};

async function main() {
  const kpis = await db.kpi.findMany({ select: { id: true, code: true } });
  let seeded = 0;
  for (const kpi of kpis) {
    const desc = MOCK_DESCRIPTIONS[kpi.code];
    if (!desc) continue;
    await (db as any).kpiMockData.upsert({
      where: { kpiId: kpi.id },
      create: { kpiId: kpi.id, description: desc, data: JSON.stringify({ seeded: true, note: "Full mock data loaded from src/lib/agents/mock-data/index.ts at runtime" }) },
      update: { description: desc },
    });
    seeded++;
  }
  console.log(`✅ ${seeded} KPI mock data descriptions seeded`);
}

main().catch(console.error).finally(() => db.$disconnect());
