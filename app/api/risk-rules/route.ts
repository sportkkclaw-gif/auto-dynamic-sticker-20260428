/**
 * app/api/risk-rules/route.ts
 *
 * Risk rules API — list rules (all) and update (admin only).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/risk-rules?teamId=xxx
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  const rules = await prisma.riskRule.findMany({
    where: { teamId, enabled: true },
    orderBy: { code: "asc" },
  });

  return NextResponse.json({ rules }, { status: 200 });
}

// PUT /api/risk-rules — admin can toggle or update a rule
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: admin only" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { code, enabled, message, detail } = body as {
      code?: string;
      enabled?: boolean;
      message?: string;
      detail?: string;
    };

    if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

    const rule = await prisma.riskRule.update({
      where: { code },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(message !== undefined && { message }),
        ...(detail !== undefined && { detail }),
      },
    });

    return NextResponse.json({ rule }, { status: 200 });
  } catch (err) {
    console.error("[risk-rules] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
