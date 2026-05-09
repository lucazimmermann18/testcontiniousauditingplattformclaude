export interface AgentResult {
  status: "ok" | "review" | "finding";
  confidence: number;          // 0-1
  summary: string;             // 1-2 sentence executive summary
  details: string;             // full analysis markdown
  anomalies: Anomaly[];
  recommendations: string[];
}

export interface Anomaly {
  severity: "hoch" | "mittel" | "niedrig";
  title: string;
  description: string;
}

export interface AgentContext {
  kpiCode: string;
  kpiTitle: string;
  kpiDesc: string;
  agentName: string;
  area: string;
  currentValue: string;
  delta: string;
  trend: number[];
  mockDataDescription: string;
  mockData: unknown;
  dataSourceLabel?: string;
}
