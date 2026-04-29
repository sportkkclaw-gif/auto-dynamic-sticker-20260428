/**
 * lib/qc/qcEngine.ts
 *
 * Deterministic QC engine that uses lineSpec.ts as the single source of truth.
 * Produces QcReport with exportBlocked flag controlling export gate.
 */

import { runQcEngine, LINE_ANIMATED_STICKER_SPEC } from "../line-spec/lineSpec";
import type { QcReport } from "../line-spec/lineSpec";

export { runQcEngine, LINE_ANIMATED_STICKER_SPEC };
export type { QcReport } from "@/lib/line-spec/lineSpec";

/**
 * Convenience wrapper that returns a QcReport for a given project.
 * The caller (API route) provides all sticker/APNG metadata.
 */
export async function computeQcReport(params: {
  projectId: string;
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
  opacityNotFull: boolean;
}): Promise<QcReport> {
  const report = runQcEngine(params);
  return { ...report, projectId: params.projectId };
}
