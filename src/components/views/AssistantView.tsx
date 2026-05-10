"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Kpi, Finding } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const QUICK_PROMPTS = [
  { icon: "⚠️", label: "Höchste Risiken", prompt: "Welche KPIs haben das höchste Risiko und was sind die kritischsten offenen Findings?" },
  { icon: "📊", label: "Status-Übersicht", prompt: "Gib mir eine Executive Summary des aktuellen Audit-Status — was läuft gut, was braucht Aufmerksamkeit?" },
  { icon: "📝", label: "Prüfungsmitteilung", prompt: "Entwurf eine formale Prüfungsmitteilung für die drei wichtigsten offenen Findings an die Geschäftsführung." },
  { icon: "🔍", label: "Systemische Risiken", prompt: "Welche systemischen Risiken erkennst du basierend auf den aktuellen KPI-Daten und Findings?" },
  { icon: "📋", label: "Maßnahmenplan", prompt: "Welche Maßnahmen sollten priorisiert werden, um die kritischsten Findings zu schließen?" },
  { icon: "💬", label: "FIN-Bereich", prompt: "Analysiere den Finanz-Bereich: Welche FIN-KPIs fallen auf und warum?" },
];

function MarkdownText({ text }: { text: string }) {
  // Simple markdown rendering for bold, code, lists
  const lines = text.split("\n");
  return (
    <div className="assistant-msg-text">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="ast-h2">{line.slice(3)}</h3>;
        if (line.startsWith("### ")) return <h4 key={i} className="ast-h3">{line.slice(4)}</h4>;
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return <div key={i} className="ast-li">• {renderInline(line.slice(2))}</div>;
        }
        if (line.match(/^\d+\. /)) {
          return <div key={i} className="ast-li">{renderInline(line)}</div>;
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return <div key={i} className="ast-bold">{line.slice(2, -2)}</div>;
        }
        if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
        return <div key={i} className="ast-p">{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="ast-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function AssistantView({ kpis, findings }: { kpis: Kpi[]; findings: Finding[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Guten Tag! Ich bin Ihr **KI-Audit-Assistent** und kenne die aktuelle Datenlage der Plattform:\n\n- **${kpis.length} KPIs** überwacht (${kpis.filter((k) => k.status === "finding").length} Findings, ${kpis.filter((k) => k.status === "review").length} in Review)\n- **${findings.length} offene Findings** insgesamt\n\nWie kann ich Ihnen helfen? Sie können eine Frage stellen oder einen der Schnellzugriffe nutzen.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    const loadingMsg: Message = { id: Date.now() + "_ai", role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setLoading(true);

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok || !res.body) throw new Error("Keine Antwort vom Server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = JSON.parse(line.slice(6));
          if (chunk.type === "text") {
            fullContent += chunk.content;
            setMessages((prev) =>
              prev.map((m) => m.id === loadingMsg.id
                ? { ...m, content: fullContent, loading: false }
                : m
              )
            );
          } else if (chunk.type === "error") {
            setMessages((prev) =>
              prev.map((m) => m.id === loadingMsg.id
                ? { ...m, content: `Fehler: ${chunk.error}`, loading: false }
                : m
              )
            );
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => m.id === loadingMsg.id
          ? { ...m, content: `Verbindungsfehler: ${String(err)}`, loading: false }
          : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="assistant-view">
      {/* Header */}
      <div className="assistant-header">
        <div className="assistant-header-l">
          <div className="assistant-avatar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 10h.01M12 10h.01M16 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="assistant-title">KI-Audit-Assistent</div>
            <div className="assistant-sub">
              Kennt {kpis.length} KPIs · {findings.length} offene Findings · Live-Datenzugang
            </div>
          </div>
        </div>
        <div className="assistant-header-r">
          <span className="assistant-status-dot" />
          <span className="assistant-status-label">Online</span>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="assistant-quick-prompts">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            className="ast-quick-btn"
            onClick={() => send(p.prompt)}
            disabled={loading}
          >
            <span>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="assistant-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`assistant-msg assistant-msg-${msg.role}`}
          >
            {msg.role === "assistant" && (
              <div className="assistant-msg-avatar">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 10h.01M12 10h.01M15 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            <div className="assistant-msg-bubble">
              {msg.loading ? (
                <div className="assistant-typing">
                  <span /><span /><span />
                </div>
              ) : (
                <MarkdownText text={msg.content} />
              )}
            </div>
            {msg.role === "user" && (
              <div className="assistant-msg-avatar assistant-msg-user-avatar">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="assistant-input-wrap">
        <textarea
          ref={inputRef}
          className="assistant-input"
          placeholder="Frage stellen oder Aufgabe beschreiben… (Enter zum Senden, Shift+Enter für neue Zeile)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
          disabled={loading}
        />
        <button
          className="assistant-send-btn"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          aria-label="Senden"
        >
          {loading ? (
            <div className="assistant-send-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
