'use client';
import { useState } from 'react';
import { Task, Status } from '@/types';
import { TaskCard } from './TaskCard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask } from '@/lib/api';

const COLUMNS: { id: Status; label: string; color: string }[] = [
  { id: 'TODO',        label: '📋 待處理', color: 'bg-slate-100 border-slate-200' },
  { id: 'IN_PROGRESS', label: '⚡ 進行中', color: 'bg-blue-50 border-blue-200'   },
  { id: 'DONE',        label: '✅ 已完成', color: 'bg-green-50 border-green-200' },
];

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const qc = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<Status | null>(null);

  const { mutate: moveTask } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => updateTask(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        const isOver = overColumn === col.id;
        return (
          <div key={col.id}
            onDragOver={e => { e.preventDefault(); setOverColumn(col.id); }}
            onDrop={e => {
              const id = e.dataTransfer.getData('taskId');
              const task = tasks.find(t => t.id === id);
              if (task && task.status !== col.id) moveTask({ id, status: col.id });
              setDraggingId(null); setOverColumn(null);
            }}
            className={`flex flex-col rounded-xl border-2 p-3 min-h-96 transition-all ${col.color} ${isOver ? 'scale-[1.01] shadow-md border-indigo-300' : ''}`}>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-semibold text-sm text-gray-700">{col.label}</span>
              <span className="bg-white text-xs text-gray-500 px-2 py-0.5 rounded-full">{colTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {colTasks.map(task => (
                <div key={task.id} draggable
                  onDragStart={e => { e.dataTransfer.setData('taskId', task.id); setDraggingId(task.id); }}
                  onDragEnd={() => { setDraggingId(null); setOverColumn(null); }}
                  className={`cursor-grab transition-opacity ${draggingId === task.id ? 'opacity-40' : ''}`}>
                  <TaskCard task={task} />
                </div>
              ))}
              {colTasks.length === 0 && !isOver && (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400">拖曳任務到這裡</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
