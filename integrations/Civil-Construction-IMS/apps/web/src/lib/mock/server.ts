/**
 * インメモリ モックサーバー
 *
 * `api-client.ts` の `request()` から呼ばれ、HTTP の代わりにメモリ上のデータで応答する。
 * - 初期データは data.ts を deep copy して保持（リロードでリセット、セッション中は変更を保持）。
 * - 主要コレクションは GET(list) / POST(create) / PUT(update) / DELETE をサポートする。
 * - 集計系 (dashboard / analytics) は固定オブジェクトを返す。
 *
 * レスポンス形状は各ページが期待する形に合わせる:
 *   - 配列をそのまま返すもの: /projects, /users, /quality/plans, /environment/aspects,
 *     /assets, /bim/beps, /audit/plans, /documents (DocumentRecord[])
 *   - { items, total, ... } を返すもの: /corrective-actions, /isms/*, /bcp/plans
 *   - 単一オブジェクト: /users/me, /dashboard/kpi, /analytics/*
 */
import * as seed from './data';

type Json = Record<string, unknown>;

// deep copy ヘルパー (構造化クローン or JSON フォールバック)
function clone<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

// ---- インメモリ ストア（セッション内で mutate される） -------------------
const store = {
  projects: clone(seed.projects),
  users: clone(seed.users),
  documents: clone(seed.documents),
  qualityPlans: clone(seed.qualityPlans),
  environmentAspects: clone(seed.environmentAspects),
  hazards: clone(seed.hazards),
  assets: clone(seed.assets),
  bimPlans: clone(seed.bimPlans),
  auditPlans: clone(seed.auditPlans),
  correctiveActions: clone(seed.correctiveActions),
  ismsAssets: clone(seed.ismsAssets),
  ismsIncidents: clone(seed.ismsIncidents),
  bcpPlans: clone(seed.bcpPlans),
};

// 連番 ID 生成（決定的な接頭辞 + カウンタ）
let idCounter = 1000;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-new-${idCounter}`;
}

/** モックでも未対応のパスは ApiError 相当を投げず空配列/404 的に扱うためのシグナル */
export class MockNotFound extends Error {}

interface Collection<T extends { id: string }> {
  list: T[];
  /** list レスポンスを期待形状に整形する (query: クエリパラメータ) */
  wrap?: (items: T[], query: URLSearchParams) => unknown;
  idPrefix: string;
  /** create 時のデフォルト値補完 */
  decorate?: (body: Json, id: string) => Json;
}

// パス → コレクション定義のマッピング
const collections: Record<string, Collection<{ id: string }>> = {
  '/projects': {
    list: store.projects,
    idPrefix: 'prj',
    decorate: (b, id) => ({
      id,
      code: b.code ?? 'KW-NEW',
      name: b.name ?? '新規工事案件',
      clientName: b.clientName ?? '未設定',
      status: b.status ?? 'DRAFT',
      startDate: b.startDate ?? null,
    }),
  },
  '/users': { list: store.users, idPrefix: 'user' },
  '/documents': { list: store.documents, idPrefix: 'doc' },
  '/quality/plans': { list: store.qualityPlans, idPrefix: 'qp' },
  '/environment/aspects': { list: store.environmentAspects, idPrefix: 'ea' },
  '/safety/hazards': {
    list: store.hazards,
    idPrefix: 'hz',
    wrap: (items) => ({ items, data: items, total: items.length }),
  },
  '/assets': { list: store.assets, idPrefix: 'as' },
  '/bim/beps': { list: store.bimPlans, idPrefix: 'bep' },
  '/audit/plans': { list: store.auditPlans, idPrefix: 'aud' },
  '/corrective-actions': {
    list: store.correctiveActions,
    idPrefix: 'ca',
    // status フィルタ + page/limit ページングを反映する（ページ側が data.totalPages を参照）
    wrap: (items, query) => {
      const status = query.get('status');
      const page = Math.max(1, Number(query.get('page')) || 1);
      const limit = Math.max(1, Number(query.get('limit')) || 20);
      const filtered = status
        ? items.filter((it) => (it as { status?: string }).status === status)
        : items;
      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return {
        items: filtered.slice(start, start + limit),
        total,
        page,
        limit,
        totalPages,
      };
    },
  },
  '/isms/assets': {
    list: store.ismsAssets,
    idPrefix: 'isa',
    wrap: (items) => ({ items, total: items.length }),
  },
  '/isms/incidents': {
    list: store.ismsIncidents,
    idPrefix: 'isi',
    wrap: (items) => ({ items, total: items.length }),
  },
  '/bcp/plans': {
    list: store.bcpPlans,
    idPrefix: 'bcp',
    wrap: (items) => ({ items, total: items.length }),
  },
};

// 集計・単一オブジェクト系 (GET 専用)
const singletons: Record<string, () => unknown> = {
  '/users/me': () => ({
    id: seed.DEMO_USER.id,
    organizationId: seed.DEMO_USER.organizationId,
    email: seed.DEMO_USER.email,
    displayName: seed.DEMO_USER.displayName,
    roles: seed.DEMO_USER.roles,
  }),
  '/dashboard/kpi': () => clone(seed.dashboardKpi),
  '/analytics/iso-compliance': () => clone(seed.isoCompliance),
  '/analytics/quality-kpi': () => clone(seed.qualityKpi),
  '/analytics/safety-kpi': () => clone(seed.safetyKpi),
  '/health': () => ({ status: 'ok', mock: true }),
};

/** パスからクエリパラメータを抽出する */
function parseQuery(path: string): URLSearchParams {
  const q = path.indexOf('?');
  return new URLSearchParams(q >= 0 ? path.slice(q + 1) : '');
}

/** パスからクエリ文字列を除去し、先頭を正規化する */
function normalizePath(path: string): string {
  let p = path.split('?')[0];
  if (!p.startsWith('/')) p = `/${p}`;
  // 末尾スラッシュ除去 (ルート以外)
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/** "/projects/prj-0001" → { base: "/projects", id: "prj-0001" } を試みる */
function splitIdPath(path: string): { base: string; id: string } | null {
  const idx = path.lastIndexOf('/');
  if (idx <= 0) return null;
  const base = path.slice(0, idx);
  const id = path.slice(idx + 1);
  if (collections[base]) return { base, id };
  return null;
}

/**
 * モックリクエストのエントリポイント。
 * @returns 解決済みレスポンス。204 相当は undefined。
 */
export function handleMockRequest<T>(
  method: string,
  rawPath: string,
  body?: unknown,
): T {
  const m = method.toUpperCase();
  const path = normalizePath(rawPath);
  const query = parseQuery(rawPath);
  const reqBody = (body && typeof body === 'object' ? body : {}) as Json;

  // 1) コレクション直 (list / create)
  const col = collections[path];
  if (col) {
    if (m === 'GET') {
      return (col.wrap ? col.wrap(col.list, query) : col.list) as T;
    }
    if (m === 'POST') {
      const id = nextId(col.idPrefix);
      const record = col.decorate
        ? col.decorate(reqBody, id)
        : { id, ...reqBody };
      (record as Json).id = id;
      col.list.unshift(record as { id: string });
      return record as T;
    }
  }

  // 2) 集計・単一系 (完全一致を ID パス解決より先に判定する)
  //    例: "/users/me" を "/users" の id="me" と誤解釈しないため。
  const single = singletons[path];
  if (single && m === 'GET') {
    return single() as T;
  }

  // 3) コレクション + ID (get / update / delete)
  const withId = splitIdPath(path);
  if (withId) {
    const c = collections[withId.base];
    const idx = c.list.findIndex((r) => r.id === withId.id);
    if (m === 'GET') {
      if (idx < 0) throw new MockNotFound(path);
      return c.list[idx] as T;
    }
    if (m === 'PUT' || m === 'PATCH') {
      if (idx < 0) throw new MockNotFound(path);
      c.list[idx] = { ...c.list[idx], ...reqBody, id: withId.id };
      return c.list[idx] as T;
    }
    if (m === 'DELETE') {
      if (idx >= 0) c.list.splice(idx, 1);
      return undefined as T;
    }
  }

  // 4) 未定義パス: GET は空配列、それ以外は空オブジェクトで安全側に倒す
  if (m === 'GET') return [] as unknown as T;
  return {} as T;
}

/** デモ認証: email/password を問わずデモユーザーを返す (モック専用) */
export function mockLogin() {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: seed.DEMO_USER.id,
      email: seed.DEMO_USER.email,
      displayName: seed.DEMO_USER.displayName,
      roles: seed.DEMO_USER.roles,
      organizationId: seed.DEMO_USER.organizationId,
    },
  };
}
