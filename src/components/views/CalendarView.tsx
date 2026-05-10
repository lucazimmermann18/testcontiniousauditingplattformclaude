"use client";
import { useState, useEffect, useMemo } from "react";
import type { Kpi, Finding } from "@/types";

// ── Types ────────────────────────────────────────────────────

type EventKind = "finding_due" | "agent_run" | "audit_plan" | "review_due";

interface CalEvent {
  id: string;
  date: Date;
  kind: EventKind;
  label: string;
  sub?: string;
  severity?: string;
  status?: string;
}

interface Schedule {
  kpiId: string;
  enabled: boolean;
  nextRunAt: string | null;
  kpi: { code: string; title: string };
}

// ── Helpers ──────────────────────────────────────────────────

const KIND_META: Record<EventKind, { icon: string; label: string; color: string }> = {
  finding_due: { icon: "⚠", label: "Finding fällig", color: "#ef4444" },
  agent_run:   { icon: "🤖", label: "Agent-Lauf", color: "#3b82f6" },
  audit_plan:  { icon: "📋", label: "Prüftermin", color: "#8b5cf6" },
  review_due:  { icon: "🔍", label: "Review", color: "#f59e0b" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstWeekday(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isToday(d: Date) { return isSameDay(d, new Date()); }

const MONTH_NAMES = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
const DAY_NAMES = ["Mo","Di","Mi","Do","Fr","Sa","So"];

// ── Day Detail Popover ────────────────────────────────────────

function DayPopover({ events, onClose }: { events: CalEvent[]; onClose: () => void }) {
  return (
    <div className="cal-popover" onClick={onClose}>
      <div className="cal-popover-inner" onClick={(e) => e.stopPropagation()}>
        <div className="cal-popover-head">
          <span>{events[0] ? events[0].date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" }) : ""}</span>
          <button className="cal-popover-close" onClick={onClose}>×</button>
        </div>
        <div className="cal-popover-events">
          {events.map((ev) => {
            const meta = KIND_META[ev.kind];
            return (
              <div key={ev.id} className="cal-pop-event" style={{ borderLeftColor: meta.color }}>
                <div className="cal-pop-icon">{meta.icon}</div>
                <div>
                  <div className="cal-pop-label">{ev.label}</div>
                  {ev.sub && <div className="cal-pop-sub">{ev.sub}</div>}
                  <div className="cal-pop-kind">{meta.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export function CalendarView({ kpis, findings }: { kpis: Kpi[]; findings: Finding[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [planData, setPlanData] = useState<{ kpiId: string; plannedDate: string }[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  useEffect(() => {
    fetch("/api/agents/schedule").then((r) => r.ok ? r.json() : []).then(setSchedules);
    try {
      const stored = localStorage.getItem("audit_plan_v2");
      if (stored) {
        const plan = JSON.parse(stored) as { kpiId: string; plannedDate: string; done: boolean }[];
        setPlanData(plan.filter((e) => !e.done));
      }
    } catch { /* ignore */ }
  }, []);

  // Build event list
  const events = useMemo<CalEvent[]>(() => {
    const evs: CalEvent[] = [];

    // Finding due dates
    for (const f of findings) {
      if (f.due && f.status !== "geschlossen") {
        const d = new Date(f.due);
        if (!isNaN(d.getTime())) {
          evs.push({
            id: `f-${f.id}`, date: d, kind: "finding_due",
            label: f.title, sub: `${f.kpiCode} · ${f.severity}`,
            severity: f.severity, status: f.status,
          });
        }
      }
    }

    // Agent scheduled runs
    for (const sched of schedules) {
      if (sched.enabled && sched.nextRunAt) {
        const d = new Date(sched.nextRunAt);
        if (!isNaN(d.getTime())) {
          evs.push({
            id: `a-${sched.kpiId}`, date: d, kind: "agent_run",
            label: `${sched.kpi.code} Agent-Lauf`, sub: sched.kpi.title,
          });
        }
      }
    }

    // Audit plan entries
    for (const entry of planData) {
      const kpi = kpis.find((k) => k.id === entry.kpiId);
      if (kpi && entry.plannedDate) {
        const d = new Date(entry.plannedDate);
        if (!isNaN(d.getTime())) {
          evs.push({
            id: `p-${entry.kpiId}`, date: d, kind: "audit_plan",
            label: `${kpi.code} Prüftermin`, sub: kpi.title,
          });
        }
      }
    }

    // KPIs in review status — flag them for the current month
    for (const k of kpis.filter((k) => k.status === "review")) {
      const d = new Date(today.getFullYear(), today.getMonth(), 15);
      evs.push({
        id: `r-${k.id}`, date: d, kind: "review_due",
        label: `${k.code} Review ausstehend`, sub: k.title,
      });
    }

    return evs.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [findings, schedules, planData, kpis]);

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);
  const cells: (Date | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function eventsForDay(d: Date) {
    return events.filter((ev) => isSameDay(ev.date, d));
  }

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  // Upcoming list: next 30 days
  const upcomingCutoff = new Date(today.getTime() + 30 * 86400000);
  const upcomingEvents = events.filter((ev) => ev.date >= today && ev.date <= upcomingCutoff);

  // Month summary counts
  const monthEvs = events.filter((ev) => ev.date.getFullYear() === year && ev.date.getMonth() === month);
  const byKind = Object.fromEntries(
    (Object.keys(KIND_META) as EventKind[]).map((k) => [k, monthEvs.filter((e) => e.kind === k).length])
  ) as Record<EventKind, number>;

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Audit-Kalender</h2>
          <p className="view-sub">Prüftermine · Fälligkeiten · Agent-Läufe · Reviews</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`cal-view-btn${viewMode === "month" ? " active" : ""}`} onClick={() => setViewMode("month")}>Monat</button>
          <button className={`cal-view-btn${viewMode === "list" ? " active" : ""}`} onClick={() => setViewMode("list")}>Liste</button>
        </div>
      </div>

      {/* Summary legend row */}
      <div className="cal-summary-row">
        {(Object.entries(KIND_META) as [EventKind, typeof KIND_META[EventKind]][]).map(([k, meta]) => (
          <div key={k} className="cal-summary-pill" style={{ borderColor: meta.color }}>
            <span>{meta.icon}</span>
            <span className="cal-sum-label">{meta.label}</span>
            <span className="cal-sum-count" style={{ color: meta.color }}>{byKind[k]}</span>
          </div>
        ))}
      </div>

      {viewMode === "month" ? (
        <>
          {/* Month navigation */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
            <div className="cal-nav-title">{MONTH_NAMES[month]} {year}</div>
            <button className="cal-nav-btn" onClick={nextMonth}>›</button>
            <button className="cal-nav-today" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>
              Heute
            </button>
          </div>

          {/* Grid */}
          <div className="cal-grid">
            {DAY_NAMES.map((d) => <div key={d} className="cal-weekday">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="cal-cell cal-cell-empty" />;
              const dayEvs = eventsForDay(day);
              const todayClass = isToday(day) ? " cal-cell-today" : "";
              const pastClass = day < new Date(today.getFullYear(), today.getMonth(), today.getDate()) ? " cal-cell-past" : "";
              const hasEvClass = dayEvs.length > 0 ? " cal-cell-has-events" : "";
              return (
                <div
                  key={`d-${i}`}
                  className={`cal-cell${todayClass}${pastClass}${hasEvClass}`}
                  onClick={() => dayEvs.length > 0 ? setSelectedDay(day) : null}
                >
                  <div className="cal-day-num">{day.getDate()}</div>
                  <div className="cal-day-events">
                    {dayEvs.slice(0, 3).map((ev) => {
                      const meta = KIND_META[ev.kind];
                      return (
                        <div key={ev.id} className="cal-event-chip" style={{ background: meta.color + "22", color: meta.color }}>
                          {meta.icon} {ev.label.slice(0, 14)}{ev.label.length > 14 ? "…" : ""}
                        </div>
                      );
                    })}
                    {dayEvs.length > 3 && (
                      <div className="cal-event-more">+{dayEvs.length - 3} weitere</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* List view */
        <div className="cal-list">
          <div className="cal-list-title">Nächste 30 Tage ({upcomingEvents.length} Ereignisse)</div>
          {upcomingEvents.length === 0 && <div className="tab-empty">Keine geplanten Ereignisse in den nächsten 30 Tagen.</div>}
          {upcomingEvents.map((ev) => {
            const meta = KIND_META[ev.kind];
            const diff = Math.ceil((ev.date.getTime() - today.getTime()) / 86400000);
            return (
              <div key={ev.id} className="cal-list-event" style={{ borderLeftColor: meta.color }}>
                <div className="cal-list-icon">{meta.icon}</div>
                <div className="cal-list-body">
                  <div className="cal-list-label">{ev.label}</div>
                  {ev.sub && <div className="cal-list-sub">{ev.sub}</div>}
                </div>
                <div className="cal-list-right">
                  <div className="cal-list-date">
                    {ev.date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </div>
                  <div className="cal-list-diff" style={{ color: diff <= 3 ? "#ef4444" : diff <= 7 ? "#f59e0b" : "var(--ink-4)" }}>
                    {diff === 0 ? "Heute" : diff === 1 ? "Morgen" : `in ${diff}d`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && selectedEvents.length > 0 && (
        <DayPopover events={selectedEvents} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}
