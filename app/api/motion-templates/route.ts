/**
 * app/api/motion-templates/route.ts
 *
 * Motion template API — list (GET) and create/update (POST/PUT) templates.
 * POST/PUT require admin:template:write permission (ADMIN only).
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/motion-templates?teamId=xxx
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teamId = request.nextUrl.searchParams.get("teamId");
  if (!teamId) return NextResponse.json({ error: "teamId required" }, { status: 400 });

  // Verify team membership
  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (!membership && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await prisma.motionTemplate.findMany({
    where: { teamId, enabled: true },
    orderBy: { code: "asc" },
  });

  // Deserialize definition JSON
  const result = templates.map((t) => ({
    ...t,
    definition: JSON.parse(t.definition as string),
  }));

  return NextResponse.json({ templates: result }, { status: 200 });
}

// POST /api/motion-templates — create a new motion template (ADMIN only)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: admin role required to create motion templates." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { teamId, code, name, description, definition, riskLevel } = body as {
      teamId?: string;
      code?: string;
      name?: string;
      description?: string;
      definition?: Record<string, unknown>;
      riskLevel?: string;
    };

    if (!teamId || !code || !name || !definition) {
      return NextResponse.json(
        { error: "teamId, code, name, and definition are required." },
        { status: 400 }
      );
    }

    // Validate definition structure
    const requiredFields = ["targets", "keyframes", "parameters"];
    for (const field of requiredFields) {
      if (!definition[field as keyof typeof definition]) {
        return NextResponse.json(
          { error: `definition.${field} is required.` },
          { status: 400 }
        );
      }
    }

    const template = await prisma.motionTemplate.create({
      data: {
        teamId,
        code,
        name,
        description: description ?? null,
        definition: JSON.stringify(definition),
        riskLevel: riskLevel ?? "stable",
        enabled: true,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    console.error("[motion-templates] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/motion-templates — update an existing template (ADMIN only)
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: admin role required to update motion templates." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { code, enabled, name, description, definition, riskLevel } = body as {
      code?: string;
      enabled?: boolean;
      name?: string;
      description?: string;
      definition?: Record<string, unknown>;
      riskLevel?: string;
    };

    if (!code) return NextResponse.json({ error: "code is required to identify the template." }, { status: 400 });

    const teamId = request.nextUrl.searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ error: "teamId query param required for updates." }, { status: 400 });

    const updateData: Record<string, unknown> = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (riskLevel !== undefined) updateData.riskLevel = riskLevel;
    if (definition !== undefined) updateData.definition = JSON.stringify(definition);

    const template = await prisma.motionTemplate.update({
      where: { teamId_code: { teamId, code } },
      data: updateData,
    });

    return NextResponse.json({ template }, { status: 200 });
  } catch (err) {
    console.error("[motion-templates] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
