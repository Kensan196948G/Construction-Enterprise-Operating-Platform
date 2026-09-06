/**
 * DX: TypeScript SDK generator (Issue #70).
 *
 * Reads the platform's own OpenAPI 3.1 spec (docs/openapi.yaml — produced by
 * `pnpm run openapi:gen`, see scripts/generate-openapi.ts) and emits a small,
 * fully-typed fetch client into sdk/.
 *
 * This is a hand-written generator (not openapi-typescript or similar) to
 * keep the dependency surface small, matching the project's existing
 * zero-dependency style for scripts/generate-openapi.ts. The only added
 * dependency is `js-yaml`, used read-only to parse the spec this script
 * consumes — it does not touch any API route or domain logic.
 *
 * Run: node --experimental-strip-types scripts/generate-sdk.ts
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";

// ---------------------------------------------------------------------------
// Minimal OpenAPI 3.1 types — only the subset this generator relies on.
// ---------------------------------------------------------------------------

type JsonPrimitive = string | number | boolean | null;

interface SchemaObject {
  readonly $ref?: string;
  readonly type?: string;
  readonly properties?: Record<string, SchemaObject>;
  readonly required?: readonly string[];
  readonly items?: SchemaObject;
  readonly enum?: readonly JsonPrimitive[];
  readonly additionalProperties?: boolean | SchemaObject;
  readonly description?: string;
}

interface ParameterObject {
  readonly $ref?: string;
  readonly name?: string;
  readonly in?: "path" | "query" | "header" | "cookie";
  readonly required?: boolean;
  readonly schema?: SchemaObject;
  readonly description?: string;
}

interface MediaTypeObject {
  readonly schema?: SchemaObject;
}

interface RequestBodyObject {
  readonly required?: boolean;
  readonly content?: Record<string, MediaTypeObject>;
}

interface ResponseObject {
  readonly content?: Record<string, MediaTypeObject>;
}

interface OperationObject {
  readonly operationId?: string;
  readonly summary?: string;
  readonly parameters?: readonly ParameterObject[];
  readonly requestBody?: RequestBodyObject;
  readonly responses?: Record<string, ResponseObject>;
}

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface OpenApiDocument {
  readonly paths?: Record<string, Partial<Record<HttpMethod, OperationObject>>>;
  readonly components?: {
    readonly schemas?: Record<string, SchemaObject>;
    readonly parameters?: Record<string, ParameterObject>;
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function refName(ref: string, kind: "schemas" | "parameters"): string {
  const prefix = `#/components/${kind}/`;
  if (!ref.startsWith(prefix)) {
    throw new Error(
      `Unsupported $ref (only local #/components/${kind}/* refs are supported): ${ref}`,
    );
  }
  return ref.slice(prefix.length);
}

function resolveParameter(entry: ParameterObject, doc: OpenApiDocument): ParameterObject {
  if (entry.$ref) {
    const name = refName(entry.$ref, "parameters");
    const resolved = doc.components?.parameters?.[name];
    if (!resolved) throw new Error(`Unresolved parameter $ref: ${entry.$ref}`);
    return resolved;
  }
  return entry;
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function propertyKey(key: string): string {
  return IDENTIFIER_RE.test(key) ? key : JSON.stringify(key);
}

/** Renders a JSON Schema fragment as an inline TypeScript type expression. */
function renderType(schema: SchemaObject | undefined, refPrefix: string): string {
  if (!schema) return "unknown";

  if (schema.$ref) {
    return refPrefix + refName(schema.$ref, "schemas");
  }

  if (schema.enum && schema.enum.length > 0) {
    return schema.enum
      .map((value) => (typeof value === "string" ? JSON.stringify(value) : String(value)))
      .join(" | ");
  }

  if (schema.type === "array") {
    return `Array<${renderType(schema.items, refPrefix)}>`;
  }

  if (schema.type === "object" || schema.properties) {
    if (schema.properties && Object.keys(schema.properties).length > 0) {
      const required = new Set(schema.required ?? []);
      const members = Object.entries(schema.properties).map(([key, value]) => {
        const optional = required.has(key) ? "" : "?";
        return `${propertyKey(key)}${optional}: ${renderType(value, refPrefix)};`;
      });
      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        members.push(
          `[key: string]: ${renderType(schema.additionalProperties, refPrefix)} | undefined;`,
        );
      }
      return `{ ${members.join(" ")} }`;
    }
    if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
      return `Record<string, ${renderType(schema.additionalProperties, refPrefix)}>`;
    }
    return "Record<string, unknown>";
  }

  if (schema.type === "string") return "string";
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "null") return "null";

  return "unknown";
}

/** Renders the interface body (members only, no surrounding braces) for a named schema. */
function renderInterfaceMembers(schema: SchemaObject): string {
  const rendered = renderType(schema, "");
  // renderType already returns "{ ... }" for object schemas — unwrap it for interface bodies.
  const trimmed = rendered.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed.slice(1, -1).trim();
  }
  return "";
}

// ---------------------------------------------------------------------------
// Response / request-body type resolution
// ---------------------------------------------------------------------------

const JSON_MEDIA_TYPE = "application/json";

/** Picks the most useful success response and renders its type (Types.-prefixed refs). */
function renderResponseType(operation: OperationObject): string {
  const responses = operation.responses ?? {};
  const successCode = ["200", "201"].find((code) => responses[code]);
  if (!successCode) {
    return responses["204"] || Object.keys(responses).length === 0 ? "void" : "unknown";
  }
  const response = responses[successCode]!;
  const content = response.content;
  if (!content || Object.keys(content).length === 0) {
    return "void";
  }

  const rendered: string[] = [];
  // Prefer JSON first for readability, then any remaining content types (e.g. text/csv).
  const mediaTypes = Object.keys(content).sort((a, b) =>
    a === JSON_MEDIA_TYPE ? -1 : b === JSON_MEDIA_TYPE ? 1 : 0,
  );
  for (const mediaType of mediaTypes) {
    const schema = content[mediaType]?.schema;
    const type = mediaType === JSON_MEDIA_TYPE ? renderType(schema, "Types.") : "string";
    if (!rendered.includes(type)) rendered.push(type);
  }
  return rendered.length > 0 ? rendered.join(" | ") : "unknown";
}

function renderRequestBodyType(
  operation: OperationObject,
): { type: string; optional: boolean } | null {
  const body = operation.requestBody;
  if (!body) return null;
  const schema = body.content?.[JSON_MEDIA_TYPE]?.schema;
  return { type: renderType(schema, "Types."), optional: body.required === false };
}

// ---------------------------------------------------------------------------
// Operation -> client method
// ---------------------------------------------------------------------------

interface GeneratedMethod {
  readonly name: string;
  readonly code: string;
}

function generateMethod(
  path: string,
  method: HttpMethod,
  operation: OperationObject,
  doc: OpenApiDocument,
): GeneratedMethod {
  const operationId = operation.operationId;
  if (!operationId) {
    throw new Error(`Operation ${method.toUpperCase()} ${path} has no operationId`);
  }

  const parameters = (operation.parameters ?? []).map((p) => resolveParameter(p, doc));
  const queryParams = parameters.filter((p) => p.in === "query");

  // Path parameters are derived from the URL template itself (not from the
  // `parameters` array): a few operations in docs/openapi.yaml reference a
  // `{placeholder}` without declaring a matching `in: "path"` entry, and the
  // template is the ground truth for what the generated method must accept.
  // Every path parameter observed in this API is a plain string.
  const pathParamNames = Array.from(path.matchAll(/\{([^}]+)\}/g)).map((m) => m[1]!);
  const pathParamArgs = pathParamNames.map((name) => ({ name, type: "string" }));

  const requestBody = renderRequestBodyType(operation);
  const responseType = renderResponseType(operation);

  const args: string[] = pathParamArgs.map(({ name, type }) => `${name}: ${type}`);
  if (requestBody) {
    args.push(`body${requestBody.optional ? "?" : ""}: ${requestBody.type}`);
  }
  let queryType = "";
  if (queryParams.length > 0) {
    const members = queryParams.map((p) => {
      const name = p.name ?? "value";
      const type = renderType(p.schema, "Types.");
      const optional = p.required ? "" : "?";
      return `${propertyKey(name)}${optional}: ${type};`;
    });
    queryType = `{ ${members.join(" ")} }`;
    args.push(`query: ${queryType} = {}`);
  }

  // Build the URL template, substituting {param} with encodeURIComponent(param).
  let urlExpr = path.replace(
    /\{([^}]+)\}/g,
    (_match, name: string) => `\${encodeURIComponent(String(${name}))}`,
  );
  urlExpr = "`" + urlExpr + "`";

  const initParts: string[] = [];
  if (queryParams.length > 0) initParts.push("query");
  if (requestBody) initParts.push("body");
  const initArg = initParts.length > 0 ? `, { ${initParts.join(", ")} }` : "";

  const code = `  ${operationId}(${args.join(", ")}): Promise<${responseType}> {
    return this.request(${JSON.stringify(method.toUpperCase())}, ${urlExpr}${initArg});
  }`;

  return { name: operationId, code };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const GENERATED_BANNER = `/**
 * AUTO-GENERATED by \`pnpm run sdk:gen\` (scripts/generate-sdk.ts) — DO NOT EDIT.
 * Source: docs/openapi.yaml (produced by \`pnpm run openapi:gen\`).
 */
`;

async function main(): Promise<void> {
  const root = join(import.meta.dirname ?? ".", "..");
  const specPath = join(root, "docs", "openapi.yaml");
  const outDir = join(root, "sdk");

  const raw = await readFile(specPath, "utf8").catch(() => {
    throw new Error(
      `Could not read ${specPath}. Run \`pnpm run openapi:gen\` first to produce the OpenAPI spec.`,
    );
  });
  const doc = loadYaml(raw) as OpenApiDocument;

  const schemas = doc.components?.schemas ?? {};
  const paths = doc.paths ?? {};

  // ---- sdk/types.ts ----------------------------------------------------
  const typeBlocks: string[] = [];
  for (const [name, schema] of Object.entries(schemas)) {
    const members = renderInterfaceMembers(schema);
    if (members.length > 0) {
      typeBlocks.push(
        `export interface ${name} {\n  ${members.replace(/; /g, ";\n  ").trimEnd()}\n}`,
      );
    } else {
      typeBlocks.push(`export type ${name} = ${renderType(schema, "")};`);
    }
  }
  const typesContent = `${GENERATED_BANNER}\n${typeBlocks.join("\n\n")}\n`;

  // ---- sdk/client.ts -----------------------------------------------------
  const methods: GeneratedMethod[] = [];
  const seenNames = new Set<string>();
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      const generated = generateMethod(path, method, operation, doc);
      if (seenNames.has(generated.name)) {
        throw new Error(`Duplicate operationId: ${generated.name}`);
      }
      seenNames.add(generated.name);
      methods.push(generated);
    }
  }

  const clientContent = `${GENERATED_BANNER}
import type * as Types from "./types.ts";

export interface ClientOptions {
  /** Base URL of the CEOP API, e.g. "http://localhost:3000". */
  readonly baseUrl: string;
  /** Bearer credential — either a JWT from /api/v1/auth/token or a raw "keyId:secret" API key. */
  readonly token?: string;
  /** Override for testing; defaults to the global fetch. */
  readonly fetchImpl?: typeof fetch;
}

/** Thrown when the API responds with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(\`CEOP API request failed with status \${status}\`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

interface RequestInit_ {
  readonly query?: Record<string, string | number | boolean | undefined>;
  readonly body?: unknown;
}

/** Typed fetch client for the Construction Enterprise Operating Platform API. */
export class CeopClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\\/+$/, "");
    this.token = options.token;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(method: string, path: string, init: RequestInit_ = {}): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (init.query) {
      for (const [key, value] of Object.entries(init.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.token) headers.Authorization = \`Bearer \${this.token}\`;

    const requestInit: RequestInit = { method, headers };
    if (init.body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await this.fetchImpl(url, requestInit);

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(response.status, payload);
    }
    return payload as T;
  }

${methods.map((m) => m.code).join("\n\n")}
}
`;

  // ---- sdk/index.ts -------------------------------------------------------
  const indexContent = `${GENERATED_BANNER}
export * from "./types.ts";
export * from "./client.ts";
`;

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "types.ts"), typesContent, "utf8");
  await writeFile(join(outDir, "client.ts"), clientContent, "utf8");
  await writeFile(join(outDir, "index.ts"), indexContent, "utf8");

  console.log(
    `✅ SDK generated: ${methods.length} operations, ${Object.keys(schemas).length} schemas -> ${outDir}`,
  );
}

await main();
