"use client";

function riskColor(r: number): string {
  if (r >= 5) return "var(--alert)";
  if (r >= 4) return "var(--warn)";
  if (r >= 3) return "var(--accent)";
  return "var(--muted-fg)";
}

export { riskColor };

export function RiskBars({ risk }: { risk: number }) {
  return (
    <span className="risk-bars" title={`Inhärentes Risiko ${risk}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`rb${i <= risk ? " rb-on" : ""}`}
          style={i <= risk ? { background: riskColor(risk) } : undefined}
        />
      ))}
    </span>
  );
}
