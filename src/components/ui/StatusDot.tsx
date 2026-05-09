"use client";
import type { KpiStatus } from "@/types";

const STATUS_META: Record<KpiStatus, { label: string; dot: string; bg: string; fg: string; ring?: boolean }> = {
  ok:      { label: "Konform",     dot: "var(--ok)",    bg: "var(--ok-bg)",    fg: "var(--ok-fg)" },
  review:  { label: "In Prüfung", dot: "var(--warn)",  bg: "var(--warn-bg)",  fg: "var(--warn-fg)" },
  finding: { label: "Befund",     dot: "var(--alert)", bg: "var(--alert-bg)", fg: "var(--alert-fg)", ring: true },
  running: { label: "Agent läuft",dot: "var(--info)",  bg: "var(--info-bg)",  fg: "var(--info-fg)" },
  pending: { label: "Offen",      dot: "var(--muted)", bg: "var(--muted-bg)", fg: "var(--muted-fg)" },
};

export { STATUS_META };

export function StatusDot({ status, size = 8 }: { status: KpiStatus; size?: number }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className={`status-dot${status === "running" ? " status-dot-pulse" : ""}${m.ring ? " status-dot-ring" : ""}`}
      style={{ "--sd-color": m.dot, width: size, height: size } as React.CSSProperties}
    />
  );
}

export function StatusPill({ status }: { status: KpiStatus }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className="status-pill" style={{ background: m.bg, color: m.fg }}>
      <StatusDot status={status} />
      {m.label}
    </span>
  );
}
