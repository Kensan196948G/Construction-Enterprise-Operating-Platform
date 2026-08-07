/**
 * Dependency-free favicon generator.
 *
 * Rasterises the CEOP crane mark into RGBA buffers at 16/32/48 px, encodes
 * them as PNG (zlib + CRC32) and packs them into a multi-size ICO file.
 * Outputs are written to src/web/static/favicon.ico (plus PNGs for reference).
 *
 * Run: node --experimental-strip-types scripts/generate-favicon.ts
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const STATIC_DIR = join(fileURLToPath(import.meta.url), "..", "..", "src", "web", "static");

// ---------------------------------------------------------------------------
// Rasterizer (shapes are the same geometry as src/web/static/favicon.svg)
// ---------------------------------------------------------------------------

interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

const SEGMENTS: readonly Segment[] = [
  { x1: 24, y1: 52, x2: 24, y2: 16 }, // mast
  { x1: 16, y1: 16, x2: 48, y2: 16 }, // jib
  { x1: 24, y1: 26, x2: 38, y2: 26 }, // tie
  { x1: 38, y1: 26, x2: 38, y2: 40 }, // cable
  { x1: 30, y1: 40, x2: 46, y2: 40 }, // hook bar
  { x1: 38, y1: 40, x2: 32, y2: 47 }, // hook left
  { x1: 38, y1: 40, x2: 44, y2: 47 }, // hook right
];

function distToSegment(px: number, py: number, s: Segment): number {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / lenSq));
  const cx = s.x1 + t * dx;
  const cy = s.y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function roundedRectDist(px: number, py: number, half: number, radius: number): number {
  const dx = Math.max(Math.abs(px - half) - (half - radius), 0);
  const dy = Math.max(Math.abs(py - half) - (half - radius), 0);
  return Math.hypot(dx, dy) - radius;
}

function draw(size: number): Buffer {
  const scale = size / 64;
  const buf = Buffer.alloc(size * size * 4);
  const half = size / 2;
  const radius = Math.max(1, Math.round(size * 0.22));
  const strokeHalf = Math.max(0.6, (size * 0.07) / 2);
  const segments = SEGMENTS.map((s) => ({
    x1: s.x1 * scale,
    y1: s.y1 * scale,
    x2: s.x2 * scale,
    y2: s.y2 * scale,
  }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const idx = (y * size + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      if (roundedRectDist(px, py, half, radius) <= 0) {
        r = 0xd9;
        g = 0x77;
        b = 0x57;
        a = 255;
      }
      const stroke = segments.some((s) => distToSegment(px, py, s) <= strokeHalf);
      if (stroke) {
        r = 255;
        g = 255;
        b = 255;
        a = 255;
      }
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = a;
    }
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Minimal PNG encoder (RGBA, 8-bit)
// ---------------------------------------------------------------------------

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size: number, rgba: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// ICO packing (PNG-compressed entries; supported by Vista+ and all modern OSes)
// ---------------------------------------------------------------------------

function encodeIco(images: readonly { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry, png);
  }
  return Buffer.concat([header, ...entries]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const sizes = [16, 32, 48] as const;
mkdirSync(STATIC_DIR, { recursive: true });
const images = sizes.map((size) => ({ size, png: encodePng(size, draw(size)) }));
for (const { size, png } of images) {
  writeFileSync(join(STATIC_DIR, `favicon-${size}.png`), png);
}
writeFileSync(join(STATIC_DIR, "favicon.ico"), encodeIco(images));
console.error(`[favicon] wrote favicon.ico + ${sizes.map((s) => `favicon-${s}.png`).join(", ")}`);
