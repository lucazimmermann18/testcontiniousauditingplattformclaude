import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { streamAgent } from "@/lib/agents/runner";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ kpiId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kpiId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamAgent(kpiId)) {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
          if (chunk.type === "done" || chunk.type === "error") break;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
      } finally {
        controller.close();
      }
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
