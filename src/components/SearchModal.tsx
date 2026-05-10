"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Kpi, Finding } from "@/types";

interface SearchResult {
  type: "kpi" | "finding";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  badge?: string;
}

const STATUS_COLOR: Record<string, string> = {
  ok: "var(--ok)", review: "var(--warn)", finding: "var(--alert)",
  running: "var(--info)", pending: "var(--ink-3)",
  offen: "var(--alert)", in_bearbeitung: "var(--warn)", geschlossen: "var(--ok)",
  hoch: "var(--alert)", mittel: "var(--warn)", niedrig: "var(--info)",
};

interface SearchModalProps {
  kpis: Kpi[];
  findings: Finding[];
  onOpenKpi: (id: string) => void;
  onClose: () => void;
}

export function SearchModal({ kpis, findings, onOpenKpi, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results: SearchResult[] = query.trim().length < 1 ? [] : (() => {
    const q = query.toLowerCase();
    const kpiResults: SearchResult[] = kpis
      .filter((k) =>
        k.code.toLowerCase().includes(q) ||
        k.title.toLowerCase().includes(q) ||
        k.desc?.toLowerCase().includes(q) ||
        k.areaName?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((k) => ({
        type: "kpi",
        id: k.id,
        title: k.title,
        subtitle: `${k.code} · ${k.areaName ?? k.area}`,
        status: k.status,
        badge: k.code,
      }));

    const findingResults: SearchResult[] = findings
      .filter((f) =>
        f.title.toLowerCase().includes(q) ||
        f.desc?.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((f) => ({
        type: "finding",
        id: f.id,
        title: f.title,
        subtitle: `Finding · ${f.severity ?? ""}`,
        status: f.status ?? "offen",
        badge: f.severity,
      }));

    return [...kpiResults, ...findingResults];
  })();

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      const r = results[selected];
      if (r.type === "kpi") { onOpenKpi(r.id); onClose(); }
    }
  }, [results, selected, onClose, onOpenKpi]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  useEffect(() => { setSelected(0); }, [query]);

  function handleSelect(r: SearchResult) {
    if (r.type === "kpi") { onOpenKpi(r.id); onClose(); }
  }

  const TYPE_ICON: Record<string, string> = {
    kpi: "📊",
    finding: "⚠️",
  };

  const recentKpis = query.trim().length === 0
    ? kpis.filter((k) => k.status === "finding" || k.status === "review").slice(0, 5)
    : [];

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-input-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="KPIs, Findings suchen… (↑↓ navigieren, Enter öffnen)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <kbd className="search-esc" onClick={onClose}>Esc</kbd>
        </div>

        <div className="search-results" ref={listRef}>
          {query.trim().length === 0 && recentKpis.length > 0 && (
            <>
              <div className="search-group-label">Aufmerksamkeit erforderlich</div>
              {recentKpis.map((k, i) => (
                <button
                  key={k.id}
                  className={`search-result-item${i === selected ? " selected" : ""}`}
                  onClick={() => handleSelect({ type: "kpi", id: k.id, title: k.title, subtitle: k.code, status: k.status })}
                  onMouseEnter={() => setSelected(i)}
                >
                  <span className="search-result-icon">📊</span>
                  <div className="search-result-body">
                    <div className="search-result-title">{k.title}</div>
                    <div className="search-result-sub">{k.code} · {k.areaName ?? k.area}</div>
                  </div>
                  <span className="search-result-status" style={{ color: STATUS_COLOR[k.status] }}>
                    {k.status}
                  </span>
                </button>
              ))}
            </>
          )}

          {query.trim().length > 0 && results.length === 0 && (
            <div className="search-empty">Keine Ergebnisse für „{query}"</div>
          )}

          {results.length > 0 && (
            <>
              {results.filter((r) => r.type === "kpi").length > 0 && (
                <div className="search-group-label">KPIs</div>
              )}
              {results
                .filter((r) => r.type === "kpi")
                .map((r, i) => (
                  <button
                    key={r.id}
                    className={`search-result-item${i === selected ? " selected" : ""}`}
                    onClick={() => handleSelect(r)}
                    onMouseEnter={() => setSelected(i)}
                  >
                    <span className="search-result-icon">{TYPE_ICON[r.type]}</span>
                    <div className="search-result-body">
                      <div className="search-result-title">{r.title}</div>
                      <div className="search-result-sub">{r.subtitle}</div>
                    </div>
                    <span className="search-result-status" style={{ color: STATUS_COLOR[r.status] }}>
                      {r.status}
                    </span>
                  </button>
                ))}
              {results.filter((r) => r.type === "finding").length > 0 && (
                <div className="search-group-label">Findings</div>
              )}
              {results
                .filter((r) => r.type === "finding")
                .map((r, i) => {
                  const idx = results.filter((x) => x.type === "kpi").length + i;
                  return (
                    <button
                      key={r.id}
                      className={`search-result-item${idx === selected ? " selected" : ""}`}
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <span className="search-result-icon">{TYPE_ICON[r.type]}</span>
                      <div className="search-result-body">
                        <div className="search-result-title">{r.title}</div>
                        <div className="search-result-sub">{r.subtitle}</div>
                      </div>
                      {r.badge && (
                        <span className="search-result-status" style={{ color: STATUS_COLOR[r.badge] }}>
                          {r.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </>
          )}
        </div>

        <div className="search-footer">
          <span><kbd>↑↓</kbd> navigieren</span>
          <span><kbd>Enter</kbd> öffnen</span>
          <span><kbd>Esc</kbd> schließen</span>
        </div>
      </div>
    </div>
  );
}
