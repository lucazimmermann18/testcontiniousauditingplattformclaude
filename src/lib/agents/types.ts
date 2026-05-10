export interface AgentResult {
  status: "ok" | "review" | "finding";
  confidence: number;
  summary: string;
  details: string;
  anomalies: Anomaly[];
  recommendations: string[];
  // Multi-stage enrichment
  stages?: StageResult[];
  historicalTrend?: string;
  crossKpiInsights?: string;
}

export interface Anomaly {
  severity: "hoch" | "mittel" | "niedrig";
  title: string;
  description: string;
}

export interface StageResult {
  stage: "scout" | "analyst" | "cross_checker" | "risk_rater";
  label: string;
  agentName: string;
  summary: string;
  keyFindings: string[];
}

export interface AgentContext {
  kpiCode: string;
  kpiTitle: string;
  kpiDesc: string;
  agentName: string;
  area: string;
  areaCode: string;
  currentValue: string;
  delta: string;
  trend: number[];
  mockDataDescription: string;
  mockData: unknown;
  dataSourceLabel?: string;
}

export interface AreaSpecialist {
  role: string;
  expertise: string;
  frameworks: string;
  redFlags: string;
}

export interface StreamChunk {
  type: "stage_start" | "stage_done" | "text" | "done" | "error";
  stage?: StageResult["stage"];
  label?: string;
  agentName?: string;
  stageSummary?: string;
  content?: string;
  result?: AgentResult;
  error?: string;
}
