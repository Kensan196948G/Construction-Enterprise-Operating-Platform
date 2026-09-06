// FILE: src/api/xlsx.ts
/**
 * Minimal Excel (.xlsx / OOXML SpreadsheetML) writer.
 *
 * Issue #88 asks for Excel export "with a minimal, lightweight library, or —
 * if one cannot be fetched — a self-built minimal OOXML (.xlsx / ZIP-based)
 * structure". This project's documented architecture already commits to
 * **zero runtime dependencies** (see README "依存方針"), so the self-built
 * path was chosen deliberately, not only as a network fallback: adding a
 * package such as `xlsx`/`exceljs` for one export feature would be the first
 * runtime dependency in the entire codebase and a permanent addition to its
 * vulnerability/audit surface, whereas an .xlsx file is just a ZIP (see
 * `./zip.ts`) of small XML parts — well within reach of `node:zlib`-free
 * built-ins.
 *
 * Produces the smallest valid SpreadsheetML package: one sheet, inline
 * strings (no `sharedStrings.xml`), no styles part. Excel, LibreOffice
 * Calc and Google Sheets all open this without complaint.
 *
 * Formula-injection note: `../csv.ts` prefixes risky leading characters with
 * `'` because CSV/TSV is *reparsed* by the spreadsheet application, which
 * infers a cell's type (text vs. formula) from its raw text. Native XLSX
 * has no such ambiguity — every cell here is written with an explicit type
 * (`t="inlineStr"` for text, a bare `<v>` for numbers), and only a `<f>`
 * element makes a cell a formula. Excel therefore renders `=SUM(...)` typed
 * into these cells as the literal text "=SUM(...)", never evaluates it, so
 * no apostrophe-prefixing is needed (and adding one here would incorrectly
 * mutate the displayed value, since inlineStr text is shown verbatim rather
 * than passed back through Excel's "typed with a leading quote" UI path).
 */

import { createZip } from "./zip.ts";

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

function workbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`;
}

/** Escape text for use inside XML element content and attribute values. */
function escapeXml(value: string): string {
  return (
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;")
      // XML 1.0 disallows most C0 control characters even when escaped.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  );
}

/** A bare integer or decimal (optionally signed) — safe to emit as a numeric cell. */
const NUMERIC_RE = /^-?\d+(\.\d+)?$/;

/** 0-based column index → spreadsheet column letters ("A", "B", ..., "Z", "AA", ...). */
function columnLetters(index: number): string {
  let n = index + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function cellXml(ref: string, value: string): string {
  if (value === "") {
    return `<c r="${ref}"/>`;
  }
  if (NUMERIC_RE.test(value) && Number.isFinite(Number(value))) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function rowXml(rowNumber: number, values: readonly string[]): string {
  const cells = values.map((v, i) => cellXml(`${columnLetters(i)}${rowNumber}`, v)).join("");
  return `<row r="${rowNumber}">${cells}</row>`;
}

/**
 * Render rows as a single-sheet .xlsx workbook.
 *
 * Mirrors `toCsv`'s contract: `headers` fixes column order, each row is read
 * by those same keys (a missing key yields a blank cell), and the header row
 * is written first.
 */
export function toXlsx(
  headers: readonly string[],
  rows: readonly Readonly<Record<string, string>>[],
  sheetName = "Sheet1",
): Buffer {
  const rowsXml: string[] = [rowXml(1, headers)];
  rows.forEach((row, i) => {
    rowsXml.push(
      rowXml(
        i + 2,
        headers.map((h) => row[h] ?? ""),
      ),
    );
  });
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml.join("")}</sheetData></worksheet>`;

  return createZip([
    { name: "[Content_Types].xml", data: Buffer.from(CONTENT_TYPES_XML, "utf-8") },
    { name: "_rels/.rels", data: Buffer.from(ROOT_RELS_XML, "utf-8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbookXml(sheetName), "utf-8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(WORKBOOK_RELS_XML, "utf-8") },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheetXml, "utf-8") },
  ]);
}
