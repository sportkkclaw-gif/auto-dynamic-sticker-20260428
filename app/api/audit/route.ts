/**
 * app/api/audit/route.ts
 *
 * Audit log API — admin read-only access.
 * Never log sensitive data (tokens, passwords, full CC numbers).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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
}

// POST /api/audit — create audit log entry (internal use by other API routes)
export async function POST(request: NextRequest) {
  // Internal endpoint — used by other API routes to record actions.
  // Direct external calls should go through the app's own action APIs.
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    console.error("[audit] error:", err);
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
