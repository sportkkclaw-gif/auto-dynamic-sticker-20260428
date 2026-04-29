/**
 * lib/pipeline/autoDegrade.ts
 *
 * Auto-degrade pipeline: when QC fails P0, automatically applies
 * degradation rules, re-runs QC, and tracks the reason/step chain.
 *
 * Degrade is applied per-sticker (each StickerItem can have its own degrade level).
 * The pipeline records degradeReason and degradeSteps on each sticker item.
 */

import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";
import type { QcReport, QcFinding } from "@/lib/line-spec/lineSpec";

/** A single degrade step — applied atomically */
export interface DegradeStep {
  step: number;
  action: DegradeAction;
  reason: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}

export type DegradeAction =
  | "REDUCE_FRAMES"
  | "REDUCE_LOOP_COUNT"
  | "REDUCE_PLAYBACK_SECONDS"
  | "REDUCE_DIMENSIONS"
  | "MARK_OPACITY_FIX_REQUIRED"
  | "NO_OP_DEGRADE"; // cannot auto-fix (must re-render with fix)

/** Result of applying auto-degrade to a set of params */
export interface DegradeResult {
  didDegrade: boolean;
  steps: DegradeStep[];
  finalParams: DegradeParams;
  qcAfterDegrade: QcReport;
}

/** Params that can be degraded */
export interface DegradeParams {
  apngFrames: number;
  loopCount: number;
  playbackSeconds: number;
  apngWidth: number;
  apngHeight: number;
  opacityNotFull: boolean;
}

/**
 * Compute how many steps of degradation are needed to pass P0 gates.
 * Returns the recommended degraded params without actually running QC.
 */
export function computeDegradedParams(params: {
  apngFrames: number;
  loopCount: number;
  playbackSeconds: number;
  apngWidth: number;
  apngHeight: number;
  opacityNotFull: boolean;
}): DegradeParams {
  const spec = LINE_ANIMATED_STICKER_SPEC;
  let { apngFrames, loopCount, playbackSeconds, apngWidth, apngHeight, opacityNotFull } = params;

  // 1. Reduce frames if > 20
  if (apngFrames > spec.maxFrames) {
    apngFrames = spec.maxFrames;
  }

  // 2. Reduce loop count / playback if total > 4s
  const maxTotalSeconds = spec.maxTotalLoopSeconds;
  const totalSeconds = playbackSeconds * loopCount;
  if (totalSeconds > maxTotalSeconds) {
    // Strategy: reduce playbackSeconds first, then loopCount
    playbackSeconds = maxTotalSeconds / loopCount;
    if (playbackSeconds < 0.25) {
      // playback too low — reduce loop count
      loopCount = Math.max(1, Math.floor(maxTotalSeconds / 0.5));
      playbackSeconds = maxTotalSeconds / loopCount;
    }
  }

  // 3. Reduce dimensions if > 320x270
  if (apngWidth > spec.stickerImage.maxWidth) {
    apngWidth = spec.stickerImage.maxWidth;
  }
  if (apngHeight > spec.stickerImage.maxHeight) {
    apngHeight = spec.stickerImage.maxHeight;
  }

  // 4. opacityNotFull: cannot auto-degrade, must be flagged
  // (no change here — pipeline must handle separately)

  return { apngFrames, loopCount, playbackSeconds, apngWidth, apngHeight, opacityNotFull };
}

/**
 * Auto-degrade pipeline: runs QC, if P0 fail detected applies
 * degrade steps and re-runs QC until P0 clear or no more degrade possible.
 *
 * Returns degrade result with full step chain and final QC report.
 */
export function autoDegrade(
  qcReport: QcReport,
  degradeParams: DegradeParams,
  runQc: (params: DegradeParams) => QcReport
): DegradeResult {
  const steps: DegradeStep[] = [];
  let currentParams = { ...degradeParams };
  let stepCounter = 1;

  // Deep-clone params for mutation
  let didDegrade = false;

  // Helper to apply a step and record it
  function applyStep(
    action: DegradeAction,
    reason: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    affectsParams = true
  ): void {
    steps.push({ step: stepCounter++, action, reason, before, after });
    if (affectsParams) didDegrade = true;
  }

  // ─── Step 1: Reduce frames if over limit ───────────────────────────────────
  if (currentParams.apngFrames > LINE_ANIMATED_STICKER_SPEC.maxFrames) {
    const beforeFrames = currentParams.apngFrames;
    currentParams = {
      ...currentParams,
      apngFrames: LINE_ANIMATED_STICKER_SPEC.maxFrames,
    };
    applyStep(
      "REDUCE_FRAMES",
      `QC P0: apngFrames ${beforeFrames} > LINE max ${LINE_ANIMATED_STICKER_SPEC.maxFrames}`,
      { apngFrames: beforeFrames },
      { apngFrames: LINE_ANIMATED_STICKER_SPEC.maxFrames }
    );
  }

  // ─── Step 2: Reduce loop/playback if total > 4s ───────────────────────────
  const totalSeconds = currentParams.playbackSeconds * currentParams.loopCount;
  if (totalSeconds > LINE_ANIMATED_STICKER_SPEC.maxTotalLoopSeconds) {
    const beforePlayback = currentParams.playbackSeconds;
    const beforeLoop = currentParams.loopCount;

    // Try halving playback first
    let newPlayback = currentParams.playbackSeconds / 2;
    let newLoop = currentParams.loopCount;

    // If playback would go below 0.25s, reduce loop count instead
    if (newPlayback < 0.25) {
      newPlayback = currentParams.playbackSeconds;
      newLoop = Math.max(1, Math.floor(LINE_ANIMATED_STICKER_SPEC.maxTotalLoopSeconds / currentParams.playbackSeconds));
    }

    // Cap to ensure total ≤ 4s
    const maxAllowed = LINE_ANIMATED_STICKER_SPEC.maxTotalLoopSeconds / newLoop;
    if (newPlayback > maxAllowed) {
      newPlayback = maxAllowed;
    }

    currentParams = {
      ...currentParams,
      playbackSeconds: newPlayback,
      loopCount: newLoop,
    };

    applyStep(
      "REDUCE_PLAYBACK_SECONDS",
      `QC P0: total loop duration ${totalSeconds.toFixed(2)}s > LINE max ${LINE_ANIMATED_STICKER_SPEC.maxTotalLoopSeconds}s`,
      { playbackSeconds: beforePlayback, loopCount: beforeLoop },
      { playbackSeconds: newPlayback, loopCount: newLoop }
    );
  }

  // ─── Step 3: Reduce dimensions if over 320x270 ────────────────────────────
  const spec = LINE_ANIMATED_STICKER_SPEC;
  if (currentParams.apngWidth > spec.stickerImage.maxWidth) {
    const beforeW = currentParams.apngWidth;
    currentParams = { ...currentParams, apngWidth: spec.stickerImage.maxWidth };
    applyStep(
      "REDUCE_DIMENSIONS",
      `QC P0: apngWidth ${beforeW} > LINE max ${spec.stickerImage.maxWidth}`,
      { apngWidth: beforeW },
      { apngWidth: spec.stickerImage.maxWidth }
    );
  }
  if (currentParams.apngHeight > spec.stickerImage.maxHeight) {
    const beforeH = currentParams.apngHeight;
    currentParams = { ...currentParams, apngHeight: spec.stickerImage.maxHeight };
    applyStep(
      "REDUCE_DIMENSIONS",
      `QC P0: apngHeight ${beforeH} > LINE max ${spec.stickerImage.maxHeight}`,
      { apngHeight: beforeH },
      { apngHeight: spec.stickerImage.maxHeight }
    );
  }

  // ─── Step 4: opacityNotFull cannot be auto-degraded ──────────────────────
  if (currentParams.opacityNotFull) {
    // Cannot auto-fix — must be fixed at render time
    // Mark as NO_OP but still record
    applyStep(
      "MARK_OPACITY_FIX_REQUIRED",
      `QC P0: opacityNotFull=true cannot be auto-degraded — requires re-render`,
      { opacityNotFull: true },
      { opacityNotFull: true, note: "no auto-fix possible" },
      false
    );
  }

  // Re-run QC with degraded params
  const qcAfterDegrade = runQc(currentParams);

  return {
    didDegrade,
    steps,
    finalParams: currentParams,
    qcAfterDegrade,
  };
}

/**
 * Classify which degrade actions are needed based on QC findings.
 */
export function classifyDegradeActions(findings: QcFinding[]): DegradeAction[] {
  const actions: DegradeAction[] = [];
  const codes = new Set(findings.map((f) => f.code));

  if (codes.has("APNG_FRAME_COUNT")) actions.push("REDUCE_FRAMES");
  if (codes.has("APNG_LOOP_DURATION")) actions.push("REDUCE_PLAYBACK_SECONDS");
  if (codes.has("APNG_DIMENSIONS")) actions.push("REDUCE_DIMENSIONS");
  if (codes.has("APNG_OPACITY")) actions.push("MARK_OPACITY_FIX_REQUIRED");
  if (findings.some((f) => f.severity === "P0")) actions.push("NO_OP_DEGRADE");

  return actions;
}