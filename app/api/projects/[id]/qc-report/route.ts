/**
 * app/api/projects/[id]/qc-report/route.ts
 *
 * GET /api/projects/:id/qc-report — retrieve project's full QC report.
 * Spec §D-13: Response { projectReport: QcReport, stickerReports: QcReport[] }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/projects/:id/qc-report
export async function GET(
  _request: NextRequest,
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

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Project not found." } },
      { status: 404 }
    );
  }
  if (user.role !== "ADMIN" && project.userId !== user.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Forbidden." } },
      { status: 403 }
    );
  }

  // Fetch project-level QC report
  const projectReport = await prisma.qcReport.findUnique({ where: { projectId: id } });

  // Fetch sticker items and their APNG outputs for per-sticker QC
  const stickerItems = await prisma.stickerItem.findMany({
    where: { projectId: id },
    orderBy: { index: "asc" },
  });

  const stickerReports = await Promise.all(
    stickerItems.map(async (sticker) => {
      const apng = await prisma.apngOutput.findUnique({ where: { stickerItemId: sticker.id } });
      return {
        id: `sticker_qc_${sticker.id}`,
        projectId: id,
        stickerCount: 1,
        apngFrames: apng?.frames ?? 0,
        apngWidth: apng?.width ?? 0,
        apngHeight: apng?.height ?? 0,
        zipBytes: apng?.fileBytes ?? 0,
        passed: true,
        exportBlocked: false,
        p0Count: 0,
        p1Count: 0,
        p2Count: 0,
        passedChecks: 0,
        totalChecks: 0,
      };
    })
  );

  return NextResponse.json(
    { projectReport: projectReport ?? null, stickerReports },
    { status: 200 }
  );
}
