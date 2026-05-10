import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hooks = await db.webhookConfig.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(hooks);
}

const CreateSchema = z.object({
  name:   z.string().min(1).max(100),
  url:    z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.string()).default(["finding_created"]),
  active: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const hook = await db.webhookConfig.create({
    data: {
      name:   parsed.data.name,
      url:    parsed.data.url,
      secret: parsed.data.secret ?? null,
      events: JSON.stringify(parsed.data.events),
      active: parsed.data.active,
    },
  });
  return NextResponse.json(hook, { status: 201 });
}
