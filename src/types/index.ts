export type KpiStatus = "ok" | "review" | "finding" | "running" | "pending";

export interface Area {
  id: string;
  name: string;
  short: string;
  color: string;
}

export interface Kpi {
  id: string;
  area: string;
  code: string;
  title: string;
  desc: string;
  risk: number;
  status: KpiStatus;
  confidence: number;
  value: string;
  delta: string;
  owner: string;
  reviewer: string;
  lastRun: string;
  agent: string;
  trend: number[];
}

export interface Finding {
  id: string;
  kpi: string;
  title: string;
  severity: "hoch" | "mittel" | "niedrig";
  status: "offen" | "in_bearbeitung" | "geschlossen";
  owner: string;
  due: string;
  opened: string;
  desc: string;
}

export interface Activity {
  id: string;
  type: "finding" | "approved" | "rerun" | "comment" | "agent";
  kpiCode: string;
  kpiId: string;
  user: string;
  avatar: string;
  time: string;
  msg: string;
}
