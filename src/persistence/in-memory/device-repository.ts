import type { Device, DeviceId } from "../../domain/device.ts";
import type { OrganizationId } from "../../domain/organization.ts";
import type { DeviceRepository } from "../ports.ts";

/**
 * In-memory implementation of {@link DeviceRepository}.
 */
export class InMemoryDeviceRepository implements DeviceRepository {
  readonly #store = new Map<string, Device>();

  async findById(id: DeviceId): Promise<Device | null> {
    return this.#store.get(id as string) ?? null;
  }

  async findAll(): Promise<readonly Device[]> {
    return Array.from(this.#store.values());
  }

  async save(entity: Device): Promise<void> {
    this.#store.set(entity.id as string, entity);
  }

  async delete(id: DeviceId): Promise<void> {
    this.#store.delete(id as string);
  }

  async findByOrganization(orgId: OrganizationId): Promise<readonly Device[]> {
    const results: Device[] = [];
    for (const device of this.#store.values()) {
      if ((device.organizationId as string) === (orgId as string)) {
        results.push(device);
      }
    }
    return results;
  }
}
