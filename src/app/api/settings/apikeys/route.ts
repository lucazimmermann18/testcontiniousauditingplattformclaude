import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { encrypt, decrypt, maskKey } from "@/lib/encrypt";
import { z } from "zod";

function requireAdmin(role: string | undefined) {
  return role === "admin" || role === "head_of_audit";
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin((session.user as any).role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const keys = await db.apiKey.findMany({ orderBy: { provider: "asc" } });
    const masked = keys.map((k) => {
      // Decrypt, show real prefix mask — but fall back gracefully
      let displayMask = "sk-••••••••";
      try {
        const plain = decrypt(k.encryptedKey);
        displayMask = maskKey(plain);
      } catch {
        displayMask = maskKey(k.encryptedKey.slice(0, 12));
      }
      return {
        id: k.id,
        provider: k.provider,
        model: k.model,
        isActive: k.isActive,
        maskedKey: displayMask,
        updatedAt: k.updatedAt,
      };
    });
    return NextResponse.json(masked);
  } catch (err) {
    console.error("[GET /api/settings/apikeys]", err);
    return NextResponse.json({ error: "Interner Fehler" }, { status: 500 });
  }
}

const PostSchema = z.object({
  provider: z.enum(["anthropic", "openai", "deepseek", "openrouter"]),
  apiKey: z.string().min(10),
  model: z.string().min(1),
  setActive: z.boolean().default(false),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin((session.user as any).role)) return NextResponse.json({ error: "Forbidden – Admin- oder Head-of-Audit-Rolle erforderlich." }, { status: 403 });

    const body = await req.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const { provider, apiKey, model, setActive } = parsed.data;
    const encryptedKey = encrypt(apiKey);

    if (setActive) {
      await db.apiKey.updateMany({ data: { isActive: false } });
    }

    const record = await db.apiKey.upsert({
      where: { provider },
      create: { provider, encryptedKey, model, isActive: setActive },
      update: { encryptedKey, model, isActive: setActive },
    });

    return NextResponse.json({
      id: record.id,
      provider: record.provider,
      model: record.model,
      isActive: record.isActive,
    });
  } catch (err) {
    console.error("[POST /api/settings/apikeys]", err);
    const message = err instanceof Error ? err.message : "Interner Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
