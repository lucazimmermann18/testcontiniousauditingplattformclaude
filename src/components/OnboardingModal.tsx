"use client";
import { useState, useEffect } from "react";

const STEPS = [
  {
    id: "welcome",
    title: "Willkommen bei Continuum Audit",
    subtitle: "Ihre KI-gestützte Continuous Auditing Plattform",
    icon: "🎯",
    content: "Continuum Audit prüft Ihre KPIs automatisch mit einem 4-stufigen KI-Agenten-System (Scout → Analyst → Cross-Checker → Risk-Rater) und liefert revisionsichere Prüfungsurteile in Echtzeit.",
    action: "Los geht's →",
  },
  {
    id: "apikey",
    title: "KI-Provider konfigurieren",
    subtitle: "Schritt 1 von 3",
    icon: "🔑",
    content: "Damit die KI-Agenten arbeiten können, benötigen Sie einen API-Key von Anthropic (Claude) oder einem anderen unterstützten Anbieter. Ohne API-Key laufen die Agenten im Demo-Modus.",
    action: "API-Key einrichten →",
    link: "/settings",
  },
  {
    id: "kpis",
    title: "KPIs einrichten",
    subtitle: "Schritt 2 von 3",
    icon: "📊",
    content: "Definieren Sie Ihre Prüfobjekte. Jeder KPI repräsentiert einen Kontrollbereich (z.B. FIN-001 für Abschlussberichte, ITS-003 für Zugriffsrechte). Weisen Sie Owner und Reviewer zu.",
    action: "KPIs verwalten →",
    link: "/settings?tab=kpis",
  },
  {
    id: "agents",
    title: "Erste Prüfung starten",
    subtitle: "Schritt 3 von 3",
    icon: "🤖",
    content: "Wählen Sie einen KPI aus und starten Sie den KI-Agenten. Das 4-stufige System analysiert die Daten und liefert innerhalb von Sekunden ein fundiertes Prüfungsurteil mit Anomalie-Erkennung.",
    action: "Zum Agenten-Dashboard →",
    final: true,
  },
];

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  function next() {
    if (current.link) {
      window.location.href = current.link;
    } else if (current.final || step >= STEPS.length - 1) {
      onClose();
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Progress dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot${i === step ? " active" : i < step ? " done" : ""}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="onboarding-icon">{current.icon}</div>
        <div className="onboarding-subtitle">{current.subtitle}</div>
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-content">{current.content}</p>

        {/* Actions */}
        <div className="onboarding-actions">
          <button className="btn btn-primary onboarding-next" onClick={next}>
            {current.action}
          </button>
          {step > 0 && (
            <button className="btn-link onboarding-back" onClick={() => setStep((s) => s - 1)}>
              ← Zurück
            </button>
          )}
        </div>

        {/* Skip */}
        <button className="onboarding-skip" onClick={onClose}>
          Überspringen
        </button>
      </div>
    </div>
  );
}

const STORAGE_KEY = "onboarding_dismissed";

export function OnboardingGate({ hasApiKey }: { hasApiKey: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Show onboarding after a short delay so the app loads first
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  if (!show) return null;
  return <OnboardingModal onClose={dismiss} />;
}
