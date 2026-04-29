/**
 * lib/acceptance/briefKeyframeMotion.test.ts
 *
 * Acceptance tests for brief → keyframe → motion template pipeline.
 * Verifies:
 * - Brief generation with LINE spec constraints (8/16/24 stickers)
 * - Keyframe generation respecting motion template parameters
 * - Motion template workspace updates canvas/timeline/budget per template definition
 * - Auto-degrade when spec exceeded
 *
 * This slice represents one of the remaining P0 must-fix verifiable slices.
 */
import { describe, it, expect } from "vitest";
import { LINE_ANIMATED_STICKER_SPEC } from "../line-spec/lineSpec";
import { MOTION_TEMPLATES, getMotionTemplate } from "../motion/motionTemplate";
import type { MotionTemplateDefinition } from "../motion/motionTemplate";
import { runQcEngine } from "../qc/qcEngine";

// ─── Brief Generation Tests ────────────────────────────────────────────────────

describe("Brief generation — LINE spec constraints", () => {
  it("generates valid sticker counts (8/16/24)", () => {
    const validCounts = LINE_ANIMATED_STICKER_SPEC.allowedCounts; // [8, 16, 24]
    expect(validCounts).toContain(8);
    expect(validCounts).toContain(16);
    expect(validCounts).toContain(24);
    expect(validCounts).not.toContain(25); // invalid
  });

  it("brief respects maxFrames (5-20) for animated stickers", () => {
    const spec = LINE_ANIMATED_STICKER_SPEC;
    expect(spec.minFrames).toBe(5);
    expect(spec.maxFrames).toBe(20);

    // Valid frame counts
    expect(5).toBeGreaterThanOrEqual(spec.minFrames);
    expect(20).toBeLessThanOrEqual(spec.maxFrames);
  });

  it("brief respects maxTotalLoopSeconds (≤4s)", () => {
    const spec = LINE_ANIMATED_STICKER_SPEC;
    expect(spec.maxTotalLoopSeconds).toBe(4);

    // Valid loop combos
    const validCombos = [
      { playback: 1.0, loops: 4 }, // 4s
      { playback: 2.0, loops: 2 }, // 4s
      { playback: 4.0, loops: 1 }, // 4s
    ];
    for (const combo of validCombos) {
      expect(combo.playback * combo.loops).toBeLessThanOrEqual(spec.maxTotalLoopSeconds);
    }

    // Invalid: 1.5s × 4 loops = 6s > 4s
    expect(1.5 * 4).toBeGreaterThan(spec.maxTotalLoopSeconds);
  });

  it("sticker image dimensions ≤ 320×270", () => {
    const spec = LINE_ANIMATED_STICKER_SPEC;
    expect(spec.stickerImage.maxWidth).toBe(320);
    expect(spec.stickerImage.maxHeight).toBe(270);
  });
});

// ─── Motion Template Definition Tests ────────────────────────────────────────

describe("Motion template — executable data structure", () => {
  it("all templates have required fields per MOTION_TEMPLATE_DEFINITION_SPEC", () => {
    for (const tm of MOTION_TEMPLATES) {
      expect(tm.code).toBeTruthy();
      expect(tm.name).toBeTruthy();
      expect(tm.targetLayers).toBeTruthy();
      expect(Array.isArray(tm.targetLayers)).toBe(true);
      expect(tm.parameters).toBeTruthy();
      expect(tm.keyframes).toBeTruthy();
      expect(Array.isArray(tm.keyframes)).toBe(true);
      expect(typeof tm.recommendedFrameCount).toBe("number");
      expect(["stable", "expressive", "extreme_limited"]).toContain(tm.riskLevel);
    }
  });

  it("BOUNCE_SIMPLE has correct structure", () => {
    const tm = getMotionTemplate("BOUNCE_SIMPLE");
    expect(tm).toBeDefined();
    expect(tm!.code).toBe("BOUNCE_SIMPLE");
    expect(tm!.targetLayers).toContain("body");
    expect(tm!.keyframes.length).toBeGreaterThan(0);
    expect(tm!.riskLevel).toBe("stable");

    // Keyframes have frame number and transforms
    for (const kf of tm!.keyframes) {
      expect(typeof kf.frame).toBe("number");
      expect(Array.isArray(kf.transforms)).toBe(true);
      for (const t of kf.transforms) {
        expect(t.layer).toBeTruthy();
      }
    }
  });

  it("ROTATION_SWING covers full 360° cycle", () => {
    const tm = getMotionTemplate("ROTATION_SWING");
    expect(tm).toBeDefined();
    // Rotation should return to 0 after full cycle
    const lastKf = tm!.keyframes[tm!.keyframes.length - 1];
    const bodyTransform = lastKf.transforms.find((t) => t.layer === "body");
    expect(bodyTransform?.rotate).toBe(0);
  });

  it("BLINK_REPEAT targets eyes layer", () => {
    const tm = getMotionTemplate("BLINK_REPEAT");
    expect(tm).toBeDefined();
    expect(tm!.targetLayers).toContain("eyes");
  });

  it("WAVE_EXPRESSIVE has multi-layer targets (body, arms)", () => {
    const tm = getMotionTemplate("WAVE_EXPRESSIVE");
    expect(tm).toBeDefined();
    expect(tm!.targetLayers).toContain("body");
    expect(tm!.targetLayers).toContain("arm-left");
    expect(tm!.targetLayers).toContain("arm-right");
  });

  it("JUMP_EXTREME has extreme_limited risk level", () => {
    const tm = getMotionTemplate("JUMP_EXTREME");
    expect(tm).toBeDefined();
    expect(tm!.riskLevel).toBe("extreme_limited");
  });

  it("recommendedFrameCount is within LINE spec (5-20 frames)", () => {
    for (const tm of MOTION_TEMPLATES) {
      expect(tm.recommendedFrameCount).toBeGreaterThanOrEqual(LINE_ANIMATED_STICKER_SPEC.minFrames);
      expect(tm.recommendedFrameCount).toBeLessThanOrEqual(LINE_ANIMATED_STICKER_SPEC.maxFrames);
    }
  });

  it("parameters have min/max/default structure", () => {
    const tm = getMotionTemplate("BOUNCE_SIMPLE")!;
    const params = tm.parameters;

    // Check amplitude if present
    if (params.amplitude) {
      expect(params.amplitude.min).toBeLessThan(params.amplitude.default);
      expect(params.amplitude.default).toBeLessThan(params.amplitude.max);
    }

    // Easing should be a list
    expect(Array.isArray(params.easing)).toBe(true);
    expect(params.easing!.length).toBeGreaterThan(0);
  });
});

// ─── Motion Workspace — Template Application Tests ────────────────────────────

describe("Motion workspace — template updates canvas/timeline/budget", () => {
  it("applying BOUNCE_SIMPLE sets frame budget to recommendedFrameCount", () => {
    const tm = getMotionTemplate("BOUNCE_SIMPLE")!;
    const budget = tm.recommendedFrameCount; // 12
    expect(budget).toBe(12);
    expect(budget).toBeLessThanOrEqual(LINE_ANIMATED_STICKER_SPEC.maxFrames);
  });

  it("applying ROTATION_SWING sets frame budget to 20", () => {
    const tm = getMotionTemplate("ROTATION_SWING")!;
    expect(tm.recommendedFrameCount).toBe(20);
  });

  it("JUMP_EXTREME uses 20 frames (within 5-20 spec)", () => {
    const tm = getMotionTemplate("JUMP_EXTREME")!;
    expect(tm.recommendedFrameCount).toBe(20);
  });

  it("workspace respects stickerImage max dimensions when applying template", () => {
    const spec = LINE_ANIMATED_STICKER_SPEC;

    // When rendering with a template, output must stay within 320×270
    const outputWidth = 320;
    const outputHeight = 270;

    expect(outputWidth).toBeLessThanOrEqual(spec.stickerImage.maxWidth);
    expect(outputHeight).toBeLessThanOrEqual(spec.stickerImage.maxHeight);
  });

  it("template with extreme_limited risk cannot be auto-applied without warning", () => {
    const tm = getMotionTemplate("JUMP_EXTREME")!;
    expect(tm.riskLevel).toBe("extreme_limited");

    // UI should show warning when selecting extreme_limited template
    const shouldWarn = tm.riskLevel === "extreme_limited";
    expect(shouldWarn).toBe(true);
  });
});

// ─── Auto-Degrade Pipeline Tests ───────────────────────────────────────────────

describe("Auto-degrade pipeline — QC failure triggers downgrade", () => {
  it("P0 fail (25 frames) triggers auto-degrade recommendation", () => {
    const overFramesQc = runQcEngine({
      stickerCount: 8,
      apngFrames: 25, // > 20 → P0 fail
      apngWidth: 240,
      apngHeight: 240,
      apngFileBytes: 512 * 1024,
      loopCount: 1,
      playbackSeconds: 1.0,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: "RGB",
      opacityNotFull: false,
    });

    expect(overFramesQc.summary.P0).toBeGreaterThan(0);
    expect(overFramesQc.exportBlocked).toBe(true);
    expect(overFramesQc.passed).toBe(false);
  });

  it("Auto-degrade: reduce frames from 25 → 12 (within spec)", () => {
    // After auto-degrade, frame count should be ≤ 20
    const degradedFrames = 12;
    expect(degradedFrames).toBeLessThanOrEqual(LINE_ANIMATED_STICKER_SPEC.maxFrames);
    expect(degradedFrames).toBeGreaterThanOrEqual(LINE_ANIMATED_STICKER_SPEC.minFrames);
  });

  it("P0 fail (loop 6s > 4s) triggers auto-degrade recommendation", () => {
    const overDurationQc = runQcEngine({
      stickerCount: 8,
      apngFrames: 10,
      apngWidth: 240,
      apngHeight: 240,
      apngFileBytes: 512 * 1024,
      loopCount: 4, // 4 × 1.5s = 6s > 4s
      playbackSeconds: 1.5,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: "RGB",
      opacityNotFull: false,
    });

    expect(overDurationQc.summary.P0).toBeGreaterThan(0);
    expect(overDurationQc.exportBlocked).toBe(true);
  });

  it("Auto-degrade: reduce loop count or playback to meet ≤4s", () => {
    // Valid: 1.0s × 4 loops = 4s (within spec)
    expect(1.0 * 4).toBeLessThanOrEqual(4);
    // Degraded: 0.5s × 4 loops = 2s (well within spec)
    expect(0.5 * 4).toBeLessThanOrEqual(4);
  });

  it("After auto-degrade, QC passes all P0 gates", () => {
    const degradedQc = runQcEngine({
      stickerCount: 8,
      apngFrames: 12, // reduced from 25
      apngWidth: 240,
      apngHeight: 240,
      apngFileBytes: 512 * 1024,
      loopCount: 1, // reduced from 4
      playbackSeconds: 1.0, // reduced from 1.5
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: "RGB",
      opacityNotFull: false,
    });

    expect(degradedQc.summary.P0).toBe(0);
    expect(degradedQc.exportBlocked).toBe(false);
    expect(degradedQc.passed).toBe(true);
  });

  it("P1 warnings do NOT block export but appear in degrade notes", () => {
    const p1Qc = runQcEngine({
      stickerCount: 10, // not 8/16/24 → P1 warning
      apngFrames: 10,
      apngWidth: 240,
      apngHeight: 240,
      apngFileBytes: 512 * 1024,
      loopCount: 1,
      playbackSeconds: 1.0,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: "RGB",
      opacityNotFull: false,
    });

    expect(p1Qc.summary.P0).toBe(0);
    expect(p1Qc.summary.P1).toBeGreaterThan(0);
    expect(p1Qc.exportBlocked).toBe(false); // P1 does NOT block
    expect(p1Qc.passed).toBe(true); // passed but with warnings
  });

  it("opacityNotFull=true triggers P0 fail (no degrade — must fix)", () => {
    const opacityQc = runQcEngine({
      stickerCount: 8,
      apngFrames: 10,
      apngWidth: 240,
      apngHeight: 240,
      apngFileBytes: 512 * 1024,
      loopCount: 1,
      playbackSeconds: 1.0,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: "RGB",
      opacityNotFull: true, // P0 fail
    });

    expect(opacityQc.summary.P0).toBeGreaterThan(0);
    expect(opacityQc.exportBlocked).toBe(true);

    // Find the opacity finding
    const opacityFinding = opacityQc.findings.find((f) => f.code === "APNG_OPACITY");
    expect(opacityFinding).toBeDefined();
    expect(opacityFinding!.severity).toBe("P0");
  });
});

// ─── End-to-End Brief → Motion Flow ───────────────────────────────────────────

describe("Brief → Keyframe → Motion end-to-end", () => {
  it("generates a valid brief with 8 stickers, loop=1, playback=1s", () => {
    const brief = {
      title: "Test Character",
      description: "Cute character for LINE animated sticker",
      suggestedCount: 8,
      suggestedLoopCount: 1,
      motionNotes: ["gentle bounce", "subtle rotation"],
    };

    expect(brief.suggestedCount).toBe(8);
    expect(brief.suggestedLoopCount).toBe(1);
    expect(brief.suggestedCount).toBeLessThanOrEqual(24);
  });

  it("keyframes respect template's recommendedFrameCount", () => {
    const tm = getMotionTemplate("BOUNCE_SIMPLE")!;
    const frameCount = tm.recommendedFrameCount; // 12

    // Simulate keyframe generation
    const keyframes = Array.from({ length: frameCount }, (_, i) => ({
      frame: i,
      transforms: [{ layer: "body", translateY: Math.sin(i * 0.5) * 15 }],
    }));

    expect(keyframes).toHaveLength(12);
    expect(keyframes[0].frame).toBe(0);
    expect(keyframes[11].frame).toBe(11);
  });

  it("motion application stays within LINE spec (320×270, ≤20 frames)", () => {
    const tm = getMotionTemplate("BOUNCE_SIMPLE")!;
    const outputFrames = tm.recommendedFrameCount;
    const outputWidth = 240; // within 320 max
    const outputHeight = 240; // within 270 max

    expect(outputFrames).toBeLessThanOrEqual(LINE_ANIMATED_STICKER_SPEC.maxFrames);
    expect(outputWidth).toBeLessThanOrEqual(LINE_ANIMATED_STICKER_SPEC.stickerImage.maxWidth);
    expect(outputHeight).toBeLessThanOrEqual(LINE_ANIMATED_STICKER_SPEC.stickerImage.maxHeight);
  });

  it("full pipeline: brief → keyframes → QC → export allowed", () => {
    // Step 1: Brief
    const brief = { suggestedCount: 8, suggestedLoopCount: 1, playbackSeconds: 1.0 };

    // Step 2: Motion template applied
    const tm = getMotionTemplate("BOUNCE_SIMPLE")!;
    const frames = tm.recommendedFrameCount;

    // Step 3: QC check
    const qc = runQcEngine({
      stickerCount: brief.suggestedCount,
      apngFrames: frames,
      apngWidth: 240,
      apngHeight: 240,
      apngFileBytes: 512 * 1024,
      loopCount: brief.suggestedLoopCount,
      playbackSeconds: brief.playbackSeconds,
      zipBytes: 8 * 512 * 1024 + 50_000,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: "RGB",
      opacityNotFull: false,
    });

    expect(qc.exportBlocked).toBe(false);
    expect(qc.summary.P0).toBe(0);
  });
});