import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

function requireAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const role = (session.user as any).role as string;

  const users = await db.user.findMany({
    where: all && requireAdmin(role) ? {} : { active: true },
    select: { id: true, name: true, avatar: true, role: true, email: true, active: true, createdAt: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

const CreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "head_of_audit", "owner", "reviewer"]).default("reviewer"),
  avatar: z.string().max(4).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "E-Mail bereits vergeben." }, { status: 409 });

  const hashed = await hashPassword(parsed.data.password);
  const avatar = parsed.data.avatar ??
    parsed.data.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const user = await db.user.create({
    data: { ...parsed.data, password: hashed, avatar },
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true },
  });
  return NextResponse.json(user, { status: 201 });
}
