import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Demo fallback data (used when DB is unavailable) ─────────────────────────

const DEMO_PROJECTS_ADMIN = [
  { id: "proj_demo_01", title: "Demo Project Alpha", description: "Sample project for preview", status: "DRAFT", userId: "user_admin_01", createdAt: new Date("2026-01-15T10:00:00Z"), updatedAt: new Date("2026-01-15T10:00:00Z") },
  { id: "proj_demo_02", title: "Demo Project Beta", description: "Another sample", status: "IN_PROGRESS", userId: "user_admin_01", createdAt: new Date("2026-02-01T10:00:00Z"), updatedAt: new Date("2026-02-01T10:00:00Z") },
];

const DEMO_PROJECTS_USER = [
  { id: "proj_demo_01", title: "Demo Project Alpha", description: "Sample project for preview", status: "DRAFT", userId: "user_admin_01", createdAt: new Date("2026-01-15T10:00:00Z"), updatedAt: new Date("2026-01-15T10:00:00Z") },
];

// GET /api/projects
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── DB path ──────────────────────────────────────────────────────────────────
  if (await isDatabaseAvailable()) {
    try {
      const projects =
        user.role === "ADMIN"
          ? await prisma.project.findMany({ orderBy: { createdAt: "desc" } })
          : await prisma.project.findMany({
              where: { userId: user.id },
              orderBy: { createdAt: "desc" },
            });
      return NextResponse.json({ projects }, { status: 200 });
    } catch (err) {
      console.error("[GET /api/projects] DB query failed:", err instanceof Error ? err.message : String(err));
      // Fall through to demo fallback below
    }
  }

  // ── Demo fallback (DB unavailable) ─────────────────────────────────────────
  console.warn("[GET /api/projects] DB unavailable — returning demo dataset");
  const projects = user.role === "ADMIN" ? DEMO_PROJECTS_ADMIN : DEMO_PROJECTS_USER;
  return NextResponse.json({ projects, _demo: true }, { status: 200 });
}

// POST /api/projects
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "USER") {
    return NextResponse.json(
      { error: "Forbidden: USER role cannot create projects." },
      { status: 403 }
    );
  }

  // DB must be available for write operations
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database unavailable. Cannot create project in preview mode." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { title, description } = body as {
      title?: string;
      description?: string;
    };

    if (!title) {
      return NextResponse.json(
        { error: "title is required." },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description ?? null,
        status: "DRAFT",
        userId: user.id,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }
}