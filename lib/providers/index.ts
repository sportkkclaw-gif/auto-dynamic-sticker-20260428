/**
 * lib/providers/index.ts
 *
 * Provider abstraction for AUTO動態貼圖.
 * Each provider has a mock implementation and an external implementation interface.
 * When AI keys are absent, mock implementations are used.
 */

export type StyleAnalysisResult = {
  dominantColors: string[];
  styleTags: string[];
  confidence: number;
};

export abstract class StyleAnalysisProvider {
  abstract analyze(imageBase64: string): Promise<StyleAnalysisResult>;
}

export class MockStyleAnalysisProvider extends StyleAnalysisProvider {
  async analyze(): Promise<StyleAnalysisResult> {
    return {
      dominantColors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
      styleTags: ["cute", "colorful", "minimal"],
      confidence: 0.85,
    };
  }
}

export type BriefResult = {
  title: string;
  description: string;
  suggestedCount: number;
  suggestedLoopCount: number;
  motionNotes: string[];
};

export abstract class BriefGenerationProvider {
  abstract generate(characterDescription: string, style: string): Promise<BriefResult>;
}

export class MockBriefGenerationProvider extends BriefGenerationProvider {
  async generate(characterDescription: string, _style: string): Promise<BriefResult> {
    return {
      title: `AUTO動態貼圖 — ${characterDescription.slice(0, 30)}`,
      description: `Auto-generated brief for ${characterDescription}`,
      suggestedCount: 8,
      suggestedLoopCount: 1,
      motionNotes: ["gentle bounce", "subtle rotation"],
    };
  }
}

export type KeyframeResult = {
  frameDataList: Array<{
    frameIndex: number;
    transform: {
      translateX: number;
      translateY: number;
      rotate: number;
      scaleX: number;
      scaleY: number;
      opacity: number;
    };
  }>;
};

export abstract class KeyframeGenerationProvider {
  abstract generate(count: number, motionTemplate: string): Promise<KeyframeResult>;
}

export class MockKeyframeGenerationProvider extends KeyframeGenerationProvider {
  async generate(count: number, _motionTemplate: string): Promise<KeyframeResult> {
    const frameDataList = Array.from({ length: count }, (_, i) => ({
      frameIndex: i,
      transform: {
        translateX: Math.sin(i * 0.5) * 10,
        translateY: Math.cos(i * 0.5) * 5,
        rotate: i * 3,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      },
    }));
    return { frameDataList };
  }
}

export type BackgroundRemovalResult = {
  processedImageBase64: string;
  maskBase64?: string;
};

export abstract class BackgroundRemovalProvider {
  abstract remove(imageBase64: string): Promise<BackgroundRemovalResult>;
}

export class MockBackgroundRemovalProvider extends BackgroundRemovalProvider {
  async remove(imageBase64: string): Promise<BackgroundRemovalResult> {
    return { processedImageBase64: imageBase64 };
  }
}

export type ApngRenderResult = {
  apngBase64: string;
  frameCount: number;
  width: number;
  height: number;
  fileBytes: number;
  hasTransparency: boolean;
  colorSpace: string;
};

export abstract class ApngRenderProvider {
  abstract render(frames: Array<{ imageBase64: string; delay: number }>, options: {
    width: number;
    height: number;
    loopCount: number;
  }): Promise<ApngRenderResult>;
}

export class DeterministicApngRenderProvider extends ApngRenderProvider {
  async render(
    frames: Array<{ imageBase64: string; delay: number }>,
    options: { width: number; height: number; loopCount: number }
  ): Promise<ApngRenderResult> {
    // Returns minimal valid placeholder APNG metadata
    // Real implementation would use apngasm or similar
    const totalFrames = frames.length;
    const totalBytes = options.width * options.height * totalFrames * 4;
    return {
      apngBase64: "", // placeholder
      frameCount: totalFrames,
      width: options.width,
      height: options.height,
      fileBytes: Math.min(totalBytes, 1_048_576),
      hasTransparency: true,
      colorSpace: "RGB",
    };
  }
}
