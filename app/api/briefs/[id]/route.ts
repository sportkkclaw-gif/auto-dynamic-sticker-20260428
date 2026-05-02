/**
 * app/api/briefs/[id]/route.ts
 *
 * PUT /api/briefs/:id — update a sticker brief (emotion/phrase/motion).
 * Spec §D-8: Request { emotion?, phrase?, motion? }; Response { brief: StickerBrief }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// PUT /api/briefs/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable. Please try again later." } },
      { status: 503 }
    );
  }

  const { id } = await params;

  const existing = await prisma.stickerBrief.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Brief not found." } },
      { status: 404 }
    );
  }

  // Check project ownership
  const project = await prisma.project.findUnique({ where: { id: existing.projectId } });
  if (!project || (user.role !== "ADMIN" && project.userId !== user.id)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Forbidden." } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { emotion, phrase, motion } = body as {
      emotion?: string;
      phrase?: string;
      motion?: string;
    };

    const updated = await prisma.stickerBrief.update({
      where: { id },
      data: {
        ...(emotion !== undefined && { briefText: emotion }),
        ...(phrase !== undefined && { promptHash: phrase }),
        ...(motion !== undefined && { metadata: motion }),
      },
    });

    return NextResponse.json({ brief: updated }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid JSON body." } },
      { status: 400 }
    );
  }
}
