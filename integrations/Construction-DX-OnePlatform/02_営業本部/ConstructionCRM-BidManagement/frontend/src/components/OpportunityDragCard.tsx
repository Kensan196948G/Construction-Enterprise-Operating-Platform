/**
 * Kanban DnD 対応の案件カード.
 * @hello-pangea/dnd の Draggable でラップして表示する。
 */
import type { ReactElement } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import type { KanbanOpportunity } from './PipelineKanban';

interface Props {
  opportunity: KanbanOpportunity;
  index: number;
}

export function OpportunityDragCard({ opportunity, index }: Props): ReactElement {
  return (
    <Draggable draggableId={String(opportunity.id)} index={index}>
      {(provided, snapshot) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={
            'rounded border bg-white p-2 text-xs shadow-sm hover:shadow ' +
            (snapshot.isDragging ? 'ring-2 ring-indigo-400' : '')
          }
        >
          <div className="font-semibold truncate">{opportunity.title}</div>
          {opportunity.client_name && (
            <div className="text-gray-500 truncate">{opportunity.client_name}</div>
          )}
          <div className="mt-1 flex items-center justify-between">
            <span>{(opportunity.expected_amount ?? 0).toLocaleString()}円</span>
            <span className="font-semibold">{opportunity.win_probability}%</span>
          </div>
        </li>
      )}
    </Draggable>
  );
}
