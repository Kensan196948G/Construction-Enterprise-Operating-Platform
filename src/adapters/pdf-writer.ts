// FILE: src/adapters/pdf-writer.ts
/**
 * Shared PDF-writing primitives for `pdf-report-adapter.ts` and
 * `audit-report-adapter.ts`.
 *
 * This module holds the parts of the original single-record PDF adapter
 * (issue #71) that are document-shape-agnostic: the embedded CJK font, the
 * page/cursor bookkeeping ("Writer"), and the basic drawing primitives
 * (title, section heading, label/value field, wrapped multi-line field).
 * It was extracted rather than duplicated so that a second document type
 * (the audit/compliance/management-review quarterly summary, issue #85)
 * does not carry its own copy of the font-embedding logic.
 *
 * Extraction is behavior-preserving: every function here has the exact same
 * implementation it had inline in `pdf-report-adapter.ts` before the split.
 * See that file's header comment for the font-choice rationale (pdf-lib +
 * fontkit + bundled IPA Gothic).
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";
import { type PDFFont, type PDFPage, PDFDocument, rgb } from "pdf-lib";

const JAPANESE_FONT_PATH = fileURLToPath(new URL("./assets/fonts/ipag.ttf", import.meta.url));

/** Lazily read + cache the embedded font's bytes; the file never changes at runtime. */
let cachedFontBytes: Buffer | undefined;
function loadJapaneseFontBytes(): Buffer {
  cachedFontBytes ??= readFileSync(JAPANESE_FONT_PATH);
  return cachedFontBytes;
}

export const PAGE_WIDTH = 595.28; // A4 portrait, in PDF points (72 dpi).
export const PAGE_HEIGHT = 841.89;
export const MARGIN = 48;
export const LINE_HEIGHT = 16;
export const LABEL_WIDTH = 150;
export const BODY_SIZE = 10;
export const TITLE_SIZE = 16;
export const MAX_LINE_CHARS = 78;

export interface Writer {
  readonly doc: PDFDocument;
  readonly font: PDFFont;
  readonly bold: PDFFont;
  page: PDFPage;
  y: number;
}

export async function createWriter(): Promise<Writer> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setProducer("Construction Enterprise Operating Platform");
  doc.setCreator("Construction Enterprise Operating Platform");
  // IPA Gothic has no bold weight, so the same embedded font is used for
  // both regular and "bold" (heading) text — see the file-level comment.
  const font = await doc.embedFont(loadJapaneseFontBytes(), { subset: true });
  const bold = font;
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { doc, font, bold, page, y: PAGE_HEIGHT - MARGIN };
}

export function ensureSpace(writer: Writer, lines = 1): void {
  if (writer.y - lines * LINE_HEIGHT < MARGIN) {
    writer.page = writer.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    writer.y = PAGE_HEIGHT - MARGIN;
  }
}

export function writeTitle(writer: Writer, text: string): void {
  ensureSpace(writer, 2);
  writer.page.drawText(text, {
    x: MARGIN,
    y: writer.y,
    size: TITLE_SIZE,
    font: writer.bold,
    color: rgb(0, 0, 0),
  });
  writer.y -= TITLE_SIZE + LINE_HEIGHT;
}

export function writeSectionHeading(writer: Writer, text: string): void {
  ensureSpace(writer, 1);
  writer.y -= LINE_HEIGHT * 0.4;
  ensureSpace(writer, 1);
  writer.page.drawText(text, {
    x: MARGIN,
    y: writer.y,
    size: BODY_SIZE + 1,
    font: writer.bold,
  });
  writer.y -= LINE_HEIGHT;
}

/** Split long text into fixed-width chunks so it wraps onto multiple lines. */
export function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) {
    return [""];
  }
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    // A single "word" longer than the line width (common once Japanese
    // sentences are treated as one unbroken token) is hard-split instead of
    // overflowing the page.
    let remaining = word;
    while (remaining.length > maxChars) {
      if (current.length > 0) {
        lines.push(current);
        current = "";
      }
      lines.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars);
    }
    const candidate = current.length === 0 ? remaining : `${current} ${remaining}`;
    if (candidate.length > maxChars) {
      lines.push(current);
      current = remaining;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0 || lines.length === 0) {
    lines.push(current);
  }
  return lines;
}

export function writeField(
  writer: Writer,
  label: string,
  value: string | number | boolean | undefined,
): void {
  const text = value === undefined || value === "" ? "-" : String(value);
  ensureSpace(writer, 1);
  writer.page.drawText(`${label}:`, {
    x: MARGIN,
    y: writer.y,
    size: BODY_SIZE,
    font: writer.bold,
  });
  writer.page.drawText(text, {
    x: MARGIN + LABEL_WIDTH,
    y: writer.y,
    size: BODY_SIZE,
    font: writer.font,
  });
  writer.y -= LINE_HEIGHT;
}

export function writeMultilineField(
  writer: Writer,
  label: string,
  value: string | undefined,
): void {
  ensureSpace(writer, 1);
  writer.page.drawText(`${label}:`, {
    x: MARGIN,
    y: writer.y,
    size: BODY_SIZE,
    font: writer.bold,
  });
  writer.y -= LINE_HEIGHT;
  const lines = value === undefined || value.length === 0 ? ["-"] : wrap(value, MAX_LINE_CHARS);
  for (const line of lines) {
    ensureSpace(writer, 1);
    writer.page.drawText(line, {
      x: MARGIN + 12,
      y: writer.y,
      size: BODY_SIZE,
      font: writer.font,
    });
    writer.y -= LINE_HEIGHT;
  }
}
