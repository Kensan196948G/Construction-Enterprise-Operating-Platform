import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';

type Inquiry = {
  id: number;
  subject: string;
  question: string;
  answer: string | null;
  ai_draft_answer: string | null;
  status: string;
  related_article_ids: number[] | null;
};

type Citation = {
  article_id: number;
  title: string;
  score: number;
};

type AutoAnswer = {
  inquiry: Inquiry;
  citations: Citation[];
  source: string;
};

export default function InquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoAnswering, setAutoAnswering] = useState<number | null>(null);
  const [citationsById, setCitationsById] = useState<Record<number, Citation[]>>({});
  const [sourceById, setSourceById] = useState<Record<number, string>>({});

  const load = async () => {
    const r = await apiClient.get<Inquiry[]>('/inquiries');
    setItems(r.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/inquiries', { subject, question });
      setSubject('');
      setQuestion('');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const requestAutoAnswer = async (id: number) => {
    setAutoAnswering(id);
    try {
      const r = await apiClient.post<AutoAnswer>(`/inquiries/${id}/auto-answer`);
      setCitationsById((prev) => ({ ...prev, [id]: r.data.citations }));
      setSourceById((prev) => ({ ...prev, [id]: r.data.source }));
      setItems((prev) => prev.map((it) => (it.id === id ? r.data.inquiry : it)));
    } finally {
      setAutoAnswering(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">技術問合せ</h2>
      <form onSubmit={submit} className="bg-white rounded shadow p-4 space-y-2">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="件名"
          className="border rounded w-full px-3 py-2"
          required
        />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="質問内容を記入"
          className="border rounded w-full px-3 py-2 h-24"
          required
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-tech-primary text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {submitting ? '送信中…' : '送信 (AI ドラフト回答付き)'}
        </button>
      </form>

      <ul className="bg-white rounded shadow divide-y">
        {items.map((q) => (
          <li key={q.id} className="px-4 py-3 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-medium">{q.subject}</span>
              <span className="text-xs uppercase">{q.status}</span>
            </div>
            <p className="text-sm">{q.question}</p>
            {q.ai_draft_answer && (
              <p className="text-xs text-tech-accent bg-tech-accent/5 rounded p-2 whitespace-pre-wrap">
                AI: {q.ai_draft_answer}
                {sourceById[q.id] && (
                  <span className="ml-2 text-gray-500">[{sourceById[q.id]}]</span>
                )}
              </p>
            )}
            {citationsById[q.id]?.length > 0 && (
              <div className="text-xs text-gray-600">
                <span className="mr-1">引用元:</span>
                {citationsById[q.id].map((c) => (
                  <Link
                    key={c.article_id}
                    to={`/knowledge/${c.article_id}`}
                    className="mr-2 text-tech-primary hover:underline"
                  >
                    #{c.article_id} {c.title} ({(c.score * 100).toFixed(0)}%)
                  </Link>
                ))}
              </div>
            )}
            {q.answer && <p className="text-sm text-gray-700">回答: {q.answer}</p>}
            <div>
              <button
                type="button"
                onClick={() => requestAutoAnswer(q.id)}
                disabled={autoAnswering === q.id}
                className="text-xs border border-tech-primary text-tech-primary px-2 py-1 rounded hover:bg-tech-primary hover:text-white disabled:opacity-50"
              >
                {autoAnswering === q.id ? 'AI 生成中…' : 'AI 自動回答を生成'}
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="px-4 py-2 text-gray-400">問合せがありません</li>}
      </ul>
    </div>
  );
}
