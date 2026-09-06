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
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { type Result, ok, err } from "../domain/common.ts";

/** One decoded asset ready to be written under the output directory. */
export interface UnpackedAsset {
  /**
   * Output-relative path: `assets/<uuid>.<ext>` for manifest assets, plus the
   * root-level `ext-resources.js` map (kept out of `assets/` on purpose — the
   * server immutable-caches that prefix, but this file's content changes
   * whenever the design bundle's CDN dependencies do).
   */
  readonly path: string;
  readonly mime: string;
  readonly bytes: Uint8Array;
}

/** Root-level script that defines `window.__resources` (see below). */
export const EXT_RESOURCES_PATH = "ext-resources.js";

/** Browser-tab icon shared with the SSR pages; served by the WebUI server. */
export const FAVICON_TAG = `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`;

/** Full decode result: rewritten entry HTML plus all referenced assets. */
export interface UnpackedBundle {
  readonly indexHtml: string;
  readonly assets: readonly UnpackedAsset[];
  /**
   * `'sha256-<base64>'` CSP source tokens, one per unique inline `<style>`
   * element found in {@link indexHtml} (there are normally just one or two —
   * a font-face sheet and a base reset). The design bundle is a static,
   * build-time-generated file, so each block's content is a fixed string;
   * hashing it here lets the server allow those two exact blocks via
   * `style-src-elem` instead of blanket `'unsafe-inline'`.
   *
   * This intentionally does NOT cover `style="..."` attributes: the real
   * design bundle carries 300+ unique values, and per-value hashing would
   * balloon the `Content-Security-Policy` header past what intermediary
   * proxies reliably forward (~17 KiB, measured). `style-src-attr` keeps
   * `'unsafe-inline'` for that reason — see `src/webui/server.ts` and
   * docs/assessment/ROOT-ASSESSMENT.md (G-14).
   */
  readonly cspStyleElementHashes: readonly string[];
}

/** Filename the unpacked style hashes are written to, next to `index.html`. */
export const CSP_MANIFEST_PATH = "csp.json";

/** `'sha256-<base64>'` CSP source token for a piece of literal content. */
function sha256Token(content: string): string {
  return `sha256-${createHash("sha256").update(content, "utf-8").digest("base64")}`;
}

/**
 * Compute CSP `style-src-elem` hash tokens for every inline `<style>`
 * element in `html`. Regex-based (not a full HTML parser), matching the
 * rest of this module's approach to the bundle's static markup. `<style>`
 * content is RAWTEXT per the HTML spec, so it is hashed verbatim — no
 * entity decoding (unlike attribute values, which browsers decode before
 * hashing for CSP matching).
 */
export function computeStyleElementCspHashes(html: string): readonly string[] {
  const hashes = new Set<string>();
  for (const match of html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)) {
    hashes.add(sha256Token(match[1] ?? ""));
  }
  return [...hashes].sort();
}

interface ManifestEntry {
  readonly mime?: string;
  readonly data: string;
  readonly compressed?: boolean;
}

/** `__bundler/ext_resources` entry: a CDN URL bundled as a local asset. */
interface ExtResourceEntry {
  readonly id: string;
  readonly uuid: string;
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

/**
 * Asset identifiers come from the design bundle's manifest and are later used
 * verbatim as relative output paths. Enforcing the UUID shape before path
 * construction keeps a compromised or malformed bundle from writing outside
 * the unpack directory (`../../evil` would otherwise be a plausible key).
 */
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

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
  const pathByUuid = new Map<string, string>();
  for (const [uuid, entry] of Object.entries(manifest)) {
    if (!UUID_RE.test(uuid)) {
      return err(`manifest entry has invalid asset uuid: ${uuid}`);
    }
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
    pathByUuid.set(uuid, path);
    // The template references assets by bare UUID (in src/href/url()).
    template = template.split(uuid).join(path);
  }

  template = injectFavicon(template);
  const withResources = injectResourceMap(html, template, pathByUuid);
  if (!withResources.ok) return withResources;
  if (withResources.value.mapScript !== undefined) {
    assets.push({
      path: EXT_RESOURCES_PATH,
      mime: "text/javascript",
      bytes: Buffer.from(withResources.value.mapScript, "utf-8"),
    });
  }

  return ok({
    indexHtml: withResources.value.indexHtml,
    assets,
    cspStyleElementHashes: computeStyleElementCspHashes(withResources.value.indexHtml),
  });
}

/** Insert the browser-tab favicon link right after `<head>` (idempotent). */
function injectFavicon(html: string): string {
  if (html.includes(FAVICON_TAG)) return html;
  const headOpen = /<head(\s[^>]*)?>/i.exec(html);
  if (!headOpen || headOpen.index === undefined) return html;
  const insertAt = headOpen.index + headOpen[0].length;
  return html.slice(0, insertAt) + FAVICON_TAG + html.slice(insertAt);
}

/**
 * The bundle's runtime (`src/cdn.ts` in the design tool) loads React et al.
 * from CDN URLs unless `window.__resources` maps those URLs to local paths.
 * The original self-extracting loader builds that map from the optional
 * `__bundler/ext_resources` section (CDN URL → bundled asset UUID) using
 * blob: URLs; under our CSP (`script-src 'self'`, no CDN hosts) we must do
 * the same with the unpacked local asset paths, or the page boots blank.
 *
 * The map ships as an external `ext-resources.js` file referenced right after
 * `<head>` — an inline `<script>` would itself be blocked by the same CSP
 * (there is no 'unsafe-inline'), which is why it must stay a separate asset.
 */
function injectResourceMap(
  html: string,
  template: string,
  pathByUuid: ReadonlyMap<string, string>,
): Result<{ indexHtml: string; mapScript?: string }, string> {
  const section = bundlerSection(html, "ext_resources");
  if (!section.ok) return ok({ indexHtml: template }); // optional section

  let entries: readonly ExtResourceEntry[];
  try {
    entries = JSON.parse(section.value) as ExtResourceEntry[];
  } catch (e) {
    return err(`ext_resources JSON parse failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!Array.isArray(entries)) {
    return err("ext_resources is not a JSON array");
  }

  const resources: Record<string, string> = {};
  for (const entry of entries) {
    if (typeof entry?.id !== "string" || typeof entry?.uuid !== "string") {
      return err("ext_resources entry missing id/uuid");
    }
    const path = pathByUuid.get(entry.uuid);
    if (path === undefined) {
      return err(`ext_resources references unknown asset ${entry.uuid}`);
    }
    resources[entry.id] = path;
  }
  if (Object.keys(resources).length === 0) {
    return ok({ indexHtml: template });
  }

  // Inject right after <head> (keeps the DOCTYPE first) so the map is defined
  // before the runtime script executes; plain sync scripts run in DOM order.
  const headOpen = /<head(\s[^>]*)?>/i.exec(template);
  if (!headOpen || headOpen.index === undefined) {
    return err("template has no <head> to inject window.__resources into");
  }
  let insertAt = headOpen.index + headOpen[0].length;
  // Keep the favicon link first when it was already injected by injectFavicon.
  if (template.startsWith(FAVICON_TAG, insertAt)) {
    insertAt += FAVICON_TAG.length;
  }
  const tag = `<script src="${EXT_RESOURCES_PATH}"></` + `script>`;
  return ok({
    indexHtml: template.slice(0, insertAt) + tag + template.slice(insertAt),
    mapScript: `window.__resources = ${JSON.stringify(resources)};\n`,
  });
}

/**
 * Materialise an unpacked bundle under `outDir` (index.html + assets/ +
 * `csp.json`). The server reads `csp.json` at startup to build a
 * `style-src-elem` header with hashes instead of `'unsafe-inline'` (see
 * {@link CSP_MANIFEST_PATH} and `src/webui/server.ts`).
 */
export function writeUnpackedBundle(bundle: UnpackedBundle, outDir: string): void {
  mkdirSync(join(outDir, "assets"), { recursive: true });
  for (const asset of bundle.assets) {
    writeFileSync(join(outDir, asset.path), asset.bytes);
  }
  writeFileSync(join(outDir, "index.html"), bundle.indexHtml, "utf-8");
  writeFileSync(
    join(outDir, CSP_MANIFEST_PATH),
    JSON.stringify({ styleElementHashes: bundle.cspStyleElementHashes }, null, 2) + "\n",
    "utf-8",
  );
}
