/**
 * lib/qc/qcEngine.test.ts
 *
 * Regression tests for runQcEngine Gate 0–4 behavior.
 * Tests P0 failure conditions and exportBlocked flag.
 */

import { describe, it, expect } from 'vitest';
import { runQcEngine } from "../qc/qcEngine";

type QcParams = Parameters<typeof runQcEngine>[0];

const BASE_PARAMS: Omit<QcParams, 'apngFrames' | 'opacityNotFull'> = {
  stickerCount: 8,
  apngWidth: 320,
  apngHeight: 270,
  apngFileBytes: 512 * 1024,
  loopCount: 1,
  playbackSeconds: 1.0,
  zipBytes: 5 * 1024 * 1024,
  mainImageWidth: 240,
  mainImageHeight: 240,
  tabImageWidth: 96,
  tabImageHeight: 74,
  hasTransparentBackground: true,
  colorSpace: 'RGB',
};

function run(params: Partial<QcParams>): ReturnType<typeof runQcEngine> {
  return runQcEngine({ ...BASE_PARAMS, ...params });
}

// ─── Gate 0: APNG frame count > 20 → P0 fail, exportBlocked=true ─────────────

describe('Gate 0 — APNG frame count', () => {
  it('PASS: 20 frames is acceptable (boundary)', () => {
    const r = runQcEngine({
      stickerCount: 8,
      apngFrames: 20,
      apngWidth: 320,
      apngHeight: 270,
      apngFileBytes: 512 * 1024,
      loopCount: 1,
      playbackSeconds: 1.0,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: 'RGB',
      opacityNotFull: false,
    });
    expect(r.passed).toBe(true);
    expect(r.exportBlocked).toBe(false);
    expect(r.summary.P0).toBe(0);
  });

  it('FAIL: 21 frames → P0 fail', () => {
    const r = runQcEngine({
      stickerCount: 8,
      apngFrames: 21,
      apngWidth: 320,
      apngHeight: 270,
      apngFileBytes: 512 * 1024,
      loopCount: 1,
      playbackSeconds: 1.0,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: 'RGB',
      opacityNotFull: false,
    });
    expect(r.passed).toBe(false);
    expect(r.exportBlocked).toBe(true);
    expect(r.summary.P0).toBeGreaterThan(0);
    const f0 = r.findings.find((f) => f.code === 'APNG_FRAME_COUNT');
    expect(f0).toBeDefined();
    expect(f0?.severity).toBe('P0');
  });

  it('FAIL: 100 frames → P0 fail with correct detail', () => {
    const r = runQcEngine({
      stickerCount: 8,
      apngFrames: 100,
      apngWidth: 320,
      apngHeight: 270,
      apngFileBytes: 512 * 1024,
      loopCount: 1,
      playbackSeconds: 1.0,
      zipBytes: 5 * 1024 * 1024,
      mainImageWidth: 240,
      mainImageHeight: 240,
      tabImageWidth: 96,
      tabImageHeight: 74,
      hasTransparentBackground: true,
      colorSpace: 'RGB',
      opacityNotFull: false,
    });
    expect(r.exportBlocked).toBe(true);
    const f = r.findings.find((f) => f.code === 'APNG_FRAME_COUNT');
    expect(f?.detail).toContain('maxFrames=20');
  });
});

// ─── Gate 1: opacityNotFull → P0 fail, exportBlocked=true ───────────────────

describe('Gate 1 — opacityNotFull', () => {
  it('PASS: opacityNotFull=false (all frames full opacity)', () => {
    const r = run({ opacityNotFull: false });
    expect(r.passed).toBe(true);
    expect(r.exportBlocked).toBe(false);
    expect(r.summary.P0).toBe(0);
  });

  it('FAIL: opacityNotFull=true → P0 fail', () => {
    const r = run({ opacityNotFull: true });
    expect(r.passed).toBe(false);
    expect(r.exportBlocked).toBe(true);
    expect(r.summary.P0).toBeGreaterThan(0);
    const f0 = r.findings.find((f) => f.code === 'APNG_OPACITY');
    expect(f0).toBeDefined();
    expect(f0?.severity).toBe('P0');
  });

  it('FAIL: opacityNotFull=true report detail contains opacityNotFull flag', () => {
    const r = run({ opacityNotFull: true });
    const f = r.findings.find((f) => f.code === 'APNG_OPACITY');
    expect(f?.detail).toContain('opacityNotFull=true');
  });
});

// ─── Gate 2: exportBlocked=true when any P0 fails (combined) ────────────────

describe('Gate 2 — exportBlocked when P0 findings exist', () => {
  it('exportBlocked=false when all checks pass', () => {
    const r = run({ apngFrames: 10, opacityNotFull: false });
    expect(r.exportBlocked).toBe(false);
    expect(r.passed).toBe(true);
  });

  it('exportBlocked=true when opacityNotFull is the only P0', () => {
    const r = run({ opacityNotFull: true, apngFrames: 5 });
    expect(r.exportBlocked).toBe(true);
    expect(r.summary.P0).toBe(1);
  });

  it('exportBlocked=true when frameCount>20 is the only P0', () => {
    const r = run({ apngFrames: 25, opacityNotFull: false });
    expect(r.exportBlocked).toBe(true);
    expect(r.summary.P0).toBe(1);
  });

  it('exportBlocked=true when both P0 conditions exist', () => {
    const r = run({ apngFrames: 25, opacityNotFull: true });
    expect(r.exportBlocked).toBe(true);
    expect(r.summary.P0).toBe(2);
  });
});

// ─── Gate 3: findings include correct code + severity for opacity ───────────

describe('Gate 3 — APNG_OPACITY finding correctness', () => {
  it('generates APNG_OPACITY code with P0 severity', () => {
    const r = run({ opacityNotFull: true });
    const f = r.findings.find((f) => f.code === 'APNG_OPACITY');
    expect(f).toBeDefined();
    expect(f?.severity).toBe('P0');
    expect(typeof f?.message).toBe('string');
    expect(typeof f?.detail).toBe('string');
  });
});

// ─── Gate 4: P0 summary counts are accurate ────────────────────────────────

describe('Gate 4 — summary P0 count accuracy', () => {
  it('summary.P0=0 when no P0 findings', () => {
    const r = run({ apngFrames: 5, opacityNotFull: false });
    expect(r.summary.P0).toBe(0);
    expect(r.summary.passedChecks).toBeGreaterThan(0);
  });

  it('summary.P0=1 when exactly one P0 condition is met', () => {
    const r = run({ apngFrames: 50 });
    expect(r.summary.P0).toBe(1);
  });

  it('summary.totalChecks is a fixed constant (11 checks)', () => {
    const r = run({ apngFrames: 5 });
    expect(r.summary.totalChecks).toBe(11);
  });

  it('passedChecks = totalChecks - P0 - P1 - P2', () => {
    const r = run({ apngFrames: 50 });
    const { passedChecks, totalChecks, P0, P1, P2 } = r.summary;
    expect(passedChecks).toBe(totalChecks - P0 - P1 - P2);
  });
});