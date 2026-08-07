import { useEffect, useState } from "react";
import { api } from "@/api/client";

interface Article {
  article_id: string;
  title: string;
  category?: string;
  summary?: string;
  content: string;
  updated_at: string;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<Article[]>([]);
  const [editor, setEditor] = useState({ title: "", category: "", content: "" });

  const load = () =>
    api.get<Article[]>("/knowledge").then((r) => setItems(r.data)).catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!editor.title || !editor.content) return;
    await api.post("/knowledge", editor);
    setEditor({ title: "", category: "", content: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">ナレッジ管理</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white rounded shadow-sm p-3 space-y-2">
          <h3 className="font-semibold">新規ナレッジ</h3>
          <input
            className="w-full border rounded px-2 py-1"
            placeholder="タイトル"
            value={editor.title}
            onChange={(e) => setEditor({ ...editor, title: e.target.value })}
          />
          <input
            className="w-full border rounded px-2 py-1"
            placeholder="カテゴリ"
            value={editor.category}
            onChange={(e) => setEditor({ ...editor, category: e.target.value })}
          />
          <textarea
            className="w-full border rounded px-2 py-1 h-40"
            placeholder="内容 (Markdown 可)"
            value={editor.content}
            onChange={(e) => setEditor({ ...editor, content: e.target.value })}
          />
          <button className="px-3 py-1 bg-brand text-white rounded" onClick={submit}>
            登録
          </button>
        </div>
        <div className="col-span-2 bg-white rounded shadow-sm p-3 space-y-2">
          <h3 className="font-semibold">登録済 ({items.length})</h3>
          <ul className="space-y-2 max-h-[480px] overflow-auto">
            {items.map((a) => (
              <li key={a.article_id} className="border-b py-2">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-slate-500">
                  {a.category ?? "uncategorized"} - 更新 {a.updated_at}
                </div>
                <div className="text-sm mt-1 line-clamp-2">{a.summary ?? a.content.slice(0, 200)}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
