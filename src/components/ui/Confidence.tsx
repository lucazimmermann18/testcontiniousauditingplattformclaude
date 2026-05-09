"use client";

export function Confidence({ value }: { value: number }) {
  if (!value) return <span className="conf conf-empty">—</span>;
  const pct = Math.round(value * 100);
  const tone = value > 0.9 ? "high" : value > 0.75 ? "mid" : "low";
  return (
    <span className={`conf conf-${tone}`}>
      <span className="conf-bar">
        <span className="conf-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="conf-val">{pct}%</span>
    </span>
  );
}
