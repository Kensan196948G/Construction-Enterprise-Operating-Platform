/**
 * WebUI design-bundle unpacker.
 *
 * The design deliverable (`webui/CEOP Platform.html`) is a self-extracting
 * HTML produced by a "__bundler" tool: it embeds a JSON manifest of assets
 * (gzip+base64 or plain base64/text) plus a JSON-encoded HTML template that
 * references assets by UUID. At runtime the bundle inflates itself with an
 * inline loader script; for static hosting we unpack it once at build time
 * into plain files so the server can stream them with correct MIME types.
 *
 * Pure parsing/decoding lives here (unit-testable without the 8.7 MB file);
 * filesystem writes live in {@link writeUnpackedBundle}.
 */

import { gunzipSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { type Result, ok, err } from "../domain/common.ts";

/** One decoded asset ready to be written under the output directory. */
export interface UnpackedAsset {
  /** Output-relative path, always `assets/<uuid>.<ext>`. */
  readonly path: string;
  readonly mime: string;
  readonly bytes: Uint8Array;
}

/** Full decode result: rewritten entry HTML plus all referenced assets. */
export interface UnpackedBundle {
  readonly indexHtml: string;
  readonly assets: readonly UnpackedAsset[];
}

interface ManifestEntry {
  readonly mime?: string;
  readonly data: string;
  readonly compressed?: boolean;
}

const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "text/css": ".css",
  "text/html": ".html",
  "application/javascript": ".js",
  "text/javascript": ".js",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
  "font/woff2": ".woff2",
  "font/woff": ".woff",
  "application/json": ".json",
};

/** Extract the raw text of a `<script type="__bundler/<name>">` section. */
function bundlerSection(html: string, name: string): Result<string, string> {
  const marker = `<script type="__bundler/${name}"`;
  const start = html.indexOf(marker);
  if (start === -1) {
    return err(`bundle section not found: __bundler/${name}`);
  }
  const open = html.indexOf(">", start);
  const close = html.indexOf("</script>", open);
  if (open === -1 || close === -1) {
    return err(`bundle section malformed: __bundler/${name}`);
  }
  return ok(html.slice(open + 1, close));
}

/**
 * Uncompressed manifest entries carry either base64 (binary assets) or plain
 * text (small scripts). The bundler gives no flag, so mirror its loader's
 * heuristic: text payloads start with whitespace/markup characters that are
 * illegal in base64.
 */
function decodeUncompressed(data: string): Uint8Array {
  const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(data.slice(0, 80)) && !/^[\s<{(/]/.test(data);
  return looksBase64 ? Buffer.from(data, "base64") : Buffer.from(data, "utf-8");
}

/** Decode every manifest asset and rewrite UUID references in the template. */
export function unpackBundle(html: string): Result<UnpackedBundle, string> {
  const manifestSection = bundlerSection(html, "manifest");
  if (!manifestSection.ok) return manifestSection;
  const templateSection = bundlerSection(html, "template");
  if (!templateSection.ok) return templateSection;

  let manifest: Record<string, ManifestEntry>;
  let template: string;
  try {
    manifest = JSON.parse(manifestSection.value) as Record<string, ManifestEntry>;
    template = JSON.parse(templateSection.value) as string;
  } catch (e) {
    return err(`bundle JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (typeof template !== "string") {
    return err("bundle template is not a JSON string");
  }

  const assets: UnpackedAsset[] = [];
  for (const [uuid, entry] of Object.entries(manifest)) {
    if (typeof entry?.data !== "string") {
      return err(`manifest entry ${uuid} has no data`);
    }
    let bytes: Uint8Array;
    try {
      bytes = entry.compressed
        ? gunzipSync(Buffer.from(entry.data, "base64"))
        : decodeUncompressed(entry.data);
    } catch (e) {
      return err(`asset ${uuid} decode failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    const mime = ((entry.mime ?? "application/octet-stream").split(";")[0] ?? "").trim();
    const path = `assets/${uuid}${EXTENSION_BY_MIME[mime] ?? ".bin"}`;
    assets.push({ path, mime, bytes });
    // The template references assets by bare UUID (in src/href/url()).
    template = template.split(uuid).join(path);
  }

  return ok({ indexHtml: template, assets });
}

/** Materialise an unpacked bundle under `outDir` (index.html + assets/). */
export function writeUnpackedBundle(bundle: UnpackedBundle, outDir: string): void {
  mkdirSync(join(outDir, "assets"), { recursive: true });
  for (const asset of bundle.assets) {
    writeFileSync(join(outDir, asset.path), asset.bytes);
  }
  writeFileSync(join(outDir, "index.html"), bundle.indexHtml, "utf-8");
}
