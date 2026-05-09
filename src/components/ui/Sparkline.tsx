"use client";
import type { KpiStatus } from "@/types";

export function Sparkline({
  data,
  status,
  height = 28,
  width = 96,
}: {
  data: number[];
  status: KpiStatus;
  height?: number;
  width?: number;
}) {
  if (!data || data.length === 0) return null;
  const nonZero = data.filter((v) => v !== 0);
  if (nonZero.length === 0) return null;

  const max = Math.max(...data, 0.0001);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = width, h = height;
  const step = data.length > 1 ? w / (data.length - 1) : 0;
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const lastX = data.length > 1 ? (data.length - 1) * step : w / 2;
  const lastY = h - ((data[data.length - 1] - min) / range) * (h - 4) - 2;

  const stroke =
    status === "finding" ? "var(--alert)" :
    status === "review"  ? "var(--warn)"  :
    status === "running" ? "var(--info)"  :
    "var(--brand)";

  return (
    <svg width={w} height={h} className="sparkline" viewBox={`0 0 ${w} ${h}`}>
      {data.length > 1 && (
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      )}
      <circle cx={lastX} cy={lastY} r="2.5" fill={stroke} />
    </svg>
  );
}
