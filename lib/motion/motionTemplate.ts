/**
 * lib/motion/motionTemplate.ts
 *
 * Motion template definition as an executable data structure.
 * Motion Workspace must依 template definition 更新 canvas/timeline/budget.
 */

export type MotionRiskLevel = "stable" | "expressive" | "extreme_limited";

export type MotionTemplateDefinition = {
  code: string;
  name: string;
  description: string;
  targetLayers: string[];
  parameters: {
    amplitude?: { min: number; max: number; default: number };
    frequency?: { min: number; max: number; default: number };
    phase?: { min: number; max: number; default: number };
    easing?: string[];
  };
  keyframes: Array<{
    frame: number;
    transforms: Array<{
      layer: string;
      translateX?: number;
      translateY?: number;
      rotate?: number;
      scaleX?: number;
      scaleY?: number;
      opacity?: number;
    }>;
  }>;
  recommendedFrameCount: number;
  riskLevel: MotionRiskLevel;
};

export const MOTION_TEMPLATES: MotionTemplateDefinition[] = [
  {
    code: "BOUNCE_SIMPLE",
    name: "Simple Bounce",
    description: "Gentle vertical bounce with subtle squash and stretch",
    targetLayers: ["body"],
    parameters: {
      amplitude: { min: 5, max: 30, default: 15 },
      frequency: { min: 0.5, max: 4, default: 1 },
      phase: { min: 0, max: 360, default: 0 },
      easing: ["ease-in-out", "ease-out"],
    },
    keyframes: [
      { frame: 0, transforms: [{ layer: "body", translateY: 0, scaleX: 1, scaleY: 1 }] },
      { frame: 4, transforms: [{ layer: "body", translateY: -15, scaleX: 1.05, scaleY: 0.95 }] },
      { frame: 8, transforms: [{ layer: "body", translateY: 0, scaleX: 0.95, scaleY: 1.05 }] },
      { frame: 12, transforms: [{ layer: "body", translateY: 0, scaleX: 1, scaleY: 1 }] },
    ],
    recommendedFrameCount: 12,
    riskLevel: "stable",
  },
  {
    code: "ROTATION_SWING",
    name: "Rotation Swing",
    description: "Smooth pendulum-like rotation around center",
    targetLayers: ["body"],
    parameters: {
      amplitude: { min: 10, max: 90, default: 30 },
      frequency: { min: 0.5, max: 3, default: 1 },
      phase: { min: 0, max: 360, default: 0 },
      easing: ["ease-in-out"],
    },
    keyframes: [
      { frame: 0, transforms: [{ layer: "body", rotate: 0 }] },
      { frame: 5, transforms: [{ layer: "body", rotate: -30 }] },
      { frame: 10, transforms: [{ layer: "body", rotate: 0 }] },
      { frame: 15, transforms: [{ layer: "body", rotate: 30 }] },
      { frame: 20, transforms: [{ layer: "body", rotate: 0 }] },
    ],
    recommendedFrameCount: 20,
    riskLevel: "stable",
  },
  {
    code: "BLINK_REPEAT",
    name: "Blink Repeat",
    description: "Character eyes blink repeatedly",
    targetLayers: ["eyes"],
    parameters: {
      amplitude: { min: 80, max: 100, default: 95 },
      frequency: { min: 1, max: 3, default: 2 },
      phase: { min: 0, max: 360, default: 0 },
      easing: ["linear"],
    },
    keyframes: [
      { frame: 0, transforms: [{ layer: "eyes", scaleY: 1 }] },
      { frame: 3, transforms: [{ layer: "eyes", scaleY: 0.05 }] },
      { frame: 6, transforms: [{ layer: "eyes", scaleY: 1 }] },
      { frame: 12, transforms: [{ layer: "eyes", scaleY: 1 }] },
    ],
    recommendedFrameCount: 12,
    riskLevel: "stable",
  },
  {
    code: "WAVE_EXPRESSIVE",
    name: "Wave Expressive",
    description: "Full body wave with arm movement - expressive style",
    targetLayers: ["body", "arm-left", "arm-right"],
    parameters: {
      amplitude: { min: 10, max: 60, default: 40 },
      frequency: { min: 0.5, max: 3, default: 1 },
      phase: { min: 0, max: 360, default: 0 },
      easing: ["ease-in-out"],
    },
    keyframes: [
      { frame: 0, transforms: [{ layer: "body", rotate: 0 }, { layer: "arm-left", rotate: 0 }, { layer: "arm-right", rotate: 0 }] },
      { frame: 5, transforms: [{ layer: "body", rotate: 10, translateY: -5 }, { layer: "arm-left", rotate: -20 }, { layer: "arm-right", rotate: 45 }] },
      { frame: 10, transforms: [{ layer: "body", rotate: -5 }, { layer: "arm-left", rotate: -40 }, { layer: "arm-right", rotate: 20 }] },
      { frame: 15, transforms: [{ layer: "body", rotate: 5 }, { layer: "arm-left", rotate: -10 }, { layer: "arm-right", rotate: 30 }] },
      { frame: 20, transforms: [{ layer: "body", rotate: 0 }, { layer: "arm-left", rotate: 0 }, { layer: "arm-right", rotate: 0 }] },
    ],
    recommendedFrameCount: 20,
    riskLevel: "expressive",
  },
  {
    code: "JUMP_EXTREME",
    name: "Extreme Jump",
    description: "High jump with exaggerated squash and stretch - use sparingly",
    targetLayers: ["body"],
    parameters: {
      amplitude: { min: 30, max: 80, default: 60 },
      frequency: { min: 0.3, max: 2, default: 0.8 },
      phase: { min: 0, max: 360, default: 0 },
      easing: ["ease-out"],
    },
    keyframes: [
      { frame: 0, transforms: [{ layer: "body", translateY: 0, scaleX: 1, scaleY: 1 }] },
      { frame: 2, transforms: [{ layer: "body", translateY: 5, scaleX: 1.2, scaleY: 0.8 }] },
      { frame: 5, transforms: [{ layer: "body", translateY: -60, scaleX: 0.9, scaleY: 1.1 }] },
      { frame: 8, transforms: [{ layer: "body", translateY: -70, scaleX: 0.85, scaleY: 1.15 }] },
      { frame: 11, transforms: [{ layer: "body", translateY: -30, scaleX: 0.95, scaleY: 1.05 }] },
      { frame: 15, transforms: [{ layer: "body", translateY: 10, scaleX: 1.15, scaleY: 0.85 }] },
      { frame: 20, transforms: [{ layer: "body", translateY: 0, scaleX: 1, scaleY: 1 }] },
    ],
    recommendedFrameCount: 20,
    riskLevel: "extreme_limited",
  },
];

export function getMotionTemplate(code: string): MotionTemplateDefinition | undefined {
  return MOTION_TEMPLATES.find((t) => t.code === code);
}
