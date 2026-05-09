"use client";
import { useState, useEffect } from "react";
import { TopBar } from "./TopBar";
import { ActivitySidebar } from "./ActivitySidebar";
import { Dashboard } from "./views/Dashboard";
import { HeatmapView } from "./views/HeatmapView";
import { TimelineView } from "./views/TimelineView";
import { FindingsView } from "./views/FindingsView";
import { AgentsView } from "./views/AgentsView";
import { KpiDetail } from "./KpiDetail";
import { KPIS, CURRENT_QUARTER } from "@/data/audit-data";
import type { Kpi } from "@/types";

export type ViewId = "dashboard" | "heatmap" | "timeline" | "findings" | "agents";

type ToastType = "ok" | "info" | "warn" | "alert";

export function AppShell() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [openKpiId, setOpenKpiId] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [kpis, setKpis] = useState<Kpi[]>(KPIS);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const openKpi = (id: string) => setOpenKpiId(id);
  const closeKpi = () => setOpenKpiId(null);

  const handleAction = (action: string, kpi: Kpi) => {
    if (action === "approve") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "ok", lastRun: "gerade eben" } : k));
      setToast({ msg: `${kpi.code} als geprüft freigegeben`, type: "ok" });
      closeKpi();
    } else if (action === "rerun") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "running", confidence: 0, lastRun: "läuft" } : k));
      setToast({ msg: `${kpi.code} – Agent neu gestartet`, type: "info" });
      setTimeout(() => {
        setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "ok", confidence: 0.94, lastRun: "vor wenigen Sek." } : k));
      }, 3500);
    } else if (action === "snooze") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "review" } : k));
      setToast({ msg: `${kpi.code} an Reviewer eskaliert`, type: "warn" });
      closeKpi();
    } else if (action === "finding") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "finding" } : k));
      setToast({ msg: `Finding für ${kpi.code} angelegt`, type: "alert" });
      closeKpi();
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openKpiObj = openKpiId ? kpis.find((k) => k.id === openKpiId) ?? null : null;

  return (
    <div id="app">
      <TopBar quarter={CURRENT_QUARTER} view={view} setView={setView} />

      <div className="main">
        <main className="main-content">
          {view === "dashboard" && (
            <Dashboard
              kpis={kpis}
              onOpenKpi={openKpi}
              filterArea={filterArea}
              setFilterArea={setFilterArea}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          )}
          {view === "heatmap"  && <HeatmapView  kpis={kpis} onOpenKpi={openKpi} />}
          {view === "timeline" && <TimelineView  kpis={kpis} />}
          {view === "findings" && <FindingsView  kpis={kpis} onOpenKpi={openKpi} />}
          {view === "agents"   && <AgentsView    kpis={kpis} />}
        </main>

        <ActivitySidebar onOpenKpi={openKpi} />
      </div>

      {openKpiObj && (
        <KpiDetail kpi={openKpiObj} onClose={closeKpi} onAction={handleAction} />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-dot" />
          {toast.msg}
        </div>
      )}
    </div>
  );
}
