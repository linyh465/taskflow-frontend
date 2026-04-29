'use client';
import { Task, Status, Priority } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTask, deleteTask } from '@/lib/api';

const priorityColor: Record<Priority, string> = {
  LOW:    'bg-green-100 text-green-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH:   'bg-red-100 text-red-700',
};

const statusNext: Record<Status, Status> = {
  TODO:        'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE:        'TODO',
};

export function TaskCard({ task }: { task: Task }) {
  const qc = useQueryClient();
  const { mutate: toggleStatus } = useMutation({
    mutationFn: () => updateTask(task.id, { status: statusNext[task.status] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
  const { mutate: remove } = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-800">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor[task.priority]}`}>
          {task.priority}
        </span>
      </div>
      {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
      <div className="flex items-center gap-2 mt-2">
        <button onClick={() => toggleStatus()}
          className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
          → {statusNext[task.status]}
        </button>
        <button onClick={() => remove()}
          className="text-xs px-3 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
          刪除
        </button>
      </div>
    </div>
  );
}
