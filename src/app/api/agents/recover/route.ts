import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { recoverStuckKpis } from "@/lib/agents/runner";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recovered = await recoverStuckKpis();
  return NextResponse.json({ ok: true, recovered });
}
