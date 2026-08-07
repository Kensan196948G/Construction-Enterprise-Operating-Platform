/**
 * 案件パイプライン Kanban (段階別カラム + DnD 対応).
 * @hello-pangea/dnd を使ってカード移動・サーバー側ステージ更新をサポート。
 */
import { useState, type ReactElement } from 'react';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { OpportunityDragCard } from './OpportunityDragCard';

export interface KanbanOpportunity {
  id: number;
  title: string;
  client_name?: string;
  stage: string;
  win_probability: number;
  expected_amount?: number | null;
  expected_close_date?: string | null;
}

interface Props {
  opportunities: KanbanOpportunity[];
  /** ステージ変更時のサーバー保存ハンドラ. 失敗時 reject すれば自動ロールバック. */
  onStageChange?: (opportunityId: number, nextStage: string) => Promise<void>;
}

const STAGES: { key: string; label: string; color: string }[] = [
  { key: 'lead', label: 'リード', color: 'bg-slate-100' },
  { key: 'qualified', label: '商談中', color: 'bg-sky-100' },
  { key: 'proposal', label: '提案', color: 'bg-indigo-100' },
  { key: 'bid', label: '入札', color: 'bg-amber-100' },
  { key: 'won', label: '受注', color: 'bg-emerald-100' },
  { key: 'lost', label: '失注', color: 'bg-rose-100' },
];

export function PipelineKanban({ opportunities, onStageChange }: Props): ReactElement {
  const [items, setItems] = useState<KanbanOpportunity[]>(opportunities);
  const [error, setError] = useState<string | null>(null);

  // props 変更で内部 state を同期 (簡易: useEffect 相当は呼び出し側責任)
  if (items !== opportunities && items.length === 0 && opportunities.length > 0) {
    setItems(opportunities);
  }

  const handleDragEnd = async (result: DropResult): Promise<void> => {
    setError(null);
    if (!result.destination) return;
    const nextStage = result.destination.droppableId;
    const oppId = Number(result.draggableId);
    const prev = items;
    const target = items.find((o) => o.id === oppId);
    if (!target || target.stage === nextStage) return;

    // 楽観的更新
    const optimistic = items.map((o) =>
      o.id === oppId ? { ...o, stage: nextStage } : o,
    );
    setItems(optimistic);

    if (onStageChange) {
      try {
        await onStageChange(oppId, nextStage);
      } catch (e) {
        // ロールバック
        setItems(prev);
        setError(
          e instanceof Error ? e.message : 'ステージ更新に失敗しました',
        );
      }
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded bg-rose-50 border border-rose-200 px-2 py-1 text-xs text-rose-700">
          {error}
        </div>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {STAGES.map((s) => {
            const stageItems = items.filter((o) => o.stage === s.key);
            const total = stageItems.reduce(
              (acc, o) => acc + (o.expected_amount ?? 0),
              0,
            );
            return (
              <Droppable droppableId={s.key} key={s.key}>
                {(provided, snapshot) => (
                  <section
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={
                      `${s.color} rounded-md p-2 flex flex-col gap-2 min-h-[200px] ` +
                      (snapshot.isDraggingOver ? 'ring-2 ring-indigo-300' : '')
                    }
                  >
                    <header className="flex items-baseline justify-between">
                      <h3 className="text-sm font-bold">{s.label}</h3>
                      <span className="text-xs text-gray-600">
                        {stageItems.length}件 / {total.toLocaleString()}円
                      </span>
                    </header>
                    <ul className="flex flex-col gap-2">
                      {stageItems.map((o, idx) => (
                        <OpportunityDragCard
                          key={o.id}
                          opportunity={o}
                          index={idx}
                        />
                      ))}
                      {provided.placeholder}
                    </ul>
                  </section>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
