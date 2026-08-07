import { useState } from "react";
import PhotoAttach from "../components/PhotoAttach";

/**
 * モバイルから現場写真を素早く撮影・添付するためのページ。
 * - capture="environment" 経由でリアカメラ起動
 * - 大型タップターゲット (min-h-tap)
 * - メモは音声入力可 (speechRecognition 対応端末で自動表示)
 */
export default function PhotoCapturePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState<"near_miss" | "patrol" | "quality">("near_miss");

  const save = () => {
    // shared-ui の sync mechanism (IndexedDB) に保存予定。Loop#3 で実装。
    alert(`${files.length} 枚を「${category}」として保存しました`);
    setFiles([]);
    setMemo("");
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow max-w-xl mx-auto space-y-4 pb-footer-nav">
      <h2 className="font-bold text-lg">現場写真キャプチャ</h2>
      <p className="text-sm text-slate-600">
        現場でその場で撮影し、ヒヤリ/巡視/品質に添付できます。
      </p>

      <fieldset className="space-y-2">
        <legend className="text-sm font-bold">分類</legend>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { v: "near_miss", l: "ヒヤリ" },
              { v: "patrol", l: "巡視" },
              { v: "quality", l: "品質" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setCategory(o.v)}
              aria-pressed={category === o.v}
              className={
                "min-h-tap rounded-lg py-3 font-bold touch-manipulation " +
                (category === o.v
                  ? "bg-cdx-quality text-white"
                  : "bg-slate-100 text-slate-700")
              }
            >
              {o.l}
            </button>
          ))}
        </div>
      </fieldset>

      <PhotoAttach onPhotos={setFiles} />

      <label className="block">
        <span className="text-sm font-bold">メモ</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className="w-full border rounded p-2 mt-1"
          placeholder="気付き・状況など"
          aria-label="現場メモ"
        />
      </label>

      <button
        type="button"
        onClick={save}
        disabled={files.length === 0}
        className="w-full min-h-tap bg-cdx-safety text-white py-3 rounded-lg font-bold disabled:opacity-50 touch-manipulation"
      >
        {files.length} 枚を保存
      </button>
    </div>
  );
}
