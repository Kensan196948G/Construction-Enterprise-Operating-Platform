import { test, expect } from '@playwright/test';

const BASE = '/api/v1';

const VALID_EMAIL = process.env.TEST_EMAIL ?? 'admin@civil-ims.local';
const VALID_PASSWORD = process.env.TEST_PASSWORD ?? 'Admin1234!';

/** Obtain a JWT access token. */
async function getAuthToken(
  request: Parameters<Parameters<typeof test>[1]>[0]['request'],
): Promise<string> {
  const res = await request.post(`${BASE}/auth/login`, {
    data: { email: VALID_EMAIL, password: VALID_PASSWORD },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  const body = await res.json();
  return body.accessToken as string;
}

// ─── Projects ────────────────────────────────────────────────────────────────

test.describe('Projects CRUD API', () => {
  let token: string;
  let createdProjectId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('GET /projects without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/projects`);
    expect(res.status()).toBe(401);
  });

  test('GET /projects with auth returns 200 and array', async ({ request }) => {
    const res = await request.get(`${BASE}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // May be an array or a paginated object
    expect(typeof body).toBe('object');
    expect(body).not.toBeNull();
  });

  test('POST /projects creates a project and returns 201', async ({ request }) => {
    const res = await request.post(`${BASE}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        code: `E2E-TEST-${Date.now()}`,
        name: 'E2E テストプロジェクト',
        description: 'E2E 自動テスト用プロジェクト',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdProjectId = body.id as string;
  });

  test('GET /projects/:id returns 200 for created project', async ({ request }) => {
    test.skip(!createdProjectId, 'requires POST test to pass first');
    const res = await request.get(`${BASE}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /projects/:id returns 200 or 204 for created project', async ({ request }) => {
    test.skip(!createdProjectId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Corrective Actions ───────────────────────────────────────────────────────

test.describe('Corrective Actions CRUD API', () => {
  let token: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('GET /corrective-actions without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/corrective-actions`);
    expect(res.status()).toBe(401);
  });

  test('GET /corrective-actions with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/corrective-actions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /corrective-actions creates and returns 201', async ({ request }) => {
    const res = await request.post(`${BASE}/corrective-actions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        caNo: `CA-E2E-${Date.now()}`,
        sourceType: 'audit_finding',
        title: 'E2E テスト 是正処置',
        description: 'E2E 自動テストで作成した是正処置',
        severity: 'MEDIUM',
        isoStandard: '9001',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('GET /corrective-actions/:id returns 200 for created item', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.get(`${BASE}/corrective-actions/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /corrective-actions/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/corrective-actions/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Audit Plans ─────────────────────────────────────────────────────────────

test.describe('Audit Plans CRUD API', () => {
  let token: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('GET /audit/plans without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/audit/plans`);
    expect(res.status()).toBe(401);
  });

  test('GET /audit/plans with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/audit/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /audit/trails without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/audit/trails`);
    expect(res.status()).toBe(401);
  });

  test('GET /audit/trails with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/audit/trails`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /audit/plans creates and returns 201', async ({ request }) => {
    const res = await request.post(`${BASE}/audit/plans`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        planNo: `AP-E2E-${Date.now()}`,
        title: 'E2E テスト 内部監査計画',
        isoStandard: '9001',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PLANNED',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('DELETE /audit/plans/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/audit/plans/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Assets ──────────────────────────────────────────────────────────────────

test.describe('Assets CRUD API', () => {
  let token: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('GET /assets without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/assets`);
    expect(res.status()).toBe(401);
  });

  test('GET /assets with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/assets`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /assets creates and returns 201', async ({ request }) => {
    const res = await request.post(`${BASE}/assets`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        assetNo: `ASSET-E2E-${Date.now()}`,
        name: 'E2E テスト 設備',
        assetType: 'EQUIPMENT',
        category: 'CIVIL',
        location: 'テスト現場',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('GET /assets/:id returns 200 for created asset', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.get(`${BASE}/assets/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('DELETE /assets/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/assets/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── BIM (EIRs) ──────────────────────────────────────────────────────────────

test.describe('BIM EIR CRUD API', () => {
  let token: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('GET /bim/eirs without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/bim/eirs`);
    expect(res.status()).toBe(401);
  });

  test('GET /bim/eirs with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/bim/eirs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /bim/beps without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/bim/beps`);
    expect(res.status()).toBe(401);
  });

  test('GET /bim/beps with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/bim/beps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /bim/eirs creates and returns 201', async ({ request }) => {
    const res = await request.post(`${BASE}/bim/eirs`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'E2E テスト EIR v1',
        requirements: { lod: '200', formats: ['IFC4'] },
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('DELETE /bim/eirs/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/bim/eirs/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Quality Plans (project-scoped) ──────────────────────────────────────────

test.describe('Quality Plans CRUD API', () => {
  let token: string;
  let projectId: string;
  let createdPlanId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);

    // Fetch the seeded project (DEMO-2026-001)
    const projectRes = await request.get(`${BASE}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (projectRes.ok()) {
      const body = await projectRes.json();
      const items = Array.isArray(body) ? body : (body.items ?? body.data ?? []);
      if (items.length > 0) projectId = items[0].id as string;
    }
  });

  test('GET /quality/plans without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/quality/plans`);
    expect(res.status()).toBe(401);
  });

  test('GET /quality/plans with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/quality/plans`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /quality/inspections without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/quality/inspections`);
    expect(res.status()).toBe(401);
  });

  test('GET /quality/inspections with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/quality/inspections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /quality/plans creates and returns 201', async ({ request }) => {
    test.skip(!projectId, 'requires a seeded project');
    const res = await request.post(`${BASE}/quality/plans`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        projectId,
        title: 'E2E テスト 品質計画書',
        reason: 'E2E 自動テスト',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdPlanId = body.id as string;
  });

  test('DELETE /quality/plans/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdPlanId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/quality/plans/${createdPlanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Safety (project-scoped) ──────────────────────────────────────────────────

test.describe('Safety Hazards CRUD API', () => {
  let token: string;
  let projectId: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);

    const projectRes = await request.get(`${BASE}/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (projectRes.ok()) {
      const body = await projectRes.json();
      const items = Array.isArray(body) ? body : (body.items ?? body.data ?? []);
      if (items.length > 0) projectId = items[0].id as string;
    }
  });

  test('GET /safety/hazards without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/safety/hazards`);
    expect(res.status()).toBe(401);
  });

  test('GET /safety/hazards with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/safety/hazards`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /safety/near-misses without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/safety/near-misses`);
    expect(res.status()).toBe(401);
  });

  test('GET /safety/near-misses with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/safety/near-misses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /safety/hazards creates and returns 201', async ({ request }) => {
    test.skip(!projectId, 'requires a seeded project');
    const res = await request.post(`${BASE}/safety/hazards`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        projectId,
        workActivity: '高所作業',
        hazardType: '墜落・転落',
        hazardDescription: 'E2E テスト用ハザード',
        riskLevel: 'HIGH',
        controlMeasure: '安全帯着用',
        residualRiskLevel: 'LOW',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('DELETE /safety/hazards/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/safety/hazards/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Environment (aspects) ───────────────────────────────────────────────────

test.describe('Environment Aspects CRUD API', () => {
  let token: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('GET /environment/aspects without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/environment/aspects`);
    expect(res.status()).toBe(401);
  });

  test('GET /environment/aspects with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/environment/aspects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /environment/legal-requirements with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/environment/legal-requirements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('POST /environment/aspects creates and returns 201', async ({ request }) => {
    const res = await request.post(`${BASE}/environment/aspects`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        aspectName: 'E2E テスト 環境側面',
        activity: '試掘工事',
        environmentalImpact: '土壌汚染リスク',
        significance: 'MINOR',
        controlMeasure: '土壌管理計画の実施',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('DELETE /environment/aspects/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/environment/aspects/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});

// ─── Documents ───────────────────────────────────────────────────────────────

test.describe('Documents CRUD API', () => {
  let token: string;
  let categoryId: string;
  let createdId: string;

  test.beforeAll(async ({ request }) => {
    token = await getAuthToken(request);

    // Fetch seeded document categories
    const catRes = await request.get(`${BASE}/documents/categories/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (catRes.ok()) {
      const cats = await catRes.json();
      if (Array.isArray(cats) && cats.length > 0) categoryId = cats[0].id as string;
    }
  });

  test('GET /documents without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE}/documents`);
    expect(res.status()).toBe(401);
  });

  test('GET /documents with auth returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
  });

  test('GET /documents/categories/all with auth returns 200 and array', async ({ request }) => {
    const res = await request.get(`${BASE}/documents/categories/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /documents creates and returns 201', async ({ request }) => {
    test.skip(!categoryId, 'requires seeded document categories');
    const res = await request.post(`${BASE}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        documentNo: `E2E-DOC-${Date.now()}`,
        title: 'E2E テスト 文書',
        categoryId,
        content: 'E2E 自動テストで作成した文書コンテンツ',
        changeNote: '初版作成 (E2E テスト)',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toHaveProperty('id');
    createdId = body.id as string;
  });

  test('DELETE /documents/:id returns 200 or 204', async ({ request }) => {
    test.skip(!createdId, 'requires POST test to pass first');
    const res = await request.delete(`${BASE}/documents/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(res.status());
  });
});
