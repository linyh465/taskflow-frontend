'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTasks } from '@/lib/api';
import { Task, Status } from '@/types';
import { TaskCard } from '@/components/tasks/TaskCard';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskModal } from '@/components/tasks/TaskModal';

const STATUS_META: Record<Status, { label: string }> = {
  TODO:        { label: '待處理' },
  IN_PROGRESS: { label: '進行中' },
  DONE:        { label: '已完成' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
    retry: false,
  });

  const filtered = filterStatus === 'ALL' ? tasks : tasks.filter(t => t.status === filterStatus);
  const counts = {
    ALL: tasks.length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            ＋ 新增任務
          </button>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100">
            登出
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-xl p-4 text-left transition border-2 ${filterStatus === s ? 'border-indigo-400 bg-indigo-50' : 'border-transparent bg-white hover:border-gray-200'}`}>
              <div className="text-2xl font-bold text-gray-900">{counts[s]}</div>
              <div className="text-xs text-gray-500 mt-1">{s === 'ALL' ? '全部任務' : STATUS_META[s].label}</div>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">共 <span className="font-semibold text-gray-800">{filtered.length}</span> 項任務</p>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {(['list', 'kanban'] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${viewMode === m ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                {m === 'list' ? '📋 列表' : '🗂 看板'}
              </button>
            ))}
          </div>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">還沒有任何任務</h2>
            <button onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium mt-4">
              建立第一個任務
            </button>
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanBoard tasks={filtered} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(task => (
              <div key={task.id} onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="cursor-pointer">
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        )}
      </main>
      <TaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} editingTask={editingTask} />
    </div>
  );
}
