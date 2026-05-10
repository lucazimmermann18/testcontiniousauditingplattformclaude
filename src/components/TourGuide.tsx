"use client";
import { useState, useEffect, useCallback } from "react";

interface TourStep {
  target: string; // CSS selector
  title: string;
  body: string;
  placement: "bottom" | "right" | "left" | "top";
}

const STEPS: TourStep[] = [
  {
    target: ".brand",
    title: "Willkommen bei CONTINUUM·AUDIT",
    body: "Ihre KI-gestützte Continuous-Auditing-Plattform. In wenigen Schritten zeigen wir Ihnen die wichtigsten Funktionen.",
    placement: "bottom",
  },
  {
    target: ".topnav-btn:nth-child(1)",
    title: "Übersicht / Dashboard",
    body: "Hier sehen Sie auf einen Blick: KPI-Status, Risikokennzahlen und alle wichtigen Charts – live aktualisiert.",
    placement: "bottom",
  },
  {
    target: ".topnav-btn:nth-child(4)",
    title: "Findings-Management",
    body: "Alle offenen Audit-Befunde, deren Schweregrade und der Maßnahmenplan-Workflow zwischen Revisor und Fachbereich.",
    placement: "bottom",
  },
  {
    target: ".topnav-btn:nth-child(6)",
    title: "KI-Agenten",
    body: "Starten Sie 4-Stage Multi-Agenten-Prüfläufe mit Scout, Analyst, Cross-Checker und Risk-Rater. Mit Live-Terminal-Log.",
    placement: "bottom",
  },
  {
    target: ".topnav-btn-highlight",
    title: "KI-Audit-Assistent",
    body: "Ihr intelligenter Gesprächspartner: stellt Fragen zu KPIs, entwirft Prüfungsmitteilungen und analysiert Systemrisiken.",
    placement: "bottom",
  },
  {
    target: ".topbar-search-btn",
    title: "Globale Suche",
    body: "Mit ⌘K können Sie jederzeit KPIs und Findings blitzschnell finden – von überall in der Plattform.",
    placement: "bottom",
  },
  {
    target: ".user-chip",
    title: "Ihr Profil & Rollen",
    body: "Die Plattform unterscheidet zwischen Admin, Head of Audit, Reviewer und Process Owner – jede Rolle sieht nur was relevant ist.",
    placement: "left",
  },
];

function getElRect(selector: string): DOMRect | null {
  try {
    const el = document.querySelector(selector);
    return el ? el.getBoundingClientRect() : null;
  } catch {
    return null;
  }
}

export function TourGuide() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem("tour_done");
    if (!seen) {
      const t = setTimeout(() => setActive(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const updateRect = useCallback(() => {
    if (!active) return;
    const r = getElRect(STEPS[step]?.target);
    setRect(r);
  }, [active, step]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [updateRect]);

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    setActive(false);
    localStorage.setItem("tour_done", "1");
  }

  if (!active) {
    return (
      <button
        className="tour-restart-btn"
        onClick={() => { setStep(0); setActive(true); }}
        title="Produkt-Tour starten"
      >
        ?
      </button>
    );
  }

  const current = STEPS[step];
  const PAD = 8;

  let tooltipStyle: React.CSSProperties = {};
  if (rect) {
    if (current.placement === "bottom") {
      tooltipStyle = { top: rect.bottom + PAD, left: rect.left, transform: "none" };
    } else if (current.placement === "right") {
      tooltipStyle = { top: rect.top, left: rect.right + PAD };
    } else if (current.placement === "left") {
      tooltipStyle = { top: rect.top, left: rect.left - 320 - PAD };
    } else {
      tooltipStyle = { top: rect.top - PAD - 160, left: rect.left };
    }
    // clamp to viewport
    tooltipStyle.maxWidth = 300;
  } else {
    tooltipStyle = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }

  const spotlightStyle: React.CSSProperties = rect ? {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  } : { display: "none" };

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <div className="tour-overlay" onClick={finish} aria-hidden />
      {rect && <div className="tour-spotlight" style={spotlightStyle} />}

      {/* Tooltip */}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-tt-head">
          <span className="tour-tt-step">{step + 1} / {STEPS.length}</span>
          <button className="tour-tt-close" onClick={finish}>×</button>
        </div>
        <div className="tour-tt-title">{current.title}</div>
        <div className="tour-tt-body">{current.body}</div>
        <div className="tour-tt-foot">
          <button className="tour-tt-btn tour-tt-skip" onClick={finish}>Tour überspringen</button>
          <div className="tour-tt-nav">
            {step > 0 && <button className="tour-tt-btn tour-tt-prev" onClick={prev}>← Zurück</button>}
            <button className="tour-tt-btn tour-tt-next" onClick={next}>
              {step === STEPS.length - 1 ? "Tour beenden ✓" : "Weiter →"}
            </button>
          </div>
        </div>
        {/* progress dots */}
        <div className="tour-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tour-dot${i === step ? " tour-dot-active" : ""}`} onClick={() => setStep(i)} />
          ))}
        </div>
      </div>
    </>
  );
}
