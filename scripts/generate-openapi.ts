/**
 * M13: OpenAPI 3.1 specification generator.
 *
 * Produces docs/openapi.yaml from the hand-written schema definitions below.
 * Run: node --experimental-strip-types scripts/generate-openapi.ts
 *
 * Zero runtime dependencies — uses only node:fs/promises.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// YAML helpers (minimal — no library)
// ---------------------------------------------------------------------------

function indent(n: number): string {
  return " ".repeat(n * 2);
}

type YamlValue =
  | string
  | number
  | boolean
  | null
  | YamlValue[]
  | { [k: string]: YamlValue };

function serializeYaml(value: YamlValue, depth = 0): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (
      value.includes("\n") ||
      value.includes(":") ||
      value.includes("#") ||
      value.startsWith("-") ||
      value === "" ||
      /^[0-9]/.test(value)
    ) {
      const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((v) => `\n${indent(depth)}- ${serializeYaml(v, depth + 1)}`)
      .join("");
  }
  // object
  const entries = Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "{}";
  return entries
    .map(([k, v]) => {
      const valStr = serializeYaml(v, depth + 1);
      if (
        typeof v === "object" &&
        v !== null &&
        !Array.isArray(v) &&
        Object.keys(v).length > 0
      ) {
        return `\n${indent(depth)}${k}:${valStr}`;
      }
      if (Array.isArray(v) && v.length > 0) {
        return `\n${indent(depth)}${k}:${valStr}`;
      }
      return `\n${indent(depth)}${k}: ${valStr}`;
    })
    .join("");
}

function toYaml(root: { [k: string]: YamlValue }): string {
  return serializeYaml(root, 0).trimStart() + "\n";
}

// ---------------------------------------------------------------------------
// Reusable schema components
// ---------------------------------------------------------------------------

const schemas: { [k: string]: YamlValue } = {
  ErrorResponse: {
    type: "object",
    required: ["error"],
    properties: {
      error: { type: "string" },
      message: { type: "string" },
      details: { type: "object", additionalProperties: true },
    },
  },
  PaginationMeta: {
    type: "object",
    required: ["count", "total", "limit", "offset"],
    properties: {
      count: { type: "integer" },
      total: { type: "integer" },
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
  },
  Organization: {
    type: "object",
    required: ["id", "name", "type", "status", "createdAt"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: { type: "string", enum: ["headquarters", "branch", "site", "partner"] },
      status: { type: "string", enum: ["active", "inactive", "suspended"] },
      parentId: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  User: {
    type: "object",
    required: ["id", "organizationId", "displayName", "email", "status", "roleIds", "createdAt"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      displayName: { type: "string" },
      email: { type: "string", format: "email" },
      status: { type: "string", enum: ["active", "inactive", "suspended", "deactivated"] },
      roleIds: { type: "array", items: { type: "string" } },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  Role: {
    type: "object",
    required: ["id", "name", "scope", "permissions"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      scope: { type: "string", enum: ["global", "organization", "site"] },
      permissions: { type: "array", items: { type: "string" } },
    },
  },
  Device: {
    type: "object",
    required: ["id", "organizationId", "kind", "status"],
    properties: {
      id: { type: "string" },
      organizationId: { type: "string" },
      kind: { type: "string", enum: ["phone", "tablet", "laptop", "kiosk", "sensor", "camera", "other"] },
      status: { type: "string", enum: ["active", "inactive", "maintenance", "decommissioned"] },
    },
  },
  Application: {
    type: "object",
    required: ["id", "key", "name", "category", "health", "ownerOrganizationId"],
    properties: {
      id: { type: "string" },
      key: { type: "string" },
      name: { type: "string" },
      category: { type: "string", enum: ["governance", "field", "portal", "workflow", "document", "security"] },
      health: { type: "string", enum: ["healthy", "degraded", "unavailable"] },
      ownerOrganizationId: { type: "string" },
    },
  },
  Policy: {
    type: "object",
    required: ["id", "name", "effect", "actions", "resources"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      effect: { type: "string", enum: ["allow", "deny"] },
      actions: { type: "array", items: { type: "string" } },
      resources: { type: "array", items: { type: "string" } },
    },
  },
  Workflow: {
    type: "object",
    required: ["id", "name", "type", "status", "steps", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      type: {
        type: "string",
        enum: ["approval", "onboarding", "procurement", "inspection", "incident"],
      },
      status: {
        type: "string",
        enum: ["draft", "active", "suspended", "archived"],
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          required: ["key", "name", "requiredPermission"],
          properties: {
            key: { type: "string" },
            name: { type: "string" },
            requiredPermission: { type: "string" },
          },
        },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  AuditEntry: {
    type: "object",
    required: ["id", "at", "actor", "action", "resource", "outcome", "hash"],
    properties: {
      id: { type: "string" },
      at: { type: "string", format: "date-time" },
      actor: { type: "string" },
      action: { type: "string" },
      resource: { type: "string" },
      outcome: { type: "string", enum: ["allowed", "denied"] },
      hash: { type: "string", description: "SHA-256 of previous entry hash + this entry (tamper-evident chain)" },
      metadata: { type: "object", additionalProperties: { type: "string" } },
    },
  },
  TokenResponse: {
    type: "object",
    required: ["token", "expiresIn"],
    properties: {
      token: { type: "string", description: "HS256 JWT" },
      expiresIn: { type: "integer", description: "Seconds until expiry" },
    },
  },
};

// ---------------------------------------------------------------------------
// Security scheme
// ---------------------------------------------------------------------------

const securitySchemes: { [k: string]: YamlValue } = {
  ApiKeyAuth: {
    type: "http",
    scheme: "bearer",
    description: "API key in the format `keyId:rawSecret`. The server validates via HMAC-SHA256 and constant-time comparison.",
    bearerFormat: "keyId:rawSecret",
  },
  BearerJwt: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "HS256 JWT issued by POST /api/v1/auth/token. Include in Authorization header.",
  },
};

// ---------------------------------------------------------------------------
// Reusable parameters
// ---------------------------------------------------------------------------

const parameters: { [k: string]: YamlValue } = {
  limitParam: {
    name: "limit",
    in: "query",
    schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
    description: "Number of items per page",
  },
  offsetParam: {
    name: "offset",
    in: "query",
    schema: { type: "integer", default: 0, minimum: 0 },
    description: "Number of items to skip",
  },
  idPath: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string" },
    description: "Resource ID",
  },
};

// ---------------------------------------------------------------------------
// Helper to build paginated list response
// ---------------------------------------------------------------------------

function paginatedList(schemaRef: string): YamlValue {
  return {
    type: "object",
    required: ["items", "count", "total", "limit", "offset"],
    properties: {
      items: { type: "array", items: { "$ref": `#/components/schemas/${schemaRef}` } },
      count: { type: "integer" },
      total: { type: "integer" },
      limit: { type: "integer" },
      offset: { type: "integer" },
    },
  };
}

function jsonResponse(code: number, schema: YamlValue): { [k: string]: YamlValue } {
  return {
    [String(code)]: {
      description: code === 200 ? "OK" : code === 201 ? "Created" : "Response",
      content: { "application/json": { schema } },
    },
  };
}

function errorResponses(...codes: number[]): { [k: string]: YamlValue } {
  const out: { [k: string]: YamlValue } = {};
  const msgs: { [k: number]: string } = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
  };
  for (const c of codes) {
    out[String(c)] = {
      description: msgs[c] ?? "Error",
      content: { "application/json": { schema: { "$ref": "#/components/schemas/ErrorResponse" } } },
    };
  }
  return out;
}

const authSecurity: YamlValue = [{ ApiKeyAuth: [] }, { BearerJwt: [] }];

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const paths: { [k: string]: YamlValue } = {
  // ── Health ──────────────────────────────────────────────────────────────
  "/api/v1/health": {
    get: {
      operationId: "getHealth",
      summary: "Health check",
      tags: ["System"],
      responses: {
        "200": {
          description: "Service is healthy",
          content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } } } },
        },
      },
    },
  },
  "/api/v1/info": {
    get: {
      operationId: "getInfo",
      summary: "Platform version and metadata",
      tags: ["System"],
      responses: {
        "200": {
          description: "Platform info",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  version: { type: "string" },
                  nodeVersion: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  "/api/v1/auth/token": {
    post: {
      operationId: "issueToken",
      summary: "Issue a JWT from an API key credential",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["credential"],
              properties: { credential: { type: "string", example: "keyId:rawSecret" } },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/TokenResponse" }),
        ...errorResponses(400, 401, 429),
      },
    },
  },

  // ── Dashboard ────────────────────────────────────────────────────────────
  "/api/v1/dashboard": {
    get: {
      operationId: "getDashboard",
      summary: "Role-filtered governance dashboard",
      tags: ["Dashboard"],
      security: authSecurity,
      responses: {
        "200": {
          description: "Dashboard view filtered by caller permissions",
          content: { "application/json": { schema: { type: "object" } } },
        },
        ...errorResponses(401, 403),
      },
    },
  },

  // ── Organizations (list + CRUD) ──────────────────────────────────────────
  "/api/v1/organizations": {
    get: {
      operationId: "listOrganizations",
      summary: "Paginated list of organizations",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("Organization")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createOrganization",
      summary: "Create an organization",
      tags: ["Organizations"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "type"],
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["headquarters", "branch", "site", "partner"] },
                parentId: { type: "string", description: "Required for non-headquarters types" },
                status: { type: "string", enum: ["active", "inactive", "suspended"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/Organization" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/organizations/{id}": {
    get: {
      operationId: "getOrganization",
      summary: "Get an organization by ID",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Organization" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateOrganization",
      summary: "Update an organization",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                status: { type: "string", enum: ["active", "inactive", "suspended"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Organization" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteOrganization",
      summary: "Delete an organization",
      tags: ["Organizations"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Users ────────────────────────────────────────────────────────────────
  "/api/v1/users": {
    get: {
      operationId: "listUsers",
      summary: "Paginated list of users",
      tags: ["Users"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("User")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createUser",
      summary: "Create a user",
      tags: ["Users"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["organizationId", "displayName", "email"],
              properties: {
                organizationId: { type: "string" },
                displayName: { type: "string" },
                email: { type: "string", format: "email" },
                status: { type: "string", enum: ["active", "inactive", "suspended"] },
                roleIds: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/User" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/users/{id}": {
    get: {
      operationId: "getUser",
      summary: "Get a user by ID",
      tags: ["Users"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/User" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateUser",
      summary: "Update a user",
      tags: ["Users"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                displayName: { type: "string" },
                status: { type: "string", enum: ["active", "inactive", "suspended"] },
                roleIds: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/User" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteUser",
      summary: "Soft-delete a user (status → deactivated)",
      tags: ["Users"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deactivated" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Roles ────────────────────────────────────────────────────────────────
  "/api/v1/roles": {
    get: {
      operationId: "listRoles",
      summary: "Paginated list of roles",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("Role")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createRole",
      summary: "Create a role",
      tags: ["Roles"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "scope", "permissions"],
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                scope: { type: "string", enum: ["global", "organization", "site"] },
                permissions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/Role" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/roles/{id}": {
    get: {
      operationId: "getRole",
      summary: "Get a role by ID",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Role" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateRole",
      summary: "Update a role",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                permissions: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Role" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteRole",
      summary: "Delete a role",
      tags: ["Roles"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Devices ──────────────────────────────────────────────────────────────
  "/api/v1/devices": {
    get: {
      operationId: "listDevices",
      summary: "Paginated list of devices",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("Device")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createDevice",
      summary: "Register a device",
      tags: ["Devices"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["organizationId", "kind"],
              properties: {
                organizationId: { type: "string" },
                kind: { type: "string", enum: ["phone", "tablet", "laptop", "kiosk", "sensor", "camera", "other"] },
                status: { type: "string", enum: ["active", "inactive", "maintenance", "decommissioned"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/Device" }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/devices/{id}": {
    get: {
      operationId: "getDevice",
      summary: "Get a device by ID",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Device" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateDevice",
      summary: "Update a device",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["active", "inactive", "maintenance", "decommissioned"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Device" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteDevice",
      summary: "Remove a device",
      tags: ["Devices"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Applications ─────────────────────────────────────────────────────────
  "/api/v1/applications": {
    get: {
      operationId: "listApplications",
      summary: "Paginated list of applications",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("Application")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createApplication",
      summary: "Register an application",
      tags: ["Applications"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["key", "name", "category", "ownerOrganizationId"],
              properties: {
                key: { type: "string", description: "Unique slug for the application" },
                name: { type: "string" },
                category: { type: "string", enum: ["governance", "field", "portal", "workflow", "document", "security"] },
                health: { type: "string", enum: ["healthy", "degraded", "unavailable"] },
                ownerOrganizationId: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/Application" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/applications/{id}": {
    get: {
      operationId: "getApplication",
      summary: "Get an application by ID",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Application" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateApplication",
      summary: "Update an application",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                health: { type: "string", enum: ["healthy", "degraded", "unavailable"] },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Application" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteApplication",
      summary: "Remove an application",
      tags: ["Applications"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Governance ───────────────────────────────────────────────────────────
  "/api/v1/governance/evaluate": {
    post: {
      operationId: "evaluateAccess",
      summary: "Evaluate an ABAC access decision",
      tags: ["Governance"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["subject", "resource", "action"],
              properties: {
                subject: { type: "string" },
                resource: { type: "string" },
                action: { type: "string" },
                attributes: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      responses: {
        "200": {
          description: "Access decision",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["decision"],
                properties: {
                  decision: { type: "string", enum: ["allow", "deny"] },
                  matchedPolicyIds: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/governance/audit": {
    get: {
      operationId: "getAuditLog",
      summary: "Retrieve recent audit log entries (requires audit:read)",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [
        {
          name: "limit",
          in: "query",
          schema: { type: "integer", default: 50, minimum: 1, maximum: 200 },
          description: "Maximum number of recent entries to return",
        },
      ],
      responses: {
        "200": {
          description: "Audit entries",
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["entries", "count"],
                properties: {
                  entries: { type: "array", items: { "$ref": "#/components/schemas/AuditEntry" } },
                  count: { type: "integer" },
                },
              },
            },
          },
        },
        ...errorResponses(401, 403),
      },
    },
  },
  "/api/v1/governance/policies": {
    get: {
      operationId: "listPolicies",
      summary: "Paginated list of policies",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("Policy")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createPolicy",
      summary: "Create a policy",
      tags: ["Governance"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "effect", "actions", "resources"],
              properties: {
                name: { type: "string" },
                effect: { type: "string", enum: ["allow", "deny"] },
                actions: { type: "array", items: { type: "string" } },
                resources: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/Policy" }),
        ...errorResponses(400, 401, 403, 409),
      },
    },
  },
  "/api/v1/governance/policies/{id}": {
    get: {
      operationId: "getPolicy",
      summary: "Get a policy by ID",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Policy" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updatePolicy",
      summary: "Update a policy",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                effect: { type: "string", enum: ["allow", "deny"] },
                actions: { type: "array", items: { type: "string" } },
                resources: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Policy" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deletePolicy",
      summary: "Delete a policy",
      tags: ["Governance"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },

  // ── Workflows ────────────────────────────────────────────────────────────
  "/api/v1/workflows": {
    get: {
      operationId: "listWorkflows",
      summary: "Paginated list of workflows (optional ?type= and ?status= filters)",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [
        { "$ref": "#/components/parameters/limitParam" },
        { "$ref": "#/components/parameters/offsetParam" },
        {
          name: "type",
          in: "query",
          schema: { type: "string", enum: ["approval", "onboarding", "procurement", "inspection", "incident"] },
          description: "Filter by workflow type",
        },
        {
          name: "status",
          in: "query",
          schema: { type: "string", enum: ["draft", "active", "suspended", "archived"] },
          description: "Filter by workflow status",
        },
      ],
      responses: {
        ...jsonResponse(200, paginatedList("Workflow")),
        ...errorResponses(401, 403),
      },
    },
    post: {
      operationId: "createWorkflow",
      summary: "Create a workflow",
      tags: ["Workflows"],
      security: authSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "type", "steps"],
              properties: {
                name: { type: "string" },
                type: { type: "string", enum: ["approval", "onboarding", "procurement", "inspection", "incident"] },
                status: { type: "string", enum: ["draft", "active", "suspended", "archived"] },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["key", "name", "requiredPermission"],
                    properties: {
                      key: { type: "string" },
                      name: { type: "string" },
                      requiredPermission: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(201, { "$ref": "#/components/schemas/Workflow" }),
        ...errorResponses(400, 401, 403),
      },
    },
  },
  "/api/v1/workflows/{id}": {
    get: {
      operationId: "getWorkflow",
      summary: "Get a workflow by ID",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Workflow" }),
        ...errorResponses(401, 403, 404),
      },
    },
    put: {
      operationId: "updateWorkflow",
      summary: "Update a workflow",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                status: { type: "string", enum: ["draft", "active", "suspended", "archived"] },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["key", "name", "requiredPermission"],
                    properties: {
                      key: { type: "string" },
                      name: { type: "string" },
                      requiredPermission: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        ...jsonResponse(200, { "$ref": "#/components/schemas/Workflow" }),
        ...errorResponses(400, 401, 403, 404),
      },
    },
    delete: {
      operationId: "deleteWorkflow",
      summary: "Delete a workflow",
      tags: ["Workflows"],
      security: authSecurity,
      parameters: [{ "$ref": "#/components/parameters/idPath" }],
      responses: { "204": { description: "Deleted" }, ...errorResponses(401, 403, 404) },
    },
  },
};

// ---------------------------------------------------------------------------
// Assemble and write
// ---------------------------------------------------------------------------

const spec: { [k: string]: YamlValue } = {
  openapi: "3.1.0",
  info: {
    title: "Construction Enterprise Operating Platform API",
    version: "0.5.0",
    description:
      "Unified enterprise operating platform for construction company governance, business portal, field OS, and AI governance.",
    contact: { name: "Platform Team" },
    license: { name: "MIT" },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "http://localhost:8080", description: "Docker compose" },
  ],
  tags: [
    { name: "System",       description: "Health and metadata endpoints" },
    { name: "Auth",         description: "JWT token issuance" },
    { name: "Dashboard",    description: "Governance dashboard" },
    { name: "Organizations",description: "Organization management" },
    { name: "Users",        description: "User management" },
    { name: "Roles",        description: "Role management" },
    { name: "Devices",      description: "Field device management" },
    { name: "Applications", description: "Application registry" },
    { name: "Governance",   description: "Policy engine, audit log, ABAC evaluation" },
    { name: "Workflows",    description: "Workflow templates and CRUD" },
  ],
  paths,
  components: {
    schemas,
    parameters,
    securitySchemes,
  },
};

const outDir = join(import.meta.dirname ?? ".", "..", "docs");
const outPath = join(outDir, "openapi.yaml");
await mkdir(outDir, { recursive: true });
await writeFile(outPath, toYaml(spec), "utf8");
console.log(`✅ OpenAPI spec written to ${outPath}`);
