// FILE: src/adapters/pdf-report-adapter.ts
/**
 * PDF report generation adapter.
 *
 * Public-works submissions expect a printable paper trail alongside the
 * platform's existing CSV exports (see `src/api/csv.ts`). This adapter
 * renders read-only PDF documents for daily reports, material photo logs,
 * and inspections directly from the domain records — it never mutates a
 * record, only serializes one.
 *
 * Library choice: `pdf-lib` (pure JS/TS, no native bindings, MIT licensed,
 * ~1MB installed). It was chosen over hand-rolling the PDF byte format
 * because a correct PDF writer (xref table, object streams, page tree) is a
 * well-known source of subtle bugs, and `pdf-lib` is the lightest actively
 * used library that gets that right.
 *
 * Japanese text rendering: these are Japanese business documents (工事日報 /
 * 資材写真台帳 / 検査記録), so the built-in Helvetica standard font (WinAnsi
 * encoding, no CJK glyphs) is not an option. Instead this adapter embeds IPA
 * Gothic — a CJK-capable TrueType font redistributable under the IPA Font
 * License v1.0 (see `assets/fonts/LICENSE_IPAFONT.txt`) — via `pdf-lib` +
 * `@pdf-lib/fontkit`. The font file is bundled as a repository asset
 * (`assets/fonts/ipag.ttf`) rather than read from a system path, because
 * production runtimes are not guaranteed to have the OS-level IPA font
 * package installed. `embedFont(..., { subset: true })` makes `pdf-lib`
 * subset the embedded font per generated document, so each PDF only carries
 * the glyphs its own text actually uses, independent of the ~6MB source
 * font's full size.
 *
 * The same embedded font is used for both regular and "bold" (heading)
 * text: IPA Gothic does not ship a bold weight, so headings are set larger
 * rather than rendered in a heavier stroke. This is a cosmetic trade-off
 * only — correct Japanese glyph rendering (the point of this adapter) is
 * unaffected.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";
import { type PDFFont, type PDFPage, PDFDocument, rgb } from "pdf-lib";
import type { DailyReport } from "../domain/daily-report.ts";
import type { Inspection, InspectionChecklistItem } from "../domain/inspection.ts";
import type { MaterialPhotoLog } from "../domain/material-photo-log.ts";

const JAPANESE_FONT_PATH = fileURLToPath(new URL("./assets/fonts/ipag.ttf", import.meta.url));

/** Lazily read + cache the embedded font's bytes; the file never changes at runtime. */
let cachedFontBytes: Buffer | undefined;
function loadJapaneseFontBytes(): Buffer {
  cachedFontBytes ??= readFileSync(JAPANESE_FONT_PATH);
  return cachedFontBytes;
}

const PAGE_WIDTH = 595.28; // A4 portrait, in PDF points (72 dpi).
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const LINE_HEIGHT = 16;
const LABEL_WIDTH = 150;
const BODY_SIZE = 10;
const TITLE_SIZE = 16;
const MAX_LINE_CHARS = 78;

interface Writer {
  readonly doc: PDFDocument;
  readonly font: PDFFont;
  readonly bold: PDFFont;
  page: PDFPage;
  y: number;
}

async function createWriter(): Promise<Writer> {
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

function ensureSpace(writer: Writer, lines = 1): void {
  if (writer.y - lines * LINE_HEIGHT < MARGIN) {
    writer.page = writer.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    writer.y = PAGE_HEIGHT - MARGIN;
  }
}

function writeTitle(writer: Writer, text: string): void {
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

function writeSectionHeading(writer: Writer, text: string): void {
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
function wrap(text: string, maxChars: number): string[] {
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

function writeField(
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

function writeMultilineField(writer: Writer, label: string, value: string | undefined): void {
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

/** Render a daily construction report (工事日報) as a single-record PDF. */
export async function renderDailyReportPdf(report: DailyReport): Promise<Uint8Array> {
  const writer = await createWriter();
  writeTitle(writer, "Daily Construction Report / 工事日報");
  writeField(writer, "Report ID", report.id);
  writeField(writer, "Project ID", report.projectId);
  writeField(writer, "Report Date", report.reportDate);
  writeField(writer, "Status", report.status);
  writeField(writer, "Weather", report.weather ?? "-");
  writeField(writer, "Temperature (C)", report.temperature);
  writeField(writer, "Worker Count", report.workerCount);
  writeField(writer, "Progress Rate (%)", report.progressRate);
  writeField(writer, "Safety Check", report.safetyCheck ? "OK" : "NG");
  writeMultilineField(writer, "Safety Notes", report.safetyNotes);
  writeMultilineField(writer, "Work Content", report.workContent);
  writeMultilineField(writer, "Issues", report.issues);
  writeField(writer, "Created At", report.createdAt);
  writeField(writer, "Updated At", report.updatedAt);
  return writer.doc.save();
}

/** Render a material photo log (資材写真台帳) entry as a single-record PDF. */
export async function renderMaterialPhotoLogPdf(log: MaterialPhotoLog): Promise<Uint8Array> {
  const writer = await createWriter();
  writeTitle(writer, "Material Photo Log / 資材写真台帳");
  writeField(writer, "Log ID", log.id);
  writeField(writer, "Project Code", log.projectCode);
  writeField(writer, "Material Name", log.materialName);
  writeField(writer, "Material Category", log.materialCategory ?? "-");
  writeField(writer, "Quantity", log.quantity);
  writeField(writer, "Unit", log.unit ?? "-");
  writeField(writer, "Storage Place", log.storagePlace ?? "-");
  writeField(writer, "Transaction Type", log.transactionType);
  writeField(writer, "Inspection Status", log.inspectionStatus);
  writeField(writer, "Needs Review", log.needsReview ? "Yes" : "No");
  writeField(writer, "Captured At", log.capturedAt ?? "-");
  writeField(writer, "Latitude", log.latitude);
  writeField(writer, "Longitude", log.longitude);
  writeField(writer, "Object Key", log.objectKey ?? "-");
  writeMultilineField(writer, "Memo", log.memo);
  writeField(writer, "Created At", log.createdAt);
  writeField(writer, "Updated At", log.updatedAt);
  return writer.doc.save();
}

function writeChecklist(writer: Writer, items: readonly InspectionChecklistItem[]): void {
  writeSectionHeading(writer, "Checklist Items");
  if (items.length === 0) {
    ensureSpace(writer, 1);
    writer.page.drawText("-", { x: MARGIN + 12, y: writer.y, size: BODY_SIZE, font: writer.font });
    writer.y -= LINE_HEIGHT;
    return;
  }
  for (const item of items) {
    ensureSpace(writer, 1);
    const mark = item.passed ? "[PASS]" : "[FAIL]";
    writer.page.drawText(`${mark} ${item.label}`, {
      x: MARGIN + 12,
      y: writer.y,
      size: BODY_SIZE,
      font: writer.font,
    });
    writer.y -= LINE_HEIGHT;
  }
}

/** Render a site inspection record (検査記録) as a single-record PDF. */
export async function renderInspectionPdf(inspection: Inspection): Promise<Uint8Array> {
  const writer = await createWriter();
  writeTitle(writer, "Site Inspection Record / 検査記録");
  writeField(writer, "Inspection ID", inspection.id);
  writeField(writer, "Project ID", inspection.projectId);
  writeField(writer, "Title", inspection.title);
  writeField(writer, "Result", inspection.result);
  writeField(writer, "Inspected At", inspection.inspectedAt ?? "-");
  writeField(writer, "Inspector ID", inspection.inspectorId ?? "-");
  writeMultilineField(writer, "Description", inspection.description);
  writeChecklist(writer, inspection.checklistItems);
  writeField(writer, "Created At", inspection.createdAt);
  writeField(writer, "Updated At", inspection.updatedAt);
  return writer.doc.save();
}
