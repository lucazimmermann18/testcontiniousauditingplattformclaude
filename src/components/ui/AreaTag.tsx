"use client";
import { AREAS } from "@/data/audit-data";

export function AreaTag({ areaId }: { areaId: string }) {
  const a = AREAS.find((x) => x.id === areaId);
  if (!a) return null;
  return (
    <span className="area-tag" style={{ "--at-color": a.color } as React.CSSProperties}>
      {a.short}
    </span>
  );
}
