import { db } from "@/lib/db";
import { createHmac } from "crypto";

export async function triggerWebhooks(event: string, payload: Record<string, unknown>) {
  const hooks = await db.webhookConfig.findMany({ where: { active: true } });

  await Promise.allSettled(
    hooks
      .filter((h) => {
        try { return (JSON.parse(h.events) as string[]).includes(event); }
        catch { return false; }
      })
      .map(async (hook) => {
        const body = JSON.stringify({ event, payload, ts: Date.now() });
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (hook.secret) {
          headers["X-Audit-Signature"] = createHmac("sha256", hook.secret).update(body).digest("hex");
        }
        await fetch(hook.url, { method: "POST", headers, body, signal: AbortSignal.timeout(10000) });
      })
  );
}
