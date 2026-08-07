import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useAuthStore } from "@/store/auth";

interface Source {
  article_id: string;
  title: string;
  score: number;
  snippet: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

/** Parse a chunk of SSE text, yielding {event, data} pairs. */
function* parseSse(buffer: string): Iterable<{ event: string; data: string }> {
  for (const block of buffer.split("\n\n")) {
    if (!block.trim()) continue;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
    }
    yield { event, data: dataLines.join("\n") };
  }
}

export default function AiHelpDeskPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "", sources: [] }
    ]);
    setLoading(true);

    const updateAssistant = (mut: (m: Message) => Message) =>
      setMessages((prev) => {
        const next = prev.slice();
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant") {
            next[i] = mut(next[i]);
            break;
          }
        }
        return next;
      });

    try {
      const token = useAuthStore.getState().token;
      const resp = await fetch("/api/v1/ai/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query: q, top_k: 3 })
      });
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lastBoundary = buffer.lastIndexOf("\n\n");
        if (lastBoundary === -1) continue;
        const ready = buffer.slice(0, lastBoundary + 2);
        buffer = buffer.slice(lastBoundary + 2);

        for (const ev of parseSse(ready)) {
          if (ev.event === "token") {
            try {
              const { text } = JSON.parse(ev.data);
              updateAssistant((m) => ({ ...m, content: m.content + (text || "") }));
            } catch {
              /* ignore malformed token */
            }
          } else if (ev.event === "sources") {
            try {
              const sources: Source[] = JSON.parse(ev.data);
              updateAssistant((m) => ({ ...m, sources }));
            } catch {
              /* ignore */
            }
          }
        }
      }
    } catch {
      updateAssistant((m) => ({ ...m, content: m.content || "（AI 応答に失敗しました）" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">AI HelpDesk</h2>
      <div className="bg-white rounded shadow-sm p-4 h-[480px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm">
            IT に関する質問を入力してください。ナレッジから回答します。
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded p-3 ${m.role === "user" ? "bg-brand/10 ml-12" : "bg-slate-100 mr-12"}`}
          >
            <div className="text-xs font-bold mb-1">{m.role === "user" ? "あなた" : "AI"}</div>
            <ReactMarkdown>{m.content}</ReactMarkdown>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-2 text-xs">
                <div className="font-semibold">参照ナレッジ:</div>
                <ul className="list-disc ml-5">
                  {m.sources.map((s) => (
                    <li key={s.article_id}>
                      {s.title} (score: {s.score.toFixed(2)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">回答生成中…</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="質問を入力 (例: VPN がつながらない)"
        />
        <button className="px-4 py-2 bg-brand text-white rounded" onClick={send} disabled={loading}>
          送信
        </button>
      </div>
    </div>
  );
}
