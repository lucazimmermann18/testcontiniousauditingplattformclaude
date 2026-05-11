import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamAgent } from "@/lib/agents/runner";

const AGENT_TIMEOUT_MS = 5 * 60 * 1_000; // 5-minute hard limit

export async function POST(
  req: Request,
  { params }: { params: Promise<{ kpiId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kpiId } = await params;

  const encoder = new TextEncoder();
  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function close() {
        if (!streamClosed) { streamClosed = true; controller.close(); }
      }

      // B-004: hard timeout — close stream after 5 minutes
      const timeoutId = setTimeout(() => {
        if (!streamClosed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: "Agent-Timeout (5 min)" })}\n\n`));
          close();
        }
      }, AGENT_TIMEOUT_MS);

      try {
        for await (const chunk of streamAgent(kpiId)) {
          // B-004: stop immediately on client disconnect
          if (req.signal.aborted || streamClosed) break;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          if (chunk.type === "done" || chunk.type === "error") break;
        }
      } catch (err) {
        if (!streamClosed) {
          const msg = err instanceof Error ? err.message : String(err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
        }
      } finally {
        clearTimeout(timeoutId);
        close();
      }
    },
    cancel() {
      streamClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kpiId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kpiId } = await params;
  const { getLastAuditRun } = await import("@/lib/agents/runner");
  const run = await getLastAuditRun(kpiId);
  return NextResponse.json(run);
}
