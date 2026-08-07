"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, HelpCircle, RefreshCw } from "lucide-react";

export type ServiceSlug =
  | "auth"
  | "audit"
  | "object"
  | "workflow"
  | "ai-gateway"
  | "federation"
  | "dashboard"
  | "policy"
  | "web";

export type ServiceStatus = {
  slug: ServiceSlug;
  name: string;
  port: number;
  status: "healthy" | "degraded" | "unknown";
  endpoint: string;
};

const services: ServiceStatus[] = [
  {
    slug: "auth",
    name: "Auth Service",
    port: 8001,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "audit",
    name: "Audit Service",
    port: 8003,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "object",
    name: "Object Service",
    port: 8004,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "workflow",
    name: "Workflow Service",
    port: 8005,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "ai-gateway",
    name: "AI Gateway",
    port: 8006,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "federation",
    name: "Federation Service",
    port: 8007,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "dashboard",
    name: "Dashboard Service",
    port: 8009,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "policy",
    name: "Policy Service",
    port: 8010,
    status: "unknown",
    endpoint: "/health",
  },
  {
    slug: "web",
    name: "Web UI",
    port: 3000,
    status: "unknown",
    endpoint: "/api/health",
  },
];

function StatusIcon({ status }: { status: ServiceStatus["status"] }) {
  if (status === "healthy") {
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
  if (status === "degraded") {
    return <AlertCircle className="w-4 h-4 text-amber-500" />;
  }
  return <HelpCircle className="w-4 h-4 text-gray-400" />;
}

function StatusBadge({ status }: { status: ServiceStatus["status"] }) {
  const classes = {
    healthy:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    degraded:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    unknown: "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[status]}`}
    >
      {status}
    </span>
  );
}

interface ServiceHealthProps {
  /** If true, shows a compact grid instead of a full table */
  compact?: boolean;
}

type HealthResponse = {
  service?: string;
  status?: ServiceStatus["status"];
  httpStatus?: number;
  error?: string;
};

async function fetchServiceStatus(
  svc: ServiceStatus,
): Promise<ServiceStatus["status"]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const params = new URLSearchParams({
      service: svc.slug,
      endpoint: svc.endpoint,
    });
    const res = await fetch(`/api/health?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return "unknown";
    const data = (await res.json()) as HealthResponse;
    return data.status ?? "unknown";
  } catch {
    return "unknown";
  } finally {
    clearTimeout(timer);
  }
}

export function ServiceHealth({ compact = false }: ServiceHealthProps) {
  const [serviceList, setServiceList] = useState<ServiceStatus[]>(services);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);

  async function checkHealth() {
    setChecking(true);
    const updated = await Promise.all(
      serviceList.map(async (svc) => ({
        ...svc,
        status: await fetchServiceStatus(svc),
      })),
    );
    setServiceList(updated);
    setLastChecked(new Date());
    setChecking(false);
  }

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const healthyCount = serviceList.filter((s) => s.status === "healthy").length;
  const degradedCount = serviceList.filter(
    (s) => s.status === "degraded",
  ).length;

  if (compact) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Service Health
          </h3>
          <button
            onClick={checkHealth}
            disabled={checking}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Refresh service health"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {serviceList.map((svc) => (
            <div
              key={svc.slug}
              className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300"
              title={`Port ${svc.port}`}
            >
              <StatusIcon status={svc.status} />
              <span className="truncate">
                {svc.name.replace(" Service", "")}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-green-600 dark:text-green-400">
            {healthyCount} healthy
          </span>
          {degradedCount > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {degradedCount} degraded
            </span>
          )}
          {lastChecked && (
            <span className="ml-auto">{lastChecked.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Service Health
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {healthyCount}/{serviceList.length} services healthy
          </p>
        </div>
        <button
          onClick={checkHealth}
          disabled={checking}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded border border-gray-200 dark:border-gray-600"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {serviceList.map((svc) => (
          <div
            key={svc.slug}
            className="flex items-center justify-between px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={svc.status} />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {svc.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  :{svc.port}
                  {svc.endpoint}
                </p>
              </div>
            </div>
            <StatusBadge status={svc.status} />
          </div>
        ))}
      </div>
      {lastChecked && (
        <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
          Last checked: {lastChecked.toLocaleString()}
        </div>
      )}
    </div>
  );
}
