/**
 * app/api/audit/route.ts
 *
 * Audit log API — admin read-only access.
 * Never log sensitive data (tokens, passwords, full CC numbers).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ─── Demo fallback data (used when DB is unavailable) ─────────────────────────

const DEMO_AUDIT_LOGS = [
  { id: "log_demo_01", action: "LOGIN", userId: "user_admin_01", teamId: null, resource: "auth", detail: "Demo login event", metadata: null, ipAddress: "127.0.0.1", userAgent: "DemoAgent/1.0", createdAt: new Date("2026-01-01T00:00:00Z") },
  { id: "log_demo_02", action: "PROJECT_CREATE", userId: "user_admin_01", teamId: null, resource: "projects", detail: "Demo project created", metadata: null, ipAddress: "127.0.0.1", userAgent: "DemoAgent/1.0", createdAt: new Date("2026-01-15T00:00:00Z") },
];

// GET /api/audit — list audit logs (admin only)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only ADMIN can read audit logs
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: admin role required to read audit logs." },
      { status: 403 }
    );
  }

  const teamId = request.nextUrl.searchParams.get("teamId");
  const action = request.nextUrl.searchParams.get("action");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "100"), 500);
  const offset = parseInt(request.nextUrl.searchParams.get("offset") ?? "0");

  const where: Record<string, unknown> = {};
  if (teamId) where.teamId = teamId;
  if (action) where.action = action;

  // ── DB path ──────────────────────────────────────────────────────────────────
  if (await isDatabaseAvailable()) {
    try {
      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
          include: { user: { select: { id: true, email: true, name: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);
      return NextResponse.json({ logs, total, limit, offset }, { status: 200 });
    } catch (err) {
      console.error("[GET /api/audit] DB query failed:", err instanceof Error ? err.message : String(err));
    }
  }

  // ── Demo fallback (DB unavailable) ─────────────────────────────────────────
  console.warn("[GET /api/audit] DB unavailable — returning demo data");
  return NextResponse.json(
    { logs: DEMO_AUDIT_LOGS, total: DEMO_AUDIT_LOGS.length, limit, offset, _demo: true },
    { status: 200 }
  );
}

// POST /api/audit — create audit log entry (internal use by other API routes)
export async function POST(request: NextRequest) {
  // Internal endpoint — used by other API routes to record actions.
  // Direct external calls should go through the app's own action APIs.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // DB required for write operations — return 503 if unavailable
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database unavailable. Cannot record audit logs in preview mode." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { action, resource, detail, metadata } = body as {
      action?: string;
      resource?: string;
      detail?: string;
      metadata?: Record<string, unknown>;
    };

    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

    // Scrub sensitive data from metadata
    const scrubbed = metadata ? scrubSensitiveData(metadata) : undefined;

    // Get user's team
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { teamMemberships: true },
    });
    const teamId = dbUser?.teamMemberships[0]?.teamId ?? null;

    const log = await prisma.auditLog.create({
      data: {
        userId: user.id,
        teamId,
        action: action as never,
        resource: resource ?? null,
        detail: detail ?? null,
        metadata: scrubbed ? JSON.stringify(scrubbed) : null,
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });

    return NextResponse.json({ log }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/audit] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Remove sensitive fields from metadata before logging */
function scrubSensitiveData(meta: Record<string, unknown>): Record<string, unknown> {
  const scrubbed = { ...meta };
  const sensitiveKeys = ["token", "password", "secret", "apikey", "creditCard", "ssn"];
  for (const key of Object.keys(scrubbed)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      scrubbed[key] = "[REDACTED]";
    }
  }
  return scrubbed;
}
