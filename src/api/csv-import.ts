// FILE: src/api/csv-import.ts
/**
 * CSV parsing for bulk-import endpoints — the inverse of {@link ../csv.ts}'s
 * `toCsv`.
 *
 * Handles the RFC 4180 cases the exporter produces (and that real-world CSV
 * — from Excel, LibreOffice or Google Sheets — commonly relies on):
 *
 *   - quoted fields containing commas, quotes (doubled: `""`) and newlines
 *   - both CRLF and bare LF line endings, possibly mixed within one file
 *   - a UTF-8 BOM prefix (Excel adds one on "CSV UTF-8" export)
 *
 * Unlike the exporter, this module does not undo formula-injection
 * neutralization (the leading `'` that `neutralizeFormula` adds). A value a
 * user submits for import is new data, not necessarily a round-tripped
 * export, so a leading apostrophe is taken at face value rather than
 * stripped — stripping it would silently rewrite input the caller typed on
 * purpose.
 */

/** One parsed CSV document: header names plus rows keyed by those names. */
export interface ParsedCsv {
  readonly headers: readonly string[];
  readonly rows: readonly Readonly<Record<string, string>>[];
}

/** Strip a UTF-8 BOM (U+FEFF) if present at the very start of the text. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Split raw CSV text into records of raw string fields, honoring RFC 4180
 * quoting. Does not interpret headers — that is the caller's job.
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let sawAnyField = false;
  const n = text.length;
  let i = 0;

  const endField = (): void => {
    record.push(field);
    field = "";
  };
  const endRecord = (): void => {
    endField();
    records.push(record);
    record = [];
  };

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      sawAnyField = true;
      i++;
      continue;
    }
    if (c === ",") {
      sawAnyField = true;
      endField();
      i++;
      continue;
    }
    if (c === "\r" || c === "\n") {
      sawAnyField = true;
      endRecord();
      i++;
      if (c === "\r" && text[i] === "\n") {
        i++;
      }
      continue;
    }
    sawAnyField = true;
    field += c;
    i++;
  }
  // Flush a trailing field/record that was not terminated by a line break
  // (the common case: the file has no final newline).
  if (field.length > 0 || record.length > 0 || (sawAnyField && records.length === 0)) {
    endRecord();
  }
  return records;
}

/**
 * Parse an RFC 4180 CSV document whose first record is the header row.
 *
 * Rows shorter than the header are padded with `""` for the missing columns;
 * rows longer than the header silently drop the extra trailing fields (kept
 * simple — callers validate required fields themselves via the domain's
 * `create*` function, so a malformed row surfaces as a normal validation
 * error rather than a parser-level one).
 */
export function parseCsv(text: string): ParsedCsv {
  const records = parseCsvRecords(stripBom(text)).filter((r) => !(r.length === 1 && r[0] === ""));
  if (records.length === 0) {
    return { headers: [], rows: [] };
  }
  const [headerRow, ...dataRows] = records as [string[], ...string[][]];
  const rows = dataRows.map((r) => {
    const row: Record<string, string> = {};
    headerRow.forEach((h, i) => {
      row[h] = r[i] ?? "";
    });
    return row;
  });
  return { headers: headerRow, rows };
}

// ---------------------------------------------------------------------------
// Field coercion helpers for CSV rows (string-only) — mirrors route-helpers.ts
// str/num/bool, which operate on parsed JSON bodies instead.
// ---------------------------------------------------------------------------

/** A non-empty string field, or `undefined` when the cell is blank. */
export function csvStr(row: Readonly<Record<string, string>>, key: string): string | undefined {
  const v = row[key];
  return v !== undefined && v !== "" ? v : undefined;
}

/**
 * A numeric field, or `undefined` when blank. Returns `NaN` for a non-blank
 * value that fails to parse, so callers can surface it as a validation error
 * instead of silently treating a typo as "field omitted".
 */
export function csvNum(row: Readonly<Record<string, string>>, key: string): number | undefined {
  const v = row[key];
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return n;
}

/** A boolean field ("true"/"1" → true, "false"/"0"/"" → false/undefined). */
export function csvBool(row: Readonly<Record<string, string>>, key: string): boolean | undefined {
  const v = row[key];
  if (v === undefined || v === "") return undefined;
  return v === "true" || v === "1";
}
