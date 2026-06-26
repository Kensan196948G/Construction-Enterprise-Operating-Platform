/**
 * Generic file-backed repository using node:fs/promises.
 *
 * Data is stored as a JSON array in a single file per entity type. Writes are
 * atomic on POSIX systems: data is written to a `.tmp` file first, then renamed
 * over the target — a single syscall that is guaranteed to either fully succeed
 * or leave the old file intact.
 *
 * The in-memory cache is populated on first access (lazy) and stays consistent
 * through save/delete operations without re-reading the file. This works for
 * single-process deployments; multi-process writers would need a lock file.
 */

import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Repository } from "../ports.ts";

export class BaseFileRepository<T extends { id: string }> implements Repository<T, string> {
  readonly #filePath: string;
  readonly #tmpPath: string;
  #cache: Map<string, T> | null = null;
  #writeQueue: Promise<void> = Promise.resolve();

  constructor(dataDir: string, filename: string) {
    this.#filePath = join(dataDir, filename);
    this.#tmpPath = join(dataDir, `${filename}.tmp`);
  }

  async #load(): Promise<Map<string, T>> {
    if (this.#cache !== null) return this.#cache;

    let entries: T[] = [];
    try {
      const raw = await readFile(this.#filePath, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error(`Invalid repository file format: expected JSON array at ${this.#filePath}`);
      }
      if (!parsed.every((entry): entry is T =>
        typeof entry === "object" && entry !== null &&
        typeof (entry as { id?: unknown }).id === "string"
      )) {
        throw new Error(`Invalid repository file format: every entry must have a string id at ${this.#filePath}`);
      }
      entries = parsed;
    } catch (e) {
      // ENOENT → first run; start with empty store. Other errors propagate.
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }

    this.#cache = new Map(entries.map((e) => [e.id, e]));
    return this.#cache;
  }

  #enqueuedFlush(store: Map<string, T>): Promise<void> {
    const next = this.#writeQueue.then(() => this.#flush(store));
    this.#writeQueue = next.catch(() => {});
    return next;
  }

  async #flush(store: Map<string, T>): Promise<void> {
    const data = JSON.stringify([...store.values()], null, 2);
    await writeFile(this.#tmpPath, data, "utf8");
    await rename(this.#tmpPath, this.#filePath);
  }

  async findAll(): Promise<T[]> {
    const store = await this.#load();
    return [...store.values()];
  }

  async findById(id: string): Promise<T | null> {
    const store = await this.#load();
    return store.get(id) ?? null;
  }

  async save(entity: T): Promise<void> {
    const store = await this.#load();
    store.set(entity.id, entity);
    await this.#enqueuedFlush(store);
  }

  async delete(id: string): Promise<void> {
    const store = await this.#load();
    store.delete(id);
    await this.#enqueuedFlush(store);
  }
}

/** Ensure `dataDir` exists (creates all intermediate directories). */
export async function ensureDataDir(dataDir: string): Promise<void> {
  await mkdir(dataDir, { recursive: true });
}
