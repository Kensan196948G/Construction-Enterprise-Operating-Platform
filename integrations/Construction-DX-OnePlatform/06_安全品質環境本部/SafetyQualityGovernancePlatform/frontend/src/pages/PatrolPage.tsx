import { useState } from "react";
import { api, endpoints } from "../api/client";
import PhotoAttach from "../components/PhotoAttach";

const DEFAULT_CHECKLIST = [
  "ヘルメット着用",
  "安全帯使用",
  "立入禁止区域の表示",
  "重機接触防止策",
  "整理整頓 5S",
];

type Result = "pass" | "fail" | "na";

export default function PatrolPage() {
  const [date, setDate] = useState("");
  const [rating, setRating] = useState("B");
  const [items, setItems] = useState(
    DEFAULT_CHECKLIST.map((item) => ({ item, result: "pass" as Result, comment: "" })),
  );
  const [submitting, setSubmitting] = useState(false);

  const updateResult = (i: number, v: Result) => {
    const next = [...items];
    next[i].result = v;
    setItems(next);
  };
  const updateComment = (i: number, v: string) => {
    const next = [...items];
    next[i].comment = v;
    setItems(next);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post(endpoints.patrols, {
        patrol_date: date,
        checklist: items,
        overall_rating: rating,
        correction_status: "open",
      });
      alert("登録しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white p-4 rounded-xl shadow max-w-2xl mx-auto space-y-3 pb-footer-nav md:pb-4"
      role="region"
      aria-label="安全パトロール"
    >
      <h2 className="font-bold text-lg">安全パトロール</h2>
      <label className="block">
        <span className="text-sm">巡視日</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border rounded p-3 w-full min-h-tap text-base"
          aria-label="巡視日"
        />
      </label>

      {/* モバイル: カード型 / md: 表 */}
      <ul className="space-y-3 md:hidden" role="list">
        {items.map((it, i) => (
          <li key={i} className="border rounded-lg p-3 space-y-2">
            <p className="font-bold">{it.item}</p>
            <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label={`${it.item} の結果`}>
              {(
                [
                  { v: "pass" as Result, l: "良" },
                  { v: "fail" as Result, l: "不可" },
                  { v: "na" as Result, l: "対象外" },
                ]
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={it.result === o.v}
                  onClick={() => updateResult(i, o.v)}
                  className={
                    "min-h-tap rounded-lg font-bold touch-manipulation " +
                    (it.result === o.v
                      ? o.v === "pass"
                        ? "bg-cdx-env text-white"
                        : o.v === "fail"
                          ? "bg-cdx-safety text-white"
                          : "bg-slate-400 text-white"
                      : "bg-slate-100 text-slate-700")
                  }
                >
                  {o.l}
                </button>
              ))}
            </div>
            <input
              value={it.comment}
              onChange={(e) => updateComment(i, e.target.value)}
              className="border rounded p-2 w-full"
              placeholder="備考"
              aria-label={`${it.item} 備考`}
            />
          </li>
        ))}
      </ul>

      <table className="w-full text-sm hidden md:table">
        <thead>
          <tr>
            <th className="text-left">点検項目</th>
            <th>結果</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-t">
              <td className="py-1">{it.item}</td>
              <td>
                <select
                  value={it.result}
                  onChange={(e) => updateResult(i, e.target.value as Result)}
                  className="border rounded p-1"
                  aria-label={`${it.item} 結果`}
                >
                  <option value="pass">良</option>
                  <option value="fail">不可</option>
                  <option value="na">対象外</option>
                </select>
              </td>
              <td>
                <input
                  value={it.comment}
                  onChange={(e) => updateComment(i, e.target.value)}
                  className="border rounded p-1 w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <label className="block">
        <span className="text-sm">総合評価</span>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="border rounded p-3 min-h-tap text-base"
          aria-label="総合評価"
        >
          <option>A</option>
          <option>B</option>
          <option>C</option>
          <option>D</option>
        </select>
      </label>
      <PhotoAttach onPhotos={() => {}} />
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-cdx-quality text-white py-3 rounded-lg font-bold min-h-tap disabled:opacity-60"
      >
        {submitting ? "登録中…" : "登録"}
      </button>
    </div>
  );
}
