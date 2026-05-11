import { EventEmitter } from "events";

// Module-level singleton, survives HMR in dev via global
const g = global as typeof globalThis & { __appEvents?: EventEmitter };
export const appEvents: EventEmitter = g.__appEvents ?? (g.__appEvents = new EventEmitter());
appEvents.setMaxListeners(500);

export type AppEvent =
  | { type: "agent_done";   kpiId: string; kpiCode: string; status: string; summary: string }
  | { type: "finding_new";  kpiId: string; kpiCode: string; title: string; severity: string }
  | { type: "approval_act"; kpiId: string; kpiCode: string; action: string; actor: string }
  | { type: "task_done";    taskId: string; title: string }
  | { type: "ping" };

export function emit(event: AppEvent) {
  appEvents.emit("event", event);
}
