/**
 * app/api/stickers/[id]/keyframes/generate/route.ts
 *
 * POST /api/stickers/:id/keyframes/generate — generate keyframes for a sticker.
 * Spec §D-10: Request { briefId, quality };
 * Response { frames: GeneratedFrame[], provider: "mock"|"ai" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MockKeyframeGenerationProvider } from "@/lib/providers";

export const runtime = "nodejs";

// Mock keyframe generator per SPEC §E
function mockKeyframeGenerator(count: number, _quality: string) {
  const frames = [];
  for (let i = 0; i < count; i++) {
    frames.push({
      frameIndex: i,
      transform: {
        translateX: Math.sin(i * 0.5) * 10,
        translateY: Math.cos(i * 0.5) * 5,
        rotate: i * 3,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      },
    });
  }
  return frames;
}

// POST /api/stickers/:id/keyframes/generate
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
    const { briefId, quality = "stable" } = body as { briefId?: string; quality?: string };

    // Use mock provider per SPEC §E
    const provider = new MockKeyframeGenerationProvider();
    const frameCount = 8;
    const result = await provider.generate(frameCount, "blink-bounce");

    return NextResponse.json(
      { frames: result.frameDataList, provider: "mock" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[keyframes/generate] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}
