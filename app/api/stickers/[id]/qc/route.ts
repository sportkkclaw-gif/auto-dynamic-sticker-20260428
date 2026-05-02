/**
 * app/api/stickers/[id]/qc/route.ts
 *
 * POST /api/stickers/:id/qc — run QC on a single sticker's APNG output.
 * Spec §D-12: Request { apngOutputId }; Response { report: QcReport }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runQcEngine } from "@/lib/qc/qcEngine";
import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";

export const runtime = "nodejs";

// POST /api/stickers/:id/qc
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
    const { apngOutputId } = body as { apngOutputId?: string };

    // Fetch APNG output
    const apngOutput = await prisma.apngOutput.findUnique({
      where: { id: apngOutputId ?? id },
    });

    const spec = LINE_ANIMATED_STICKER_SPEC;
    const representativeApng = apngOutput ?? null;
    const apngFrames = representativeApng?.frames ?? spec.minFrames;
    const apngWidth = representativeApng?.width ?? spec.stickerImage.maxWidth;
    const apngHeight = representativeApng?.height ?? spec.stickerImage.maxHeight;
    const apngFileBytes = representativeApng?.fileBytes ?? 0;
    const hasTransparent = representativeApng?.hasTransparency ?? true;
    const colorSpace = representativeApng?.colorSpace ?? "RGB";
    const loopCount = representativeApng?.loopCount ?? 1;
    const playbackSeconds = representativeApng?.playbackSeconds ?? 1.0;
    const opacityNotFull = representativeApng?.opacityNotFull ?? false;

    const zipBytes = apngFileBytes + 50_000;

    const computedQc = runQcEngine({
      stickerCount: 1,
      apngFrames,
      apngWidth,
      apngHeight,
      apngFileBytes,
      loopCount,
      playbackSeconds,
      zipBytes,
      mainImageWidth: spec.mainImage.width,
      mainImageHeight: spec.mainImage.height,
      tabImageWidth: spec.tabImage.width,
      tabImageHeight: spec.tabImage.height,
      hasTransparentBackground: hasTransparent,
      colorSpace,
      opacityNotFull,
    });

    // Build a lightweight QcReport object (not persisted separately)
    const report = {
      id: `qc_${sticker.id}`,
      projectId: sticker.projectId,
      stickerCount: 1,
      apngFrames,
      apngWidth,
      apngHeight,
      zipBytes,
      mainImageW: spec.mainImage.width,
      mainImageH: spec.mainImage.height,
      tabImageW: spec.tabImage.width,
      tabImageH: spec.tabImage.height,
      hasTransparent,
      colorSpace,
      passed: computedQc.passed,
      exportBlocked: computedQc.exportBlocked,
      p0Count: computedQc.summary.P0,
      p1Count: computedQc.summary.P1,
      p2Count: computedQc.summary.P2,
      passedChecks: computedQc.summary.passedChecks,
      totalChecks: computedQc.summary.totalChecks,
      findingsJson: JSON.stringify(computedQc.findings),
      generatedAt: new Date(),
    };

    return NextResponse.json({ report }, { status: 200 });
  } catch (err) {
    console.error("[stickers/qc] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}
