import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

function requireAdmin(role: string) {
  return role === "admin" || role === "head_of_audit";
}

const PatchSchema = z.object({
  role: z.enum(["admin", "head_of_audit", "owner", "reviewer"]).optional(),
  active: z.boolean().optional(),
  name: z.string().min(2).max(100).optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!requireAdmin((session.user as any).role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id)
    return NextResponse.json({ error: "Eigenen Account hier nicht ändern" }, { status: 400 });

  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await db.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true },
  });
  return NextResponse.json(user);
}
