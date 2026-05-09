import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { z } from "zod";

const Schema = z.object({
  current: z.string().min(1),
  next: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: session.user.id! },
    select: { password: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await verifyPassword(parsed.data.current, user.password);
  if (!valid) return NextResponse.json({ error: "Aktuelles Passwort falsch." }, { status: 400 });

  const hashed = await hashPassword(parsed.data.next);
  await db.user.update({ where: { id: session.user.id! }, data: { password: hashed } });
  return NextResponse.json({ ok: true });
}
