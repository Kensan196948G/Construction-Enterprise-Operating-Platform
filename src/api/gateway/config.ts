/**
 * Gateway service configuration loader.
 *
 * Reads `CEOP_GATEWAY_SERVICES` (JSON array) from the environment. Each entry
 * is validated through {@link createGatewayService}; any invalid entry fails
 * startup (fail-closed) so a typo can never silently disable a service or
 * widen its permission boundary.
 */

import { err, ok, type Result, type ValidationIssue } from "../../domain/common.ts";
import {
  createGatewayService,
  type GatewayService,
  type GatewayServiceInput,
} from "../../domain/gateway-service.ts";

const CONFIG_ENV = "CEOP_GATEWAY_SERVICES";

export function loadGatewayServices(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Result<GatewayService[]> {
  const raw = env[CONFIG_ENV];
  if (raw === undefined || raw.trim() === "") {
    return ok([]);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return err([
      {
        path: CONFIG_ENV,
        message: `must be valid JSON: ${e instanceof Error ? e.message : String(e)}`,
      },
    ]);
  }
  if (!Array.isArray(parsed)) {
    return err([{ path: CONFIG_ENV, message: "must be a JSON array of gateway services" }]);
  }

  const services: GatewayService[] = [];
  const issues: ValidationIssue[] = [];
  parsed.forEach((item, index) => {
    if (typeof item !== "object" || item === null) {
      issues.push({ path: `${CONFIG_ENV}[${index}]`, message: "must be an object" });
      return;
    }
    const result = createGatewayService(item as GatewayServiceInput);
    if (result.ok) {
      services.push(result.value);
    } else {
      for (const issue of result.error) {
        issues.push({ path: `${CONFIG_ENV}[${index}].${issue.path}`, message: issue.message });
      }
    }
  });

  const ids = services.map((service) => service.id);
  if (new Set(ids).size !== ids.length) {
    issues.push({ path: CONFIG_ENV, message: "duplicate gateway service id" });
  }
  return issues.length > 0 ? err(issues) : ok(services);
}
