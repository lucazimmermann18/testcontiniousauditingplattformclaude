import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TOTP, Secret } from "otpauth";
import { z } from "zod";

const Schema = z.object({ code: z.string().length(6) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ungültiger Code" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: session.user.id! } });
  if (!user?.totpSecret) return NextResponse.json({ error: "2FA nicht eingerichtet" }, { status: 400 });

  const totp = new TOTP({
    issuer: "Continuum Audit",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(user.totpSecret),
  });

  const delta = totp.validate({ token: parsed.data.code, window: 1 });
  if (delta === null) return NextResponse.json({ error: "Code ungültig oder abgelaufen" }, { status: 400 });

  await db.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  return NextResponse.json({ ok: true });
}
