/**
 * lib/pipeline/autoDegrade.test.ts
 *
 * Unit tests for auto-degrade pipeline:
 * - computeDegradedParams computes correct degraded values
 * - autoDegrade() records correct step chain per P0 failure mode
 * - After degrade, QC passes all P0 gates
 * - opacityNotFull cannot be auto-degraded (NO_OP)
 * - Multiple P0 findings → multiple degrade steps
 */
import { describe, it, expect } from "vitest";
import {
  computeDegradedParams,
  autoDegrade,
  classifyDegradeActions,
  type DegradeParams,
} from "./autoDegrade";
import { runQcEngine } from "@/lib/qc/qcEngine";
import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";

const spec = LINE_ANIMATED_STICKER_SPEC;

/** Helper: build full QC params from DegradeParams + fixed fields */
function buildFullParams(dp: DegradeParams) {
  return {
    stickerCount: 8,
    apngFrames: dp.apngFrames,
    apngWidth: dp.apngWidth,
    apngHeight: dp.apngHeight,
    apngFileBytes: 512 * 1024,
    loopCount: dp.loopCount,
    playbackSeconds: dp.playbackSeconds,
    zipBytes: 8 * 512 * 1024 + 50_000,
    mainImageWidth: spec.mainImage.width,
    mainImageHeight: spec.mainImage.height,
    tabImageWidth: spec.tabImage.width,
    tabImageHeight: spec.tabImage.height,
    hasTransparentBackground: true,
    colorSpace: "RGB",
    opacityNotFull: dp.opacityNotFull,
  };
}

// ─── computeDegradedParams tests ─────────────────────────────────────────────

describe("computeDegradedParams", () => {
  it("returns identical params when all within spec", () => {
    const result = computeDegradedParams({
      apngFrames: 12,
      loopCount: 1,
      playbackSeconds: 1.0,
      apngWidth: 240,
      apngHeight: 240,
      opacityNotFull: false,
    });
    expect(result.apngFrames).toBe(12);
    expect(result.loopCount).toBe(1);
    expect(result.playbackSeconds).toBe(1.0);
    expect(result.opacityNotFull).toBe(false);
  });

  it("reduces frames from 25 → 20 (max spec)", () => {
    const result = computeDegradedParams({
      apngFrames: 25,
      loopCount: 1,
      playbackSeconds: 1.0,
      apngWidth: 240,
      apngHeight: 240,
      opacityNotFull: false,
    });
    expect(result.apngFrames).toBe(20);
  });

  it("reduces frames from 100 → 20", () => {
    const result = computeDegradedParams({
      apngFrames: 100,
      loopCount: 1,
      playbackSeconds: 1.0,
      apngWidth: 240,
      apngHeight: 240,
      opacityNotFull: false,
    });
    expect(result.apngFrames).toBe(20);
  });

  it("reduces playback+loop when total > 4s (1.5s × 4 = 6s → 1.0s × 4)", () => {
    const result = computeDegradedParams({
      apngFrames: 10,
      loopCount: 4,
      playbackSeconds: 1.5,
      apngWidth: 240,
      apngHeight: 240,
      opacityNotFull: false,
    });
    // Total: 6s > 4s → playback reduced
    expect(result.playbackSeconds * result.loopCount).toBeLessThanOrEqual(4);
    expect(result.playbackSeconds).toBeLessThan(1.5);
  });

  it("reduces dimensions from 400×350 → 320×270", () => {
    const result = computeDegradedParams({
      apngFrames: 10,
      loopCount: 1,
      playbackSeconds: 1.0,
      apngWidth: 400,
      apngHeight: 350,
      opacityNotFull: false,
    });
    expect(result.apngWidth).toBe(320);
    expect(result.apngHeight).toBe(270);
  });

  it("preserves opacityNotFull (cannot degrade)", () => {
    const result = computeDegradedParams({
      apngFrames: 10,
      loopCount: 1,
      playbackSeconds: 1.0,
      apngWidth: 240,
      apngHeight: 240,
      opacityNotFull: true,
    });
    expect(result.opacityNotFull).toBe(true);
  });

  it("handles multiple violations at once", () => {
    const result = computeDegradedParams({
      apngFrames: 30,
      loopCount: 4,
      playbackSeconds: 2.0, // 8s total
      apngWidth: 400,
      apngHeight: 350,
      opacityNotFull: false,
    });
    expect(result.apngFrames).toBe(20);
    expect(result.playbackSeconds * result.loopCount).toBeLessThanOrEqual(4);
    expect(result.apngWidth).toBe(320);
    expect(result.apngHeight).toBe(270);
  });
});

// ─── autoDegrade() step chain tests ──────────────────────────────────────────

describe("autoDegrade()", () => {
  it("no steps when no P0 failures", () => {
    const qcPass = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));
    const result = autoDegrade(qcPass, {
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.didDegrade).toBe(false);
    expect(result.steps).toHaveLength(0);
  });

  it("records REDUCE_FRAMES step when APNG_FRAME_COUNT P0 fail", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 25, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));
    expect(qcFail.exportBlocked).toBe(true);

    const result = autoDegrade(qcFail, {
      apngFrames: 25, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.didDegrade).toBe(true);
    expect(result.steps.some((s) => s.action === "REDUCE_FRAMES")).toBe(true);
    expect(result.steps[0].before.apngFrames).toBe(25);
    expect(result.steps[0].after.apngFrames).toBe(20);
  });

  it("records REDUCE_PLAYBACK_SECONDS step when APNG_LOOP_DURATION P0 fail", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 4, playbackSeconds: 1.5,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));
    expect(qcFail.exportBlocked).toBe(true);

    const result = autoDegrade(qcFail, {
      apngFrames: 10, loopCount: 4, playbackSeconds: 1.5,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.didDegrade).toBe(true);
    expect(result.steps.some((s) => s.action === "REDUCE_PLAYBACK_SECONDS")).toBe(true);
  });

  it("records REDUCE_DIMENSIONS step when APNG_DIMENSIONS P0 fail", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 400, apngHeight: 350, opacityNotFull: false,
    }));
    expect(qcFail.exportBlocked).toBe(true);

    const result = autoDegrade(qcFail, {
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 400, apngHeight: 350, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.didDegrade).toBe(true);
    expect(result.steps.some((s) => s.action === "REDUCE_DIMENSIONS")).toBe(true);
  });

  it("marks opacityNotFull as NO_OP — no degrade possible", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: true,
    }));
    expect(qcFail.exportBlocked).toBe(true);

    const result = autoDegrade(qcFail, {
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: true,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.didDegrade).toBe(false); // no action possible
    const opacityStep = result.steps.find((s) => s.action === "MARK_OPACITY_FIX_REQUIRED");
    expect(opacityStep).toBeDefined();
    expect(opacityStep!.reason).toContain("cannot be auto-degraded");
  });

  it("multiple P0 findings produce multiple degrade steps", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 30, loopCount: 4, playbackSeconds: 1.5,
      apngWidth: 400, apngHeight: 350, opacityNotFull: false,
    }));
    expect(qcFail.summary.P0).toBeGreaterThanOrEqual(3);

    const result = autoDegrade(qcFail, {
      apngFrames: 30, loopCount: 4, playbackSeconds: 1.5,
      apngWidth: 400, apngHeight: 350, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.didDegrade).toBe(true);
    expect(result.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("after degrade, QC passes all P0 gates", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 25, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));

    const result = autoDegrade(qcFail, {
      apngFrames: 25, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    expect(result.qcAfterDegrade.passed).toBe(true);
    expect(result.qcAfterDegrade.exportBlocked).toBe(false);
    expect(result.qcAfterDegrade.summary.P0).toBe(0);
  });

  it("step chain preserves reason for audit/debug", () => {
    const qcFail = runQcEngine(buildFullParams({
      apngFrames: 30, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));

    const result = autoDegrade(qcFail, {
      apngFrames: 30, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }, (dp) => runQcEngine(buildFullParams(dp)));

    for (const step of result.steps) {
      expect(typeof step.reason).toBe("string");
      expect(step.reason.length).toBeGreaterThan(0);
      expect(typeof step.action).toBe("string");
    }
  });
});

// ─── classifyDegradeActions tests ─────────────────────────────────────────────

describe("classifyDegradeActions", () => {
  it("maps APNG_FRAME_COUNT → REDUCE_FRAMES", () => {
    const qc = runQcEngine(buildFullParams({
      apngFrames: 25, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));
    const actions = classifyDegradeActions(qc.findings);
    expect(actions).toContain("REDUCE_FRAMES");
  });

  it("maps APNG_LOOP_DURATION → REDUCE_PLAYBACK_SECONDS", () => {
    const qc = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 4, playbackSeconds: 1.5,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));
    const actions = classifyDegradeActions(qc.findings);
    expect(actions).toContain("REDUCE_PLAYBACK_SECONDS");
  });

  it("maps APNG_DIMENSIONS → REDUCE_DIMENSIONS", () => {
    const qc = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 400, apngHeight: 350, opacityNotFull: false,
    }));
    const actions = classifyDegradeActions(qc.findings);
    expect(actions).toContain("REDUCE_DIMENSIONS");
  });

  it("maps APNG_OPACITY → MARK_OPACITY_FIX_REQUIRED", () => {
    const qc = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: true,
    }));
    const actions = classifyDegradeActions(qc.findings);
    expect(actions).toContain("MARK_OPACITY_FIX_REQUIRED");
  });

  it("no actions for clean QC report", () => {
    const qc = runQcEngine(buildFullParams({
      apngFrames: 10, loopCount: 1, playbackSeconds: 1.0,
      apngWidth: 240, apngHeight: 240, opacityNotFull: false,
    }));
    const actions = classifyDegradeActions(qc.findings);
    expect(actions).not.toContain("REDUCE_FRAMES");
    expect(actions).not.toContain("NO_OP_DEGRADE");
  });
});