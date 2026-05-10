import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const PatchSchema = z.object({
  name:   z.string().min(1).max(100).optional(),
  url:    z.string().url().optional(),
  secret: z.string().nullable().optional(),
  events: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.name   !== undefined) data.name   = parsed.data.name;
  if (parsed.data.url    !== undefined) data.url    = parsed.data.url;
  if (parsed.data.secret !== undefined) data.secret = parsed.data.secret;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.events !== undefined) data.events = JSON.stringify(parsed.data.events);

  const hook = await db.webhookConfig.update({ where: { id }, data });
  return NextResponse.json(hook);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.webhookConfig.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
