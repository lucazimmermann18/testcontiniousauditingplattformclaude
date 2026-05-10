import type { Finding, Kpi } from "@/types";
import * as XLSX from "xlsx";

export function exportFindingsExcel(findings: Finding[], kpis: Kpi[]) {
  const rows = findings.map((f) => {
    const kpi = kpis.find((k) => k.id === f.kpi);
    return {
      "KPI-Code":    kpi?.code ?? "",
      "KPI-Titel":   kpi?.title ?? "",
      "Finding":     f.title,
      "Beschreibung": f.desc,
      "Schwere":     f.severity,
      "Status":      f.status,
      "Owner":       f.owner,
      "Fällig am":   f.due,
      "Eröffnet":    f.opened,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Findings");

  // Column widths
  ws["!cols"] = [
    { wch: 10 }, { wch: 30 }, { wch: 40 }, { wch: 60 },
    { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
  ];

  XLSX.writeFile(wb, `findings-export-${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function exportKpisExcel(kpis: Kpi[]) {
  const rows = kpis.map((k) => ({
    "Code":      k.code,
    "Titel":     k.title,
    "Bereich":   k.area,
    "Status":    k.status,
    "Konfidenz": k.confidence > 0 ? `${Math.round(k.confidence * 100)}%` : "—",
    "Wert":      k.value,
    "Delta":     k.delta,
    "Letzter Lauf": k.lastRun,
    "Owner":     k.owner,
    "Reviewer":  k.reviewer,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "KPIs");
  ws["!cols"] = [
    { wch: 10 }, { wch: 35 }, { wch: 15 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 20 },
    { wch: 20 }, { wch: 20 },
  ];
  XLSX.writeFile(wb, `kpi-export-${new Date().toISOString().split("T")[0]}.xlsx`);
}
