"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { TopBar } from "./TopBar";
import { ActivitySidebar } from "./ActivitySidebar";
import { Dashboard } from "./views/Dashboard";
import { HeatmapView } from "./views/HeatmapView";
import { TimelineView } from "./views/TimelineView";
import { FindingsView } from "./views/FindingsView";
import { AgentsView } from "./views/AgentsView";
import { AuditHistoryView } from "./views/AuditHistoryView";
import { TasksView } from "./views/TasksView";
import { AssistantView } from "./views/AssistantView";
import { QuarterCompareView } from "./views/QuarterCompareView";
import { AuditPlanView } from "./views/AuditPlanView";
import { ApprovalsView } from "./views/ApprovalsView";
import { CalendarView } from "./views/CalendarView";
import { SearchModal } from "./SearchModal";
import { OnboardingGate } from "./OnboardingModal";
import { TourGuide } from "./TourGuide";
import { DashboardSkeleton } from "./ui/Skeleton";
import { KpiDetail } from "./KpiDetail";
import { CURRENT_QUARTER } from "@/data/audit-data";
import type { Kpi, Finding, Activity } from "@/types";

export type ViewId = "dashboard" | "heatmap" | "timeline" | "findings" | "tasks" | "agents" | "history" | "assistant" | "quarters" | "planning" | "calendar" | "approvals";

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
  const [darkMode, setDarkMode] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const rerunAbortRefs = useRef<Record<string, AbortController>>({});

  const showToast = (msg: string, type: ToastType) => setToast({ msg, type });

  // Dark mode init from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  // Cmd+K / Ctrl+K global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

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

  // 15 s live-refresh
  useEffect(() => {
    const id = setInterval(() => {
      fetchKpis();
      fetchFindings();
      fetchActivities();
    }, 15_000);
    return () => clearInterval(id);
  }, [fetchKpis, fetchFindings, fetchActivities]);

  const openKpi = (id: string) => setOpenKpiId(id);
  const closeKpi = () => setOpenKpiId(null);

  const handleAction = async (action: string, kpi: Kpi) => {
    if (action === "approve") {
      await fetch(`/api/kpis/${kpi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ok", lastRun: "gerade eben" }),
      });
      showToast(`${kpi.code} als geprüft freigegeben`, "ok");
      closeKpi();
      fetchKpis();
      fetchActivities();
    } else if (action === "rerun") {
      rerunAbortRefs.current[kpi.id]?.abort();
      const ctrl = new AbortController();
      rerunAbortRefs.current[kpi.id] = ctrl;

      setKpis((prev) => prev.map((k) => k.id === kpi.id ? { ...k, status: "running" } : k));
      await fetch(`/api/kpis/${kpi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "running" }),
      });
      showToast(`${kpi.code} – Agent neu gestartet`, "info");

      try {
        const res = await fetch(`/api/agents/${kpi.id}`, { method: "POST", signal: ctrl.signal });
        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const chunk = JSON.parse(line.slice(6));
              if (chunk.type === "done" || chunk.type === "error") {
                fetchKpis();
                fetchFindings();
                fetchActivities();
              }
            }
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") fetchKpis();
      }
    } else if (action === "snooze") {
      await fetch(`/api/kpis/${kpi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "review" }),
      });
      showToast(`${kpi.code} an Reviewer eskaliert`, "warn");
      closeKpi();
      fetchKpis();
      fetchActivities();
    } else if (action === "finding") {
      await fetch(`/api/kpis/${kpi.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finding" }),
      });
      showToast(`Finding für ${kpi.code} angelegt`, "alert");
      closeKpi();
      fetchKpis();
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
        <div className="topbar" style={{ opacity: 0.5, pointerEvents: "none" }}>
          <div className="brand">
            <div className="brand-mark">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 12h3l2-5 3 10 2-5h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <div className="brand-text">
              <div className="brand-name">CONTINUUM<span>·</span>AUDIT</div>
              <div className="brand-sub">Continuous Auditing Plattform</div>
            </div>
          </div>
        </div>
        <div className="main">
          <main className="main-content">
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div id="app">
      <TopBar
        quarter={CURRENT_QUARTER}
        view={view}
        setView={setView}
        me={me}
        onOpenKpi={openKpi}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenSearch={() => setSearchOpen(true)}
      />

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
          {view === "heatmap"   && <HeatmapView  kpis={kpis} onOpenKpi={openKpi} />}
          {view === "timeline"  && <TimelineView  kpis={kpis} />}
          {view === "findings"  && (
            <FindingsView
              kpis={kpis}
              findings={findings}
              onOpenKpi={openKpi}
              onFindingsUpdated={fetchFindings}
            />
          )}
          {view === "tasks"     && <TasksView />}
          {view === "assistant" && <AssistantView kpis={kpis} findings={findings} />}
          {view === "agents"    && <AgentsView kpis={kpis} onKpisUpdated={fetchKpis} />}
          {view === "history"   && <AuditHistoryView kpis={kpis} onOpenKpi={openKpi} />}
          {view === "quarters"  && <QuarterCompareView kpis={kpis} />}
          {view === "planning"  && <AuditPlanView kpis={kpis} me={me} onKpisUpdated={fetchKpis} />}
          {view === "calendar"  && <CalendarView kpis={kpis} findings={findings} />}
          {view === "approvals" && <ApprovalsView me={me} />}
        </main>

        <ActivitySidebar activities={activities} onOpenKpi={openKpi} />
      </div>

      {openKpiObj && (
        <KpiDetail
          kpi={openKpiObj}
          onClose={closeKpi}
          onAction={handleAction}
          me={me}
          onKpiUpdated={fetchKpis}
        />
      )}

      <OnboardingGate hasApiKey={true} />
      <TourGuide />

      {searchOpen && (
        <SearchModal
          kpis={kpis}
          findings={findings}
          onOpenKpi={(id) => { openKpi(id); setSearchOpen(false); }}
          onClose={() => setSearchOpen(false)}
        />
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
