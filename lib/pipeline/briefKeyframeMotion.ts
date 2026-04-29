/**
 * lib/pipeline/briefKeyframeMotion.ts
 *
 * Brief → Keyframe → Motion template pipeline.
 *
 * Executable data flow:
 *   Brief (title, description, count, loop, motion notes)
 *   → Keyframe generator (respects LINE spec + motion template parameters)
 *   → Motion workspace (applies template keyframes to canvas/timeline/budget)
 *   → Output: rendered sticker metadata ready for QC
 *
 * The pipeline is stateless and deterministic given the same inputs.
 */

import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";
import { getMotionTemplate, MOTION_TEMPLATES } from "@/lib/motion/motionTemplate";
import type { MotionTemplateDefinition } from "@/lib/motion/motionTemplate";

// ─── Brief ─────────────────────────────────────────────────────────────────────

export interface StickerBrief {
  title: string;
  description: string;
  suggestedCount: 8 | 16 | 24;
  suggestedLoopCount: 1 | 2 | 3 | 4;
  playbackSeconds: number;
  motionNotes: string[];
  styleCode?: string;
  provider?: string;
}

export interface BriefValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a brief against LINE spec constraints.
 * Returns errors (must fix) and warnings (recommendations).
 */
export function validateBrief(brief: StickerBrief): BriefValidation {
  const spec = LINE_ANIMATED_STICKER_SPEC;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Count must be 8, 16, or 24
  if (!spec.allowedCounts.includes(brief.suggestedCount)) {
    errors.push(
      `Sticker count ${brief.suggestedCount} is not one of allowed ${spec.allowedCounts.join(", ")}`
    );
  }

  // Loop count must be valid
  if (!spec.allowedLoopCount.includes(brief.suggestedLoopCount)) {
    errors.push(
      `Loop count ${brief.suggestedLoopCount} is not one of allowed ${spec.allowedLoopCount.join(", ")}`
    );
  }

  // Total duration must be ≤ 4s
  const totalSeconds = brief.playbackSeconds * brief.suggestedLoopCount;
  if (totalSeconds > spec.maxTotalLoopSeconds) {
    errors.push(
      `Total loop duration ${totalSeconds.toFixed(2)}s exceeds LINE max ${spec.maxTotalLoopSeconds}s`
    );
  }

  // Playback seconds must be positive
  if (brief.playbackSeconds <= 0) {
    errors.push("playbackSeconds must be > 0");
  }

  // P1 warnings
  if (brief.motionNotes.length === 0) {
    warnings.push("No motion notes provided — recommend at least one motion note");
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Keyframe ─────────────────────────────────────────────────────────────────

export interface KeyframeTransform {
  layer: string;
  translateX?: number;
  translateY?: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
}

export interface Keyframe {
  frame: number;
  transforms: KeyframeTransform[];
}

export interface KeyframeGenerationResult {
  keyframes: Keyframe[];
  frameCount: number;
  templateCode: string;
  templateName: string;
}

/**
 * Generate keyframes for a sticker by applying a motion template.
 *
 * The generated keyframes:
 * - Use the template's recommendedFrameCount as frame budget
 * - Respect the template's layer targets and parameter ranges
 * - Stay within LINE spec bounds (≤20 frames, dimensions ≤ 320×270)
 */
export function generateKeyframes(
  template: MotionTemplateDefinition,
  options?: {
    overrideFrameCount?: number;
    amplitudeScale?: number;
  }
): KeyframeGenerationResult {
  const spec = LINE_ANIMATED_STICKER_SPEC;
  const frameCount = Math.min(
    options?.overrideFrameCount ?? template.recommendedFrameCount,
    spec.maxFrames
  );

  // Interpolate keyframes from template to fill frameCount
  const keyframes = interpolateKeyframes(template.keyframes, frameCount);

  return {
    keyframes,
    frameCount,
    templateCode: template.code,
    templateName: template.name,
  };
}

/**
 * Interpolate template keyframes to fill the target frameCount.
 * Uses linear interpolation for transform properties between template keyframes.
 */
function interpolateKeyframes(
  templateKeyframes: MotionTemplateDefinition["keyframes"],
  targetFrameCount: number
): Keyframe[] {
  if (templateKeyframes.length === 0) return [];
  if (targetFrameCount <= 0) return [];

  // Build a map of frame → transforms
  const frameMap = new Map<number, Keyframe["transforms"]>();
  for (const kf of templateKeyframes) {
    frameMap.set(kf.frame, kf.transforms);
  }

  const result: Keyframe[] = [];

  for (let f = 0; f < targetFrameCount; f++) {
    const t = f / (targetFrameCount - 1); // normalized position [0, 1]
    const interpolated = interpolateTransformsAt(frameMap, templateKeyframes, t);
    result.push({ frame: f, transforms: interpolated });
  }

  return result;
}

function interpolateTransformsAt(
  frameMap: Map<number, Keyframe["transforms"]>,
  templateKeyframes: MotionTemplateDefinition["keyframes"],
  t: number
): Keyframe["transforms"] {
  // Find the two template keyframes to interpolate between
  const sortedKfs = [...templateKeyframes].sort((a, b) => a.frame - b.frame);
  if (sortedKfs.length === 0) return [];
  if (sortedKfs.length === 1) return [...sortedKfs[0].transforms];

  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));

// Map frame range [0, N] → [0, 1]
  const maxFrame = sortedKfs[sortedKfs.length - 1].frame;
  const normalizedFrame = t * maxFrame;

  // Find surrounding keyframes
  let lo = sortedKfs[0];
  let hi = sortedKfs[sortedKfs.length - 1];
  for (let i = 0; i < sortedKfs.length - 1; i++) {
    if (normalizedFrame >= sortedKfs[i].frame && normalizedFrame <= sortedKfs[i + 1].frame) {
      lo = sortedKfs[i];
      hi = sortedKfs[i + 1];
      break;
    }
  }

  // Interpolate
  const span = hi.frame - lo.frame;
  const alpha = span === 0 ? 0 : (normalizedFrame - lo.frame) / span;

  const loTransforms = new Map(lo.transforms.map((t) => [t.layer, t]));
  const hiTransforms = new Map(hi.transforms.map((t) => [t.layer, t]));

  // Collect all unique layers
  const allLayers = new Set([...loTransforms.keys(), ...hiTransforms.keys()]);
  const result: Keyframe["transforms"] = [];

  for (const layer of allLayers) {
    const loT = loTransforms.get(layer);
    const hiT = hiTransforms.get(layer);
    if (!loT && !hiT) continue;

    const merged: KeyframeTransform = { layer };

    // Interpolate numeric fields
    for (const field of ["translateX", "translateY", "rotate", "scaleX", "scaleY", "opacity"] as const) {
      const loVal = loT?.[field] ?? 0;
      const hiVal = hiT?.[field] ?? 0;
      merged[field] = loVal + (hiVal - loVal) * alpha;
      // Clean up zero-ish values
      if (Math.abs(merged[field]!) < 0.0001) merged[field] = 0;
    }

    result.push(merged);
  }

  return result;
}

// ─── Motion Workspace ─────────────────────────────────────────────────────────

export interface MotionWorkspace {
  canvas: { width: number; height: number };
  timeline: { totalFrames: number; fps: number };
  budget: { frameBudget: number; layerCount: number };
  appliedTemplate: MotionTemplateDefinition | null;
  keyframes: Keyframe[];
  warnings: string[];
}

/**
 * Apply a motion template to the workspace, updating canvas/timeline/budget.
 *
 * Canvas: bounded by LINE spec stickerImage max dimensions
 * Timeline: driven by template's recommendedFrameCount (capped at maxFrames)
 * Budget: derived from template's targetLayers count
 */
export function applyMotionTemplate(
  workspace: Partial<MotionWorkspace>,
  template: MotionTemplateDefinition,
  options?: {
    targetWidth?: number;
    targetHeight?: number;
  }
): MotionWorkspace {
  const spec = LINE_ANIMATED_STICKER_SPEC;
  const warnings: string[] = [];

  const maxW = spec.stickerImage.maxWidth;
  const maxH = spec.stickerImage.maxHeight;

  // Use requested dimensions or defaults; then cap to spec
  const rawWidth = options?.targetWidth ?? workspace.canvas?.width ?? maxW;
  const rawHeight = options?.targetHeight ?? workspace.canvas?.height ?? maxH;

  // Detect overflow BEFORE capping
  if (rawWidth > maxW || rawHeight > maxH) {
    warnings.push(
      `Output dimensions ${rawWidth}×${rawHeight} exceed LINE spec — will be capped to ${maxW}×${maxH}`
    );
  }

  const width = Math.min(rawWidth, maxW);
  const height = Math.min(rawHeight, maxH);

  // Timeline: frame budget from template (capped at spec maxFrames)
  const frameBudget = Math.min(template.recommendedFrameCount, spec.maxFrames);

  // Generate keyframes from template
  const { keyframes } = generateKeyframes(template, { overrideFrameCount: frameBudget });

  // Layer count from template target layers
  const layerCount = template.targetLayers.length;

  // Risk level warning for extreme_limited templates
  if (template.riskLevel === "extreme_limited") {
    warnings.push(
      `Template '${template.code}' has risk level 'extreme_limited' — use sparingly`
    );
  }

  return {
    canvas: { width, height },
    timeline: { totalFrames: frameBudget, fps: 10 }, // 10 fps per LINE spec playback interpretation
    budget: { frameBudget, layerCount },
    appliedTemplate: template,
    keyframes,
    warnings,
  };
}

// ─── Full Pipeline ────────────────────────────────────────────────────────────

export interface PipelineResult {
  brief: StickerBrief;
  briefValidation: BriefValidation;
  keyframes: Keyframe[];
  workspace: MotionWorkspace;
  qcReadyMetadata: {
    stickerCount: number;
    apngFrames: number;
    apngWidth: number;
    apngHeight: number;
    loopCount: number;
    playbackSeconds: number;
  };
  errors: string[];
}

/**
 * Run the full brief → keyframe → motion pipeline.
 *
 * Steps:
 * 1. Validate brief against LINE spec
 * 2. Pick motion template from notes (or default to BOUNCE_SIMPLE)
 * 3. Apply template to workspace
 * 4. Generate keyframes
 * 5. Assemble QC-ready metadata
 */
export function runBriefKeyframeMotionPipeline(
  brief: StickerBrief,
  overrideTemplateCode?: string
): PipelineResult {
  const errors: string[] = [];
  const spec = LINE_ANIMATED_STICKER_SPEC;

  // Step 1: Validate
  const briefValidation = validateBrief(brief);
  if (!briefValidation.valid) {
    errors.push(...briefValidation.errors);
  }

  // Step 2: Select template
  let template: MotionTemplateDefinition | undefined;
  if (overrideTemplateCode) {
    template = getMotionTemplate(overrideTemplateCode);
    if (!template) {
      errors.push(`Unknown motion template code: ${overrideTemplateCode}`);
    }
  }

  // Try to match template from motion notes keywords
  if (!template && brief.motionNotes.length > 0) {
    template = matchTemplateFromNotes(brief.motionNotes);
  }

  // Fallback to BOUNCE_SIMPLE
  if (!template) {
    template = getMotionTemplate("BOUNCE_SIMPLE");
  }

  if (!template) {
    errors.push("No valid motion template found");
    return {
      brief,
      briefValidation,
      keyframes: [],
      workspace: {
        canvas: { width: 0, height: 0 },
        timeline: { totalFrames: 0, fps: 10 },
        budget: { frameBudget: 0, layerCount: 0 },
        appliedTemplate: null,
        keyframes: [],
        warnings: [],
      },
      qcReadyMetadata: {
        stickerCount: brief.suggestedCount,
        apngFrames: 0,
        apngWidth: 0,
        apngHeight: 0,
        loopCount: brief.suggestedLoopCount,
        playbackSeconds: brief.playbackSeconds,
      },
      errors,
    };
  }

  // Step 3: Apply template to workspace
  const workspace = applyMotionTemplate(
    { canvas: { width: spec.stickerImage.maxWidth, height: spec.stickerImage.maxHeight } },
    template,
    {}
  );

  // Step 4: Keyframes already computed in applyMotionTemplate
  const keyframes = workspace.keyframes;

  // Step 5: QC-ready metadata
  const qcReadyMetadata = {
    stickerCount: brief.suggestedCount,
    apngFrames: workspace.timeline.totalFrames,
    apngWidth: workspace.canvas.width,
    apngHeight: workspace.canvas.height,
    loopCount: brief.suggestedLoopCount,
    playbackSeconds: brief.playbackSeconds,
  };

  return {
    brief,
    briefValidation,
    keyframes,
    workspace,
    qcReadyMetadata,
    errors,
  };
}

/**
 * Match a motion template from brief motion notes keywords.
 */
export function matchTemplateFromNotes(
  notes: string[],
  availableTemplates = MOTION_TEMPLATES
): MotionTemplateDefinition | undefined {
  const keywords: Record<string, string[]> = {
    BOUNCE_SIMPLE: ["bounce", "jump", "hop", "spring"],
    ROTATION_SWING: ["rotate", "rotation", "swing", "turn", "spin"],
    BLINK_REPEAT: ["blink", "wink", "eye"],
    WAVE_EXPRESSIVE: ["wave", "arm", "hand"],
    JUMP_EXTREME: ["extreme", "flip", "backflip", "somersault"],
  };

  for (const note of notes) {
    const lower = note.toLowerCase();
    for (const [code, kws] of Object.entries(keywords)) {
      if (kws.some((kw) => lower.includes(kw))) {
        const tm = getMotionTemplate(code);
        if (tm) return tm;
      }
    }
  }

  return undefined;
}

/** Validate a brief against LINE spec constraints */
export function validateBriefExportMetadata(params: {
  stickerCount: number;
  apngFrames: number;
  apngWidth: number;
  apngHeight: number;
  loopCount: number;
  playbackSeconds: number;
}): { valid: boolean; errors: string[] } {
  const spec = LINE_ANIMATED_STICKER_SPEC;
  const errors: string[] = [];

  if (!(spec.allowedCounts as readonly number[]).includes(params.stickerCount)) {
    errors.push(`stickerCount ${params.stickerCount} not in ${spec.allowedCounts}`);
  }
  if (params.apngFrames > spec.maxFrames) {
    errors.push(`apngFrames ${params.apngFrames} > max ${spec.maxFrames}`);
  }
  if (params.apngFrames < spec.minFrames) {
    errors.push(`apngFrames ${params.apngFrames} < min ${spec.minFrames}`);
  }
  if (params.apngWidth > spec.stickerImage.maxWidth) {
    errors.push(`apngWidth ${params.apngWidth} > max ${spec.stickerImage.maxWidth}`);
  }
  if (params.apngHeight > spec.stickerImage.maxHeight) {
    errors.push(`apngHeight ${params.apngHeight} > max ${spec.stickerImage.maxHeight}`);
  }
  if (params.playbackSeconds * params.loopCount > spec.maxTotalLoopSeconds) {
    errors.push(`total loop duration exceeds ${spec.maxTotalLoopSeconds}s`);
  }

  return { valid: errors.length === 0, errors };
}