import { useEffect, useState } from 'react';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { apiClient } from '@/api/client';

interface TaskApi {
  id: number;
  task_id: string;
  task_name: string;
  planned_start?: string;
  planned_end?: string;
  progress_rate: number;
}

export default function ScheduleGanttPage() {
  const [projectId, setProjectId] = useState<number>(1);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    apiClient
      .get<TaskApi[]>(`/projects/${projectId}/schedule`)
      .then((r) => {
        setTasks(
          r.data.map((t) => ({
            id: t.task_id,
            name: t.task_name,
            start: t.planned_start ? new Date(t.planned_start) : new Date(),
            end: t.planned_end ? new Date(t.planned_end) : new Date(),
            progress: Number(t.progress_rate ?? 0),
            type: 'task',
            isDisabled: false,
            styles: { progressColor: '#1f6feb', progressSelectedColor: '#1f6feb' },
          })),
        );
      })
      .catch(() => setTasks([]));
  }, [projectId]);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">工程表 (ガントチャート)</h2>
      <label className="text-sm mr-2">プロジェクトID:</label>
      <input
        type="number"
        value={projectId}
        onChange={(e) => setProjectId(Number(e.target.value) || 1)}
        className="border rounded px-2 py-1 mb-4"
      />
      <div className="bg-white border rounded overflow-x-auto">
        {tasks.length > 0 ? (
          <Gantt tasks={tasks} viewMode={ViewMode.Week} />
        ) : (
          <p className="p-6 text-gray-500">工程データがありません。</p>
        )}
      </div>
    </section>
  );
}
