/**
 * lib/line-spec/lineSpec.ts
 *
 * SINGLE SOURCE OF TRUTH for LINE sticker specifications.
 * All QC, UI badges, export logic, seed data, and tests must import from here.
 * Do NOT hard-code LINE spec numbers anywhere else.
 */

export const LINE_STATIC_STICKER_SPEC = {
  mainImage: { width: 240, height: 240 },
  tabImage: { width: 96, height: 74 },
  stickerImage: { maxWidth: 370, maxHeight: 320 },
  allowedCounts: [8, 16, 24, 32, 40],
  maxFileBytes: 1_048_576,
  maxZipBytes: 60 * 1024 * 1024,
  transparentRequired: true,
} as const;

export const LINE_ANIMATED_STICKER_SPEC = {
  mainImage: { width: 240, height: 240 },
  tabImage: { width: 96, height: 74 },
  stickerImage: { maxWidth: 320, maxHeight: 270 },
  allowedCounts: [8, 16, 24],
  minFrames: 5,
  maxFrames: 20,
  allowedLoopCount: [1, 2, 3, 4],
  maxTotalLoopSeconds: 4,
  maxFileBytes: 1_048_576,
  maxZipBytes: 60 * 1024 * 1024,
  transparentRequired: true,
  colorSpace: "RGB",
} as const;

// ─── QC Finding Types ────────────────────────────────────────────────────────

export type QcSeverity = "P0" | "P1" | "P2";

export type QcFindingCode =
  | "APNG_FRAME_COUNT"
  | "APNG_FRAME_SIZE"
  | "APNG_LOOP_DURATION"
  | "APNG_DIMENSIONS"
  | "APNG_BACKGROUND"
  | "APNG_COLOR_SPACE"
  | "STICKER_COUNT"
  | "ZIP_SIZE"
  | "MAIN_IMAGE_SIZE"
  | "TAB_IMAGE_SIZE"
  | "APNG_OPACITY"
  | "FILE_SIZE";

export interface QcFinding {
  code: QcFindingCode;
  severity: QcSeverity;
  message: string;
  detail: string;
}

export interface QcReport {
  projectId: string;
  passed: boolean;
  exportBlocked: boolean; // true if any P0 findings
  findings: QcFinding[];
  summary: {
    P0: number;
    P1: number;
    P2: number;
    passedChecks: number;
    totalChecks: number;
  };
}

// ─── QC Engine ───────────────────────────────────────────────────────────────
//
// P0 checks (export blocked if any fail):
//   - frame count > 20
//   - dimensions > 320x270
//   - total loop duration > 4s
//   - background not transparent
//   - file size > 1 MB
//   - ZIP size > 60 MB
//   - opacity not full (not 100%)
//
// P1 checks (warnings, export still allowed):
//   - sticker count not one of 8/16/24
//   - color space not RGB
//   - main image not 240x240
//   - tab image not 96x74

export function runQcEngine(params: {
  stickerCount: number;
  apngFrames: number;
  apngWidth: number;
  apngHeight: number;
  apngFileBytes: number;
  loopCount: number;
  playbackSeconds: number;
  zipBytes: number;
  mainImageWidth: number;
  mainImageHeight: number;
  tabImageWidth: number;
  tabImageHeight: number;
  hasTransparentBackground: boolean;
  colorSpace: string;
  opacityNotFull: boolean; // true = some frame has opacity < 1.0 → P0 fail
}): QcReport {
  const {
    stickerCount,
    apngFrames,
    apngWidth,
    apngHeight,
    apngFileBytes,
    loopCount,
    playbackSeconds,
    zipBytes,
    mainImageWidth,
    mainImageHeight,
    tabImageWidth,
    tabImageHeight,
    hasTransparentBackground,
    colorSpace,
    opacityNotFull,
  } = params;

  const findings: QcFinding[] = [];
  const spec = LINE_ANIMATED_STICKER_SPEC;

  // P0 checks ─────────────────────────────────────────────────────────────────

  // APNG frame count (>20 → P0 fail)
  if (apngFrames > spec.maxFrames) {
    findings.push({
      code: "APNG_FRAME_COUNT",
      severity: "P0",
      message: `APNG frame count ${apngFrames} exceeds LINE maximum ${spec.maxFrames}`,
      detail: `maxFrames=${spec.maxFrames}`,
    });
  }

  // APNG dimensions (>320x270 → P0 fail)
  if (apngWidth > spec.stickerImage.maxWidth || apngHeight > spec.stickerImage.maxHeight) {
    findings.push({
      code: "APNG_DIMENSIONS",
      severity: "P0",
      message: `APNG dimensions ${apngWidth}×${apngHeight} exceed LINE maximum ${spec.stickerImage.maxWidth}×${spec.stickerImage.maxHeight}`,
      detail: `maxWidth=${spec.stickerImage.maxWidth}, maxHeight=${spec.stickerImage.maxHeight}`,
    });
  }

  // Loop duration (playbackSeconds × loopCount > 4s → P0 fail)
  const totalLoopSeconds = playbackSeconds * loopCount;
  if (totalLoopSeconds > spec.maxTotalLoopSeconds) {
    findings.push({
      code: "APNG_LOOP_DURATION",
      severity: "P0",
      message: `Total loop duration ${totalLoopSeconds}s exceeds LINE maximum ${spec.maxTotalLoopSeconds}s`,
      detail: `playbackSeconds=${playbackSeconds}, loopCount=${loopCount}`,
    });
  }

  // Background transparency (not transparent → P0 fail)
  if (!hasTransparentBackground) {
    findings.push({
      code: "APNG_BACKGROUND",
      severity: "P0",
      message: "APNG background must be transparent",
      detail: "transparentRequired=true",
    });
  }

  // File size (>1 MB → P0 fail)
  if (apngFileBytes > spec.maxFileBytes) {
    findings.push({
      code: "APNG_FRAME_SIZE",
      severity: "P0",
      message: `APNG file size ${apngFileBytes} exceeds LINE maximum 1 MB`,
      detail: `maxFileBytes=${spec.maxFileBytes}`,
    });
  }

  // ZIP size (>60 MB → P0 fail)
  if (zipBytes > spec.maxZipBytes) {
    findings.push({
      code: "ZIP_SIZE",
      severity: "P0",
      message: `ZIP package size ${zipBytes} exceeds LINE maximum 60 MB`,
      detail: `maxZipBytes=${spec.maxZipBytes}`,
    });
  }

  // Opacity not full (some frame has opacity < 1.0 → P0 fail)
  if (opacityNotFull) {
    findings.push({
      code: "APNG_OPACITY",
      severity: "P0",
      message: "APNG contains non-full opacity frames — all frames must be full opacity",
      detail: "opacityNotFull=true",
    });
  }

  // P1 checks ─────────────────────────────────────────────────────────────────

  // Sticker count (not 8/16/24 → P1 warn)
  if (!(spec.allowedCounts as readonly number[]).includes(stickerCount)) {
    findings.push({
      code: "STICKER_COUNT",
      severity: "P1",
      message: `Sticker count ${stickerCount} is not one of allowed counts ${spec.allowedCounts.join(", ")}`,
      detail: `allowedCounts=${spec.allowedCounts.join(", ")}`,
    });
  }

  // Color space (not RGB → P1 warn)
  if (colorSpace !== "RGB") {
    findings.push({
      code: "APNG_COLOR_SPACE",
      severity: "P1",
      message: `Color space "${colorSpace}" is not RGB`,
      detail: `colorSpace=RGB required`,
    });
  }

  // Main image size (not 240x240 → P1 warn)
  if (mainImageWidth !== spec.mainImage.width || mainImageHeight !== spec.mainImage.height) {
    findings.push({
      code: "MAIN_IMAGE_SIZE",
      severity: "P1",
      message: `Main image ${mainImageWidth}×${mainImageHeight} does not match LINE spec ${spec.mainImage.width}×${spec.mainImage.height}`,
      detail: `required=${spec.mainImage.width}×${spec.mainImage.height}`,
    });
  }

  // Tab image size (not 96x74 → P1 warn)
  if (tabImageWidth !== spec.tabImage.width || tabImageHeight !== spec.tabImage.height) {
    findings.push({
      code: "TAB_IMAGE_SIZE",
      severity: "P1",
      message: `Tab image ${tabImageWidth}×${tabImageHeight} does not match LINE spec ${spec.tabImage.width}×${spec.tabImage.height}`,
      detail: `required=${spec.tabImage.width}×${spec.tabImage.height}`,
    });
  }

  // P2 checks ────────────────────────────────────────────────────────────────────
  // (placeholder for future checks)

  const p0Count = findings.filter((f) => f.severity === "P0").length;
  const p1Count = findings.filter((f) => f.severity === "P1").length;
  const p2Count = findings.filter((f) => f.severity === "P2").length;
  const totalChecks = 11; // 7 P0 + 4 P1
  const passedChecks = totalChecks - p0Count - p1Count - p2Count;

  return {
    projectId: "", // filled by caller
    passed: p0Count === 0,
    exportBlocked: p0Count > 0,
    findings,
    summary: {
      P0: p0Count,
      P1: p1Count,
      P2: p2Count,
      passedChecks,
      totalChecks,
    },
  };
}