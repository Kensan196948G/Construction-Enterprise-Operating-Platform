// FILE: src/api/csv.ts
/**
 * CSV serialization for evidence exports.
 *
 * Audit exports are opened in spreadsheet software far more often than they are
 * parsed by a program, which makes the spreadsheet the real consumer — and the
 * real attack surface. Two separate escapes are therefore applied to every
 * field, and they solve different problems:
 *
 *   1. RFC 4180 quoting keeps the *file* parseable (delimiters, quotes and
 *      newlines inside a value must not end the field or the record).
 *   2. Formula-injection neutralization keeps the *spreadsheet* from executing
 *      the value. Excel, LibreOffice and Google Sheets treat a cell beginning
 *      with `=`, `+`, `-` or `@` as a formula, so an audit `actor` recorded as
 *      `=cmd|'/c calc'!A1` becomes code the moment an auditor opens the file.
 *
 * Neither escape substitutes for the other: quoting alone still yields a live
 * formula, and prefixing alone still breaks on an embedded comma.
 */

/**
 * Leading characters a spreadsheet treats as the start of a formula.
 *
 * Tab and carriage return are included because both Excel and LibreOffice strip
 * them before evaluating the cell, so `\t=1+1` is a formula that a naive
 * first-character check on `=` would let through.
 */
const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"] as const;

/**
 * Neutralize a value that a spreadsheet would otherwise evaluate as a formula.
 *
 * The leading apostrophe is the spreadsheet-native "treat this as text" marker:
 * it is consumed on display, so the auditor still reads the original value.
 * Prefixing is preferred over stripping because an audit export must not
 * silently alter the evidence it carries.
 */
export function neutralizeFormula(value: string): string {
  const first = value.charAt(0);
  return FORMULA_TRIGGERS.some((t) => t === first) ? `'${value}` : value;
}

/** Quote a single field per RFC 4180, after formula neutralization. */
export function escapeCsvField(value: string): string {
  const safe = neutralizeFormula(value);
  // Quote whenever a bare field would be ambiguous. The leading apostrophe
  // added above is not itself a reason to quote.
  const needsQuotes = /[",\r\n]/.test(safe);
  return needsQuotes ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * Render rows as an RFC 4180 CSV document.
 *
 * `headers` fixes the column order; each row is read by those same keys, so a
 * row missing a key yields an empty cell rather than a shifted record. CRLF is
 * the line ending mandated by RFC 4180 and is what Excel expects.
 */
export function toCsv(
  headers: readonly string[],
  rows: readonly Readonly<Record<string, string>>[],
): string {
  const lines: string[] = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvField(row[h] ?? "")).join(","));
  }
  // Trailing CRLF: a record is terminated by a line break, and its absence
  // makes the last row easy to lose when files are concatenated.
  return `${lines.join("\r\n")}\r\n`;
}
