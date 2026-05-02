/**
 * app/api/projects/[id]/character-lock/route.ts
 *
 * POST /api/projects/:id/character-lock — lock character style for a project.
 * Spec §D-9: Request { name, sourceAssetIds, licenseStatus, ownershipDeclaration };
 * Response { character: Character, styleLock: StyleLock }
 *
 * All subsequent generation must reference characterAssetId/styleLockId.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// POST /api/projects/:id/character-lock
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

  try {
    const body = await request.json();
    const { name, sourceAssetIds = [], licenseStatus = "self_owned", ownershipDeclaration = false } = body as {
      name?: string;
      sourceAssetIds?: string[];
      licenseStatus?: string;
      ownershipDeclaration?: boolean;
    };

    if (!name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "name is required." } },
        { status: 400 }
      );
    }
    if (!ownershipDeclaration) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "ownershipDeclaration must be true." } },
        { status: 400 }
      );
    }

    // Create CharacterAsset records for each source asset
    const characterAssets = await Promise.all(
      sourceAssetIds.map((assetId) =>
        prisma.characterAsset.create({
          data: {
            projectId: id,
            filename: `asset_${assetId}.png`,
            originalName: assetId,
            mimeType: "image/png",
            sizeBytes: 0,
            storagePath: `projects/${id}/assets/${assetId}`,
            licenseAgreed: true,
            licenseAgreedAt: new Date(),
          },
        })
      )
    );

    // Upsert StyleLock
    const styleLock = await prisma.styleLock.upsert({
      where: { projectId: id },
      update: { styleCode: "locked", styleName: name, provider: "mock" },
      create: {
        projectId: id,
        styleCode: "locked",
        styleName: name,
        provider: "mock",
        metadata: JSON.stringify({ licenseStatus, assetCount: sourceAssetIds.length }),
      },
    });

    // Return mock Character object (schema doesn't have a separate Character model)
    const character = {
      id: `char_${id}`,
      projectId: id,
      name,
      characterAssetIds: characterAssets.map((a) => a.id),
      styleLockId: styleLock.id,
      locked: true,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ character, styleLock }, { status: 200 });
  } catch (err) {
    console.error("[character-lock] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}
