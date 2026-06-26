import { type CmdbPort, type ConfigurationItem } from "./ports.ts";

/**
 * In-memory {@link CmdbPort} implementation pre-loaded with construction
 * company configuration items. Intended for tests and local development.
 */
export class InMemoryCmdbAdapter implements CmdbPort {
  readonly #items: Map<string, ConfigurationItem>;

  constructor(items?: readonly ConfigurationItem[]) {
    this.#items = new Map((items ?? SEED_ITEMS).map((ci) => [ci.id, ci]));
  }

  getItem(id: string): Promise<ConfigurationItem | null> {
    return Promise.resolve(this.#items.get(id) ?? null);
  }

  listItems(type?: string): Promise<readonly ConfigurationItem[]> {
    const all = [...this.#items.values()];
    const result = type === undefined ? all : all.filter((ci) => ci.type === type);
    return Promise.resolve(result);
  }

  /** Add or replace a configuration item — useful in tests. */
  addItem(item: ConfigurationItem): void {
    this.#items.set(item.id, item);
  }
}

const SEED_ITEMS: readonly ConfigurationItem[] = [
  {
    id: "ci-001",
    type: "server",
    name: "Field Management Server",
    attributes: {
      os: "Ubuntu 22.04 LTS",
      location: "Head Office DC",
      status: "active",
      owner: "IT Operations",
    },
  },
  {
    id: "ci-002",
    type: "server",
    name: "Document Processing Server",
    attributes: {
      os: "Ubuntu 22.04 LTS",
      location: "Head Office DC",
      status: "active",
      owner: "IT Operations",
    },
  },
  {
    id: "ci-003",
    type: "network-equipment",
    name: "Core Switch — Head Office",
    attributes: {
      model: "Cisco Catalyst 9300",
      location: "Head Office DC",
      status: "active",
      owner: "Network Team",
    },
  },
  {
    id: "ci-004",
    type: "network-equipment",
    name: "Field Site VPN Gateway",
    attributes: {
      model: "Cisco ISR 4321",
      location: "Site A",
      status: "active",
      owner: "Network Team",
    },
  },
  {
    id: "ci-005",
    type: "tablet",
    name: "Field Inspection Tablet — Unit 01",
    attributes: {
      model: "iPad Pro 12.9",
      assignedTo: "Site Supervisor",
      location: "Site A",
      status: "active",
    },
  },
  {
    id: "ci-006",
    type: "tablet",
    name: "Field Inspection Tablet — Unit 02",
    attributes: {
      model: "iPad Pro 12.9",
      assignedTo: "Safety Officer",
      location: "Site B",
      status: "active",
    },
  },
  {
    id: "ci-007",
    type: "sensor",
    name: "Dust Level Sensor — Site A Entry",
    attributes: {
      protocol: "MQTT",
      location: "Site A",
      status: "active",
      calibratedAt: "2026-01-15",
    },
  },
  {
    id: "ci-008",
    type: "sensor",
    name: "Noise Level Sensor — Site B",
    attributes: {
      protocol: "MQTT",
      location: "Site B",
      status: "active",
      calibratedAt: "2026-02-10",
    },
  },
  {
    id: "ci-009",
    type: "application",
    name: "Construction Enterprise Operating Platform",
    attributes: {
      version: "0.1.0",
      environment: "production",
      owner: "Platform Team",
      status: "active",
    },
  },
  {
    id: "ci-010",
    type: "application",
    name: "Field OS Mobile App",
    attributes: {
      version: "1.3.2",
      environment: "production",
      owner: "Field Operations",
      status: "active",
    },
  },
];
