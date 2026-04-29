/**
 * app/api/qc/route.ts
 *
 * POST /api/qc — compute QC report for a project and persist to DB.
 * Reads sticker items + APNG outputs from DB; runs deterministic QC.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runQcEngine } from "@/lib/qc/qcEngine";
import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";

export const runtime = "nodejs";

// POST /api/qc
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { projectId } = body as { projectId?: string };
    if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

    // Fetch project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch sticker items
    const stickerItems = await prisma.stickerItem.findMany({
      where: { projectId },
      orderBy: { index: "asc" },
    });

    // Fetch APNG outputs
    const apngOutputs = await prisma.apngOutput.findMany({
      where: { projectId },
    });

    const stickerCount = stickerItems.length;
    const spec = LINE_ANIMATED_STICKER_SPEC;

    // Aggregate APNG values (use first output as representative)
    const representativeApng = apngOutputs[0];
    const apngFrames = representativeApng?.frames ?? spec.minFrames;
    const apngWidth = representativeApng?.width ?? spec.stickerImage.maxWidth;
    const apngHeight = representativeApng?.height ?? spec.stickerImage.maxHeight;
    const apngFileBytes = representativeApng?.fileBytes ?? 0;
    const hasTransparent = representativeApng?.hasTransparency ?? true;
    const colorSpace = representativeApng?.colorSpace ?? "RGB";
    const loopCount = representativeApng?.loopCount ?? 1;
    const playbackSeconds = representativeApng?.playbackSeconds ?? 1.0;
    const opacityNotFull = representativeApng?.opacityNotFull ?? false;

    // Compute ZIP bytes (estimate: stickerCount × apngFileBytes + overhead)
    const zipBytes = stickerCount * apngFileBytes + 50_000;

    // Run QC
    const qcReport = runQcEngine({
      stickerCount,
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

    // Persist to DB
    const saved = await prisma.qcReport.upsert({
      where: { projectId },
      update: {
        stickerCount,
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
        passed: qcReport.passed,
        exportBlocked: qcReport.exportBlocked,
        p0Count: qcReport.summary.P0,
        p1Count: qcReport.summary.P1,
        p2Count: qcReport.summary.P2,
        passedChecks: qcReport.summary.passedChecks,
        totalChecks: qcReport.summary.totalChecks,
        findingsJson: JSON.stringify(qcReport.findings),
      },
      create: {
        projectId,
        stickerCount,
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
        passed: qcReport.passed,
        exportBlocked: qcReport.exportBlocked,
        p0Count: qcReport.summary.P0,
        p1Count: qcReport.summary.P1,
        p2Count: qcReport.summary.P2,
        passedChecks: qcReport.summary.passedChecks,
        totalChecks: qcReport.summary.totalChecks,
        findingsJson: JSON.stringify(qcReport.findings),
      },
    });

    return NextResponse.json({ qcReport: saved }, { status: 200 });
  } catch (err) {
    console.error("[qc] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/qc?projectId=xxx — retrieve existing QC report
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const report = await prisma.qcReport.findUnique({ where: { projectId } });
  if (!report) return NextResponse.json({ error: "QC report not found" }, { status: 404 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ qcReport: report }, { status: 200 });
}
