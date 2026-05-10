import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: "Continuum Audit",
    label: session.user.email ?? session.user.id,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  await db.user.update({
    where: { id: session.user.id! },
    data: { totpSecret: secret.base32 },
  });

  return NextResponse.json({ secret: secret.base32, qr: qrDataUrl });
}
