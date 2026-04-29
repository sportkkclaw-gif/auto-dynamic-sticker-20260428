import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects =
    user.role === "ADMIN"
      ? await prisma.project.findMany({ orderBy: { createdAt: "desc" } })
      : await prisma.project.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        });

  return NextResponse.json({ projects }, { status: 200 });
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
