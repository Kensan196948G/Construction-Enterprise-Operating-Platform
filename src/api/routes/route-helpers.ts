// FILE: src/api/routes/route-helpers.ts
/**
 * ルートハンドラ共通ヘルパー — 全ルートファイルで同一定義されていた関数を
 * 1 箇所に集約し、import で共有する。
 *
 * 挙動・レスポンス内容・ステータスコードは一切変更していない。
 */

import type { ServerResponse } from "node:http";
import type { IsoTimestamp } from "../../domain/common.ts";
import { writeJson } from "../router.ts";

// ---------------------------------------------------------------------------
// リクエストボディ抽出
// ---------------------------------------------------------------------------

/** リクエストボディから string 値を安全に取り出す。 */
export function str(body: unknown, key: string): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

/** リクエストボディから string[] 値を安全に取り出す。 */
export function strArr(body: unknown, key: string): string[] | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  if (!Array.isArray(v)) return undefined;
  if (!(v as unknown[]).every((x) => typeof x === "string")) return undefined;
  return v as string[];
}

/** リクエストボディから number 値を安全に取り出す。 */
export function num(body: unknown, key: string): number | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "number" ? v : undefined;
}

/** リクエストボディから boolean 値を安全に取り出す。 */
export function bool(body: unknown, key: string): boolean | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const v = (body as Record<string, unknown>)[key];
  return typeof v === "boolean" ? v : undefined;
}

/** リクエストボディに指定キーが存在するかどうか。 */
export function bodyHasKey(body: unknown, key: string): boolean {
  return typeof body === "object" && body !== null && key in (body as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// タイムスタンプ
// ---------------------------------------------------------------------------

/** 現在時刻の ISO タイムスタンプを返す。 */
export function nowTs(): IsoTimestamp {
  return new Date().toISOString() as IsoTimestamp;
}

// ---------------------------------------------------------------------------
// 共通 HTTP 応答
// ---------------------------------------------------------------------------

/**
 * 403 Forbidden — 権限不足。
 * `perm` は必須権限の文字列表現（例: "policy:read"）。
 */
export function forbidden(res: ServerResponse, perm: string): void {
  writeJson(res, 403, { error: "Forbidden", message: `requires '${perm}' permission` });
}

/**
 * 404 Not Found — 指定リソースが存在しない。
 * `resource` はエンティティ名（例: "organization", "user", "project"）。
 */
export function notFound(res: ServerResponse, resource: string): void {
  writeJson(res, 404, { error: "Not Found", message: `${resource} not found` });
}

/**
 * 400 Bad Request — バリデーション失敗。
 * `details` はドメインエラー詳細または検証結果の配列。
 */
export function badRequest(res: ServerResponse, details: unknown): void {
  writeJson(res, 400, { error: "Bad Request", message: "validation failed", details });
}

/**
 * 204 No Content — 削除成功などの空応答。
 */
export function noContent(res: ServerResponse): void {
  res.writeHead(204);
  res.end();
}
