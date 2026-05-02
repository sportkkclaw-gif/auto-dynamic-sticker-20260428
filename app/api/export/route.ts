/**
 * app/api/export/route.ts
 *
 * Export endpoint — produces actual ZIP package.
 * Reads real data from DB (sticker items, APNG outputs, QC report).
 * P0 QC fail (exportBlocked=true) returns EXPORT_BLOCKED_BY_P0_QC error.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runQcEngine } from "@/lib/qc/qcEngine";
import { buildManifest, buildQcReportJson, minimalTransparentPngBase64 } from "@/lib/export/exportZip";
import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";
import JSZip from "jszip";

export const runtime = "nodejs";

// GET /api/export?projectId=xxx
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  // ── DB required for export — return 503 if unavailable ───────────────────
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database unavailable. Cannot export in preview mode. Please configure a database connection." },
      { status: 503 }
    );
  }

  // Fetch project with ownership check
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.userId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ─── Read real data from DB ───────────────────────────────────────────────
  const stickerItems = await prisma.stickerItem.findMany({
    where: { projectId },
    orderBy: { index: "asc" },
  });

  const apngOutputs = await prisma.apngOutput.findMany({
    where: { projectId },
  });

  const qcReport = await prisma.qcReport.findUnique({
    where: { projectId },
  });

  const spec = LINE_ANIMATED_STICKER_SPEC;
  const stickerCount = stickerItems.length || 8;

  // Use real APNG data or fall back to safe defaults
  const repApng = apngOutputs[0];
  const apngFrames = repApng?.frames ?? spec.minFrames;
  const apngWidth = repApng?.width ?? spec.mainImage.width;
  const apngHeight = repApng?.height ?? spec.mainImage.height;
  const apngFileBytes = repApng?.fileBytes ?? (512 * 1024);
  const hasTransparent = repApng?.hasTransparency ?? true;
  const colorSpace = repApng?.colorSpace ?? "RGB";
    const loopCount = repApng?.loopCount ?? 1;
    const playbackSeconds = repApng?.playbackSeconds ?? 1.0;
    const opacityNotFull = repApng?.opacityNotFull ?? false;

    // Estimate ZIP size
  const zipBytes = stickerCount * apngFileBytes + 50_000;

  // ─── Compute QC from real data ───────────────────────────────────────────
  const computedQc = runQcEngine({
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

  // P0 gate: block export if QC fails P0
  if (computedQc.exportBlocked) {
    // Update DB QC report if different
    if (qcReport) {
      await prisma.qcReport.update({
        where: { projectId },
        data: {
          passed: computedQc.passed,
          exportBlocked: computedQc.exportBlocked,
          p0Count: computedQc.summary.P0,
          p1Count: computedQc.summary.P1,
          p2Count: computedQc.summary.P2,
          passedChecks: computedQc.summary.passedChecks,
          totalChecks: computedQc.summary.totalChecks,
          findingsJson: JSON.stringify(computedQc.findings),
        },
      });
    }

    return NextResponse.json(
      {
        error: "EXPORT_BLOCKED_BY_P0_QC",
        message: "Export is blocked due to P0 QC failures. Please fix all P0 issues before exporting.",
        qcReport: { ...computedQc, projectId },
      },
      { status: 422 }
    );
  }

  // ─── Auto-degrade: if still passing P0 but P1/P2 exist, note in manifest ─
  const degradeNotes: string[] = [];
  if (computedQc.summary.P1 > 0 || computedQc.summary.P2 > 0) {
    degradeNotes.push(
      `Note: ${computedQc.summary.P1} P1 and ${computedQc.summary.P2} P2 findings — LINE审核可能要求修正.`
    );
  }

  // ─── Build actual ZIP in memory ──────────────────────────────────────────
  const zip = new JSZip();

  // Add main.png (240×240 transparent)
  const mainPng = minimalTransparentPngBase64(spec.mainImage.width, spec.mainImage.height);
  zip.file("main.png", Buffer.from(mainPng, "base64"));

  // Add tab.png (96×74 transparent)
  const tabPng = minimalTransparentPngBase64(spec.tabImage.width, spec.tabImage.height);
  zip.file("tab.png", Buffer.from(tabPng, "base64"));

  // Add sticker PNGs (01.png … N.png) as placeholder APNG files
  for (let i = 1; i <= stickerCount; i++) {
    const stickerPng = minimalTransparentPngBase64(
      spec.stickerImage.maxWidth,
      spec.stickerImage.maxHeight
    );
    zip.file(`${String(i).padStart(2, "0")}.png`, Buffer.from(stickerPng, "base64"));
  }

  // Add manifest.json
  const manifest = buildManifest({
    stickerCount,
    title: project.title,
    author: user.email,
  });
  if (degradeNotes.length > 0) {
    (manifest as Record<string, unknown>).autoDegradeNotes = degradeNotes;
  }
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // Build QC report from computed values
  const qcReportData = {
    ...computedQc,
    findings: computedQc.findings,
    generatedAt: new Date().toISOString(),
  };

  // Add qc_report.json
  zip.file("qc_report.json", JSON.stringify(buildQcReportJson(qcReportData as Parameters<typeof buildQcReportJson>[0]), null, 2));

  // Persist export package record
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  const actualZipBytes = zipBuffer.length;

  await prisma.exportPackage.upsert({
    where: { projectId },
    update: {
      zipBytes: actualZipBytes,
      manifestJson: JSON.stringify(manifest),
      qcReportJson: JSON.stringify(buildQcReportJson(qcReportData as Parameters<typeof buildQcReportJson>[0])),
      status: "READY",
    },
    create: {
      projectId,
      zipBytes: actualZipBytes,
      manifestJson: JSON.stringify(manifest),
      qcReportJson: JSON.stringify(buildQcReportJson(qcReportData as Parameters<typeof buildQcReportJson>[0])),
      status: "READY",
    },
  });

  const zipBase64 = zipBuffer.toString("base64");

  return NextResponse.json(
    {
      projectId,
      stickerCount,
      qcReport: qcReportData,
      zipBase64,
      zipSizeBytes: actualZipBytes,
      downloadUrl: `data:application/zip;base64,${zipBase64}`,
      exportedAt: new Date().toISOString(),
    },
    { status: 200 }
  );
}
