"use client";
import { useState, useEffect, useCallback } from "react";
import { TopBar } from "./TopBar";
import { ActivitySidebar } from "./ActivitySidebar";
import { Dashboard } from "./views/Dashboard";
import { HeatmapView } from "./views/HeatmapView";
import { TimelineView } from "./views/TimelineView";
import { FindingsView } from "./views/FindingsView";
import { AgentsView } from "./views/AgentsView";
import { KpiDetail } from "./KpiDetail";
import { CURRENT_QUARTER } from "@/data/audit-data";
import type { Kpi, Finding, Activity } from "@/types";

export type ViewId = "dashboard" | "heatmap" | "timeline" | "findings" | "agents";

type ToastType = "ok" | "info" | "warn" | "alert";

interface MeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export function AppShell() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [openKpiId, setOpenKpiId] = useState<string | null>(null);
  const [filterArea, setFilterArea] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const showToast = (msg: string, type: ToastType) => setToast({ msg, type });

  const fetchKpis = useCallback(async () => {
    const res = await fetch("/api/kpis");
    if (res.ok) setKpis(await res.json());
  }, []);

  const fetchFindings = useCallback(async () => {
    const res = await fetch("/api/findings");
    if (res.ok) setFindings(await res.json());
  }, []);

  const fetchActivities = useCallback(async () => {
    const res = await fetch("/api/activities");
    if (res.ok) setActivities(await res.json());
  }, []);

  useEffect(() => {
    Promise.all([
      fetchKpis(),
      fetchFindings(),
      fetchActivities(),
      fetch("/api/me").then((r) => r.ok ? r.json() : null).then(setMe),
    ]).finally(() => setLoading(false));
  }, [fetchKpis, fetchFindings, fetchActivities]);

  const openKpi = (id: string) => setOpenKpiId(id);
  const closeKpi = () => setOpenKpiId(null);

  const handleAction = async (action: string, kpi: Kpi) => {
    if (action === "approve") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "ok", lastRun: "gerade eben" } : k));
      await fetch(`/api/kpis/${kpi.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ok", lastRun: "gerade eben" }) });
      showToast(`${kpi.code} als geprüft freigegeben`, "ok");
      closeKpi();
      fetchActivities();
    } else if (action === "rerun") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "running", confidence: 0, lastRun: "läuft" } : k));
      await fetch(`/api/kpis/${kpi.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "running", confidence: 0, lastRun: "läuft" }) });
      showToast(`${kpi.code} – Agent neu gestartet`, "info");
      setTimeout(async () => {
        setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "ok", confidence: 0.94, lastRun: "vor wenigen Sek." } : k));
        await fetch(`/api/kpis/${kpi.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "ok", confidence: 0.94, lastRun: "vor wenigen Sek." }) });
        fetchActivities();
      }, 3500);
    } else if (action === "snooze") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "review" } : k));
      await fetch(`/api/kpis/${kpi.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "review" }) });
      showToast(`${kpi.code} an Reviewer eskaliert`, "warn");
      closeKpi();
      fetchActivities();
    } else if (action === "finding") {
      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "finding" } : k));
      await fetch(`/api/kpis/${kpi.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "finding" }) });
      showToast(`Finding für ${kpi.code} angelegt`, "alert");
      closeKpi();
      fetchFindings();
      fetchActivities();
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openKpiObj = openKpiId ? kpis.find((k) => k.id === openKpiId) ?? null : null;

  if (loading) {
    return (
      <div id="app">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--ink-3)", fontSize: "0.875rem" }}>
          Plattform wird geladen…
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      <TopBar quarter={CURRENT_QUARTER} view={view} setView={setView} me={me} />

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
          {view === "findings" && <FindingsView  kpis={kpis} findings={findings} onOpenKpi={openKpi} />}
          {view === "agents"   && <AgentsView    kpis={kpis} />}
        </main>

        <ActivitySidebar activities={activities} onOpenKpi={openKpi} />
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
