import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { notifyMentions } from "@/lib/notifications";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comments = await db.comment.findMany({
    where: { kpiId: id },
    include: { author: { select: { id: true, name: true, avatar: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

const PostSchema = z.object({ text: z.string().min(1).max(2000) });

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const comment = await db.comment.create({
    data: { kpiId: id, authorId: session.user.id!, text: parsed.data.text },
    include: { author: { select: { id: true, name: true, avatar: true, role: true } } },
  });

  await db.activity.create({
    data: { type: "comment", kpiId: id, userId: session.user.id!, message: `Kommentar hinzugefügt` },
  });

  await notifyMentions(parsed.data.text, session.user.id!, id);

  return NextResponse.json(comment, { status: 201 });
}
