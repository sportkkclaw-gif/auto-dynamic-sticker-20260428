/**
 * app/api/risk-rules/route.ts
 *
 * Risk rules API — list rules (all) and update (admin only).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Demo fallback data (used when DB is unavailable) ─────────────────────────

const DEMO_RULES = [
  { id: "rule_demo_01", teamId: "team_demo", code: "NO_TEXT", message: "Stickers must not contain text.", detail: "All text layers must be rasterized before export.", enabled: true, createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") },
  { id: "rule_demo_02", teamId: "team_demo", code: "TRANSPARENCY", message: "Transparency is required.", detail: "Stickers must have at least one transparent pixel.", enabled: true, createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") },
  { id: "rule_demo_03", teamId: "team_demo", code: "MAX_SIZE", message: "File size must not exceed 500 KB.", detail: "Each APNG must be under 500 KB.", enabled: true, createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") },
];

export const runtime = "nodejs";

// GET /api/risk-rules?teamId=xxx
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  if (await isDatabaseAvailable()) {
    try {
      const rules = await prisma.riskRule.findMany({
        where: { teamId, enabled: true },
        orderBy: { code: "asc" },
      });

      return NextResponse.json({ rules }, { status: 200 });
    } catch (err) {
      console.error("[GET /api/risk-rules] DB error:", err instanceof Error ? err.message : String(err));
      // fall through to demo fallback
    }
  }

  // ── Demo fallback (DB unavailable) ─────────────────────────────────────────
  console.warn("[GET /api/risk-rules] DB unavailable — returning demo rules");
  return NextResponse.json({ rules: DEMO_RULES, _demo: true }, { status: 200 });
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

  // DB must be available for write operations
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database unavailable. Cannot update risk rules in preview mode." },
      { status: 503 }
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
