import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side health proxy.
 *
 * Browsers cannot reach `http://localhost:8001` etc. in production (that's the
 * end user's own machine). This route runs on the server (or in the `web`
 * container), where service hostnames are reachable, and proxies the call.
 *
 * Per-service base URLs are sourced from env vars (set in docker-compose / k8s)
 * and fall back to localhost ports for `next dev` use.
 */
const serviceBaseUrls: Record<string, string> = {
  auth: process.env.TENANT_IDENTITY_BASE_URL || "http://localhost:8001",
  audit: process.env.AUDIT_BASE_URL || "http://localhost:8003",
  object: process.env.OBJECT_BASE_URL || "http://localhost:8004",
  workflow: process.env.WORKFLOW_BASE_URL || "http://localhost:8005",
  "ai-gateway": process.env.AI_GATEWAY_BASE_URL || "http://localhost:8006",
  federation: process.env.FEDERATION_BASE_URL || "http://localhost:8007",
  dashboard: process.env.DASHBOARD_BASE_URL || "http://localhost:8009",
  policy: process.env.POLICY_BASE_URL || "http://localhost:8010",
  web: process.env.WEB_INTERNAL_BASE_URL || "http://localhost:3000",
};

const allowedEndpoints = new Set(["/health", "/healthz", "/api/health"]);

export async function GET(req: NextRequest) {
  const service = req.nextUrl.searchParams.get("service");
  const endpoint = req.nextUrl.searchParams.get("endpoint") || "/health";

  if (!service || !(service in serviceBaseUrls)) {
    return NextResponse.json(
      { status: "unknown", error: "unknown service" },
      { status: 400 },
    );
  }
  if (!allowedEndpoints.has(endpoint)) {
    return NextResponse.json(
      { status: "unknown", error: "endpoint not allowed" },
      { status: 400 },
    );
  }

  const base = serviceBaseUrls[service];
  const target = `${base}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const upstream = await fetch(target, { signal: controller.signal });
    clearTimeout(timeout);
    return NextResponse.json({
      service,
      status: upstream.ok ? "healthy" : "degraded",
      httpStatus: upstream.status,
    });
  } catch {
    return NextResponse.json({ service, status: "unknown" });
  }
}
