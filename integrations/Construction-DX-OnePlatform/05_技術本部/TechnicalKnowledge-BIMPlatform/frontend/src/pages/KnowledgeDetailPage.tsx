import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../api/client';

type Article = {
  id: number;
  title: string;
  body_markdown: string | null;
  doc_type: string | null;
  work_type: string | null;
  tags: string[] | null;
  author_name: string | null;
  view_count: number;
};

export default function KnowledgeDetailPage() {
  const { articleId } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) return;
    apiClient
      .get<Article>(`/knowledge/${articleId}`)
      .then((r) => setArticle(r.data))
      .catch((e) => setError(e.message));
  }, [articleId]);

  if (error) return <p className="text-tech-danger">エラー: {error}</p>;
  if (!article) return <p>読み込み中…</p>;

  return (
    <article className="bg-white rounded shadow p-6 space-y-4">
      <header className="border-b pb-2">
        <h2 className="text-2xl font-bold">{article.title}</h2>
        <div className="text-sm text-gray-500">
          {article.doc_type ?? '-'} / {article.work_type ?? '-'} / {article.author_name ?? '-'} /{' '}
          {article.view_count} views
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {article.tags.map((t) => (
              <span key={t} className="text-xs bg-tech-accent/10 text-tech-accent px-2 rounded">
                {t}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="prose max-w-none">
        <ReactMarkdown>{article.body_markdown ?? '(本文なし)'}</ReactMarkdown>
      </div>
    </article>
  );
}
