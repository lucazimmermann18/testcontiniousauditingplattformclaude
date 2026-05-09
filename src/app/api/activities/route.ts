import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  const activities = await db.activity.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      kpi: { select: { id: true, code: true } },
    },
  });

  const now = Date.now();

  const mapped = activities.map((a) => {
    const diffMs = now - a.createdAt.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);
    let time: string;
    if (diffMin < 2) time = "gerade eben";
    else if (diffMin < 60) time = `vor ${diffMin} Min.`;
    else if (diffH < 24) time = `vor ${diffH} Std.`;
    else time = `vor ${diffD} Tag${diffD !== 1 ? "en" : ""}`;

    return {
      id: a.id,
      type: a.type,
      kpiCode: a.kpi?.code ?? "",
      kpiId: a.kpi?.id ?? "",
      user: a.user?.name ?? "System",
      avatar: a.user?.avatar ?? "SY",
      time,
      msg: a.message,
    };
  });

  return NextResponse.json(mapped);
}
