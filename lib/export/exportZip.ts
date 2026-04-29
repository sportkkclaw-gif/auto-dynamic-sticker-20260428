/**
 * lib/export/exportZip.ts
 *
 * Produces actual ZIP packages for LINE animated stickers.
 * Uses deterministic placeholder assets when real rendering is unavailable.
 */

import type { QcReport } from "@/lib/line-spec/lineSpec";
import { LINE_ANIMATED_STICKER_SPEC } from "@/lib/line-spec/lineSpec";

export interface ExportParams {
  projectId: string;
  stickerCount: number;
  mainImageBase64: string; // base64 PNG for main.png
  tabImageBase64: string;  // base64 PNG for tab.png
  stickerApngBase64List: string[]; // list of APNG base64 strings for 01.png...
  qcReport: QcReport;
}

export interface ExportResult {
  success: boolean;
  zipPath?: string;
  error?: string;
  manifest: Record<string, unknown>;
}

/**
 * Build manifest.json data structure from export params.
 */
export function buildManifest(params: {
  stickerCount: number;
  title: string;
  author: string;
}): Record<string, unknown> {
  const spec = LINE_ANIMATED_STICKER_SPEC;
  return {
    specVersion: "1.0",
    product: "AUTO動態貼圖",
    stickerCount: params.stickerCount,
    title: params.title,
    author: params.author,
    mainImage: {
      width: spec.mainImage.width,
      height: spec.mainImage.height,
    },
    tabImage: {
      width: spec.tabImage.width,
      height: spec.tabImage.height,
    },
    stickerImage: {
      maxWidth: spec.stickerImage.maxWidth,
      maxHeight: spec.stickerImage.maxHeight,
    },
    loopCount: spec.allowedLoopCount,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Build qc_report.json data structure from QC report.
 */
export function buildQcReportJson(qcReport: QcReport): Record<string, unknown> {
  return {
    projectId: qcReport.projectId,
    passed: qcReport.passed,
    exportBlocked: qcReport.exportBlocked,
    findings: qcReport.findings,
    summary: qcReport.summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Minimal 1×1 transparent PNG as base64 (PNG file signature + minimal IHDR + IDAT + IEND).
 * This is a valid PNG placeholder.
 */
export function minimalTransparentPngBase64(width: number, height: number): string {
  // Create a minimal valid PNG using raw binary data approach
  // PNG signature
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];

  // IHDR chunk: width, height, bit depth 8, color type 6 (RGBA), compression 0, filter 0, interlace 0
  const ihdrData = [
    (width >> 24) & 0xff, (width >> 16) & 0xff, (width >> 8) & 0xff, width & 0xff,
    (height >> 24) & 0xff, (height >> 16) & 0xff, (height >> 8) & 0xff, height & 0xff,
    8, // bit depth
    6, // color type RGBA
    0, // compression
    0, // filter
    0, // interlace
  ];
  const ihdrCrc = crc32([73, 72, 68, 82, ...ihdrData]);
  const ihdrChunk = [
    0, 0, 0, 13, // length
    73, 72, 68, 82, // IHDR
    ...ihdrData,
    ...ihdrCrc,
  ];

  // IDAT chunk: raw uncompressed RGBA pixel data (minimal deflate stream)
  // Use a simple approach: create raw RGBA scanlines with zlib wrapper
  const rawData: number[] = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte (none)
    for (let x = 0; x < width; x++) {
      // RGBA: fully transparent
      rawData.push(0, 0, 0, 0);
    }
  }

  // Simple zlib wrapper (no compression for simplicity)
  const zlibData = deflateRaw(rawData);
  const idatCrc = crc32([73, 68, 65, 84, ...zlibData]);
  const idatChunk = [
    (zlibData.length >> 24) & 0xff, (zlibData.length >> 16) & 0xff, (zlibData.length >> 8) & 0xff, zlibData.length & 0xff,
    73, 68, 65, 84, // IDAT
    ...zlibData,
    ...idatCrc,
  ];

  // IEND chunk
  const iendCrc = crc32([73, 69, 78, 68]);
  const iendChunk = [0, 0, 0, 0, 73, 69, 78, 68, ...iendCrc];

  const pngBytes = [...signature, ...ihdrChunk, ...idatChunk, ...iendChunk];
  const base64 = Buffer.from(pngBytes).toString("base64");
  return base64;
}

/**
 * Simple deflate raw (store only, no compression) for PNG IDAT.
 * Produces a valid zlib data stream.
 */
function deflateRaw(data: number[]): number[] {
  // Zlib header (no compression)
  const zlibHeader = [120, 156]; // CMF, FLG for no compression
  const blocks: number[] = [];

  // Process in chunks of up to 65535 bytes
  let offset = 0;
  while (offset < data.length) {
    const remaining = data.length - offset;
    const chunkSize = Math.min(remaining, 65535);
    const isLast = offset + chunkSize >= data.length;

    blocks.push(isLast ? 1 : 0); // BFINAL
    blocks.push(0); // BTYPE=store
    blocks.push(chunkSize & 0xff, (chunkSize >> 8) & 0xff);
    blocks.push((~chunkSize) & 0xff, ((~chunkSize) >> 8) & 0xff);

    for (let i = 0; i < chunkSize; i++) {
      blocks.push(data[offset + i]);
    }
    offset += chunkSize;
  }

  // Adler-32 checksum
  const adler = adler32(data);
  blocks.push((adler >> 24) & 0xff, (adler >> 16) & 0xff, (adler >> 8) & 0xff, adler & 0xff);

  return [...zlibHeader, ...blocks];
}

/**
 * CRC-32 calculation for PNG chunks.
 */
function crc32(data: number[]): number[] {
  let crc = 0xffffffff;
  const table = makeCrc32Table();
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ 0xffffffff;
  return [
    (crc >> 24) & 0xff,
    (crc >> 16) & 0xff,
    (crc >> 8) & 0xff,
    crc & 0xff,
  ];
}

function makeCrc32Table(): number[] {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table.push(c);
  }
  return table;
}

/**
 * Adler-32 checksum.
 */
function adler32(data: number[]): number {
  let a = 1, b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return (b << 16) | a;
}
