/**
 * app/api/exports/[id]/download/route.ts
 *
 * GET /api/exports/:id/download — download export package.
 * Spec §D-15: Response ZIP binary or { downloadUrl: "..." }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET /api/exports/:id/download
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

  const { id } = await params;

  const exportPkg = await prisma.exportPackage.findUnique({ where: { id } });
  if (!exportPkg) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Export package not found." } },
      { status: 404 }
    );
  }

  const project = await prisma.project.findUnique({ where: { id: exportPkg.projectId } });
  if (!project || (user.role !== "ADMIN" && project.userId !== user.id)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Forbidden." } },
      { status: 403 }
    );
  }

  if (exportPkg.status === "PENDING" || exportPkg.status === "FAILED") {
    return NextResponse.json(
      { error: { code: "EXPORT_NOT_READY", message: "Export is not ready for download." } },
      { status: 422 }
    );
  }

  // Mark as downloaded
  await prisma.exportPackage.update({
    where: { id },
    data: { status: "DOWNLOADED", downloadedAt: new Date() },
  });

  // If we have a stored zip, return it directly; otherwise return downloadUrl
  if (exportPkg.zipStoragePath) {
    // Return mock downloadUrl response (actual file serving depends on storage backend)
    return NextResponse.json(
      {
        downloadUrl: `/api/exports/${id}/file`,
        exportedAt: exportPkg.createdAt?.toISOString(),
        fileSizeBytes: exportPkg.zipBytes,
      },
      { status: 200 }
    );
  }

  // Fallback: regenerate and return download URL
  return NextResponse.json(
    {
      downloadUrl: `/api/export?projectId=${exportPkg.projectId}`,
      exportedAt: exportPkg.createdAt?.toISOString(),
      fileSizeBytes: exportPkg.zipBytes,
    },
    { status: 200 }
  );
}
