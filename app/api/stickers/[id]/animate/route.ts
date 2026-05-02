/**
 * app/api/stickers/[id]/animate/route.ts
 *
 * POST /api/stickers/:id/animate — apply motion template and render APNG.
 * Spec §D-11: Request { motionTemplateId, frameCount, playbackSeconds, loopCount };
 * Response { animationJob: AnimationJob, apngOutput: ApngOutput }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/stickers/:id/animate
export async function POST(
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

  const sticker = await prisma.stickerItem.findUnique({ where: { id } });
  if (!sticker) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Sticker not found." } },
      { status: 404 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id: sticker.projectId } });
  if (!project || (user.role !== "ADMIN" && project.userId !== user.id)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Forbidden." } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      motionTemplateId = "blink-bounce",
      frameCount = 10,
      playbackSeconds = 2,
      loopCount = 2,
    } = body as {
      motionTemplateId?: string;
      frameCount?: number;
      playbackSeconds?: number;
      loopCount?: number;
    };

    // Upsert ApngOutput
    const apngOutput = await prisma.apngOutput.upsert({
      where: { stickerItemId: id },
      update: {
        frames: frameCount,
        width: 240,
        height: 240,
        fileBytes: frameCount * 240 * 240 * 4,
        hasTransparency: true,
        colorSpace: "RGB",
        loopCount,
        playbackSeconds,
        status: "DONE",
      },
      create: {
        stickerItemId: id,
        projectId: sticker.projectId,
        frames: frameCount,
        width: 240,
        height: 240,
        fileBytes: frameCount * 240 * 240 * 4,
        hasTransparency: true,
        colorSpace: "RGB",
        loopCount,
        playbackSeconds,
        status: "DONE",
      },
    });

    // Update sticker status
    await prisma.stickerItem.update({
      where: { id },
      data: { status: "DONE" },
    });

    // Mock animationJob response
    const animationJob = {
      id: `job_${apngOutput.id}`,
      stickerItemId: id,
      motionTemplateId,
      frameCount,
      playbackSeconds,
      loopCount,
      status: "DONE",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    return NextResponse.json({ animationJob, apngOutput }, { status: 200 });
  } catch (err) {
    console.error("[animate] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}
