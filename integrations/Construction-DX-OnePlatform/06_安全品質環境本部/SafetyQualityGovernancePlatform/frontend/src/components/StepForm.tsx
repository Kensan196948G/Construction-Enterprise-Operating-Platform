import { ReactNode, useState, useRef, TouchEvent } from "react";

export interface StepDef {
  id: string;
  title: string;
  description?: string;
  render: () => ReactNode;
  /** バリデーション: false なら次へ進めない */
  isValid?: () => boolean;
}

export interface StepFormProps {
  steps: StepDef[];
  onComplete: () => void | Promise<void>;
  submitLabel?: string;
}

/**
 * モバイル向けステップフォーム (1 画面 1 質問風)。
 * - 大型ボタン (min-h-tap = 44px 以上)
 * - スワイプ操作 (左右) で前後遷移
 * - aria-live で進捗を読み上げ
 */
export default function StepForm({ steps, onComplete, submitLabel = "送信" }: StepFormProps) {
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const current = steps[idx];
  const isLast = idx === steps.length - 1;

  const goNext = () => {
    if (current.isValid && !current.isValid()) return;
    if (isLast) {
      setSubmitting(true);
      Promise.resolve(onComplete()).finally(() => setSubmitting(false));
    } else {
      setIdx((i) => Math.min(i + 1, steps.length - 1));
    }
  };
  const goPrev = () => setIdx((i) => Math.max(i - 1, 0));

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    // 50px 以上のスワイプを操作とみなす
    if (dx > 50) goPrev();
    else if (dx < -50) goNext();
  };

  return (
    <div
      className="bg-white rounded-xl shadow p-4 max-w-xl mx-auto"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500" aria-live="polite">
          ステップ {idx + 1} / {steps.length}
        </span>
        <div className="flex gap-1" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 w-6 rounded-full " +
                (i <= idx ? "bg-cdx-quality" : "bg-slate-200")
              }
            />
          ))}
        </div>
      </div>
      <h3 className="font-bold text-lg mb-1">{current.title}</h3>
      {current.description && (
        <p className="text-sm text-slate-600 mb-3">{current.description}</p>
      )}
      <div className="space-y-3">{current.render()}</div>
      <div className="flex gap-2 mt-5">
        <button
          type="button"
          onClick={goPrev}
          disabled={idx === 0}
          className="flex-1 min-h-tap py-3 rounded-lg border bg-slate-50 disabled:opacity-40 touch-manipulation"
          aria-label="前のステップへ"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={submitting}
          className="flex-1 min-h-tap py-3 rounded-lg bg-cdx-safety text-white font-bold disabled:opacity-60 touch-manipulation"
          aria-label={isLast ? submitLabel : "次のステップへ"}
        >
          {isLast ? (submitting ? "送信中…" : submitLabel) : "次へ →"}
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-400 text-center md:hidden">
        左右スワイプでも操作できます
      </p>
    </div>
  );
}
