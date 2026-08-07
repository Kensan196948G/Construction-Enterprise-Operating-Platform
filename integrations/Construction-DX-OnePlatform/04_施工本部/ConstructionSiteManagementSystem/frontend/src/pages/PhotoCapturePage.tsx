import { useState } from 'react';
import { db } from '@/db/dexie';
import { apiClient } from '@/api/client';

async function sha256Of(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function PhotoCapturePage() {
  const [projectId, setProjectId] = useState(1);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<unknown>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    const sha = await sha256Of(f);
    // ローカルに即保存
    await db.photos.add({
      projectId,
      capturedAt: new Date().toISOString(),
      blob: f,
      sha256: sha,
      syncStatus: 'pending',
    });

    // AI 分類 (オンライン時のみ)
    try {
      const fd = new FormData();
      fd.append('file', f);
      const r = await apiClient.post('/photos/ai-classify', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAiResult(r.data);
    } catch {
      setAiResult(null);
    }

    // アップロード試行
    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('project_id', String(projectId));
      await apiClient.post('/photos/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg('アップロード完了 (sha256: ' + sha.slice(0, 12) + '...)');
    } catch {
      setMsg('オフライン: IndexedDB に保存しました');
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">写真撮影 / AI分類</h2>
      <div className="bg-white border rounded p-4 max-w-xl grid gap-3">
        <label className="text-sm">
          プロジェクトID
          <input
            type="number"
            className="block border rounded px-2 py-1 w-full"
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
          />
        </label>
        <input type="file" accept="image/*" capture="environment" onChange={onFile} />
        {preview && <img src={preview} alt="preview" className="max-h-64 rounded border" />}
        {aiResult ? <pre className="text-xs bg-gray-100 p-2">{JSON.stringify(aiResult, null, 2)}</pre> : null}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      </div>
    </section>
  );
}
