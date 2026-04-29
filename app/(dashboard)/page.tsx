'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/api';
import { Task, Status, Priority } from '@/types';

const STATUS_CONFIG = {
  TODO:        { label: '未開始', dot: '#3A3A3A', bg: '#F7F5F0', border: '#E8E4DC' },
  IN_PROGRESS: { label: '進行中', dot: '#4A6741', bg: '#F2F5F1', border: '#C8D4C6' },
  DONE:        { label: '已完成', dot: '#8C8680', bg: '#F7F5F0', border: '#E8E4DC' },
};

const PRIORITY_COLOR: Record<Priority, string> = {
  LOW: '#8C8680', MEDIUM: '#C45C3A', HIGH: '#8B2020',
};

function TaskRow({ task, onEdit, onDelete, onStatusChange }: {
  task: Task;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const next: Record<Status, Status> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
  const cfg = STATUS_CONFIG[task.status];

  return (
    <div style={{ borderBottom: '1px solid #E8E4DC' }}
      className="flex items-center gap-4 py-4 group hover:bg-white/60 transition-colors px-2 -mx-2">

      {/* Status dot — click to advance */}
      <button onClick={() => onStatusChange(task.id, next[task.status])}
        className="flex-shrink-0 w-3 h-3 rounded-full border transition-all hover:scale-125"
        style={{ background: task.status === 'TODO' ? 'transparent' : cfg.dot,
                 borderColor: cfg.dot }} />

      {/* Title */}
      <span onClick={() => onEdit(task)}
        className={`flex-1 text-sm cursor-pointer ${task.status === 'DONE' ? 'line-through text-[#8C8680]' : 'text-[#1C1A17]'}`}>
        {task.title}
      </span>

      {/* Priority */}
      <span className="text-xs font-mono hidden sm:block"
        style={{ color: PRIORITY_COLOR[task.priority] }}>
        {task.priority === 'HIGH' ? '高' : task.priority === 'MEDIUM' ? '中' : '低'}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className="text-xs text-[#8C8680] font-mono hidden md:block">
          {new Date(task.dueDate).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
        </span>
      )}

      {/* Delete */}
      <button onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-xs text-[#8C8680] hover:text-[#C45C3A] transition-all font-mono">
        ✕
      </button>
    </div>
  );
}

function TaskModal({ isOpen, onClose, task }: { isOpen: boolean; onClose: () => void; task: Task | null }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<Status>('TODO');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDesc(task.description || '');
      setStatus(task.status); setPriority(task.priority);
      setDueDate(task.dueDate?.slice(0, 10) || '');
    } else {
      setTitle(''); setDesc(''); setStatus('TODO'); setPriority('MEDIUM'); setDueDate('');
    }
  }, [task, isOpen]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const p = { title, description: desc, status, priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined };
      return task ? updateTask(task.id, p) : createTask(p);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onClose(); },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(28,26,23,0.4)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md p-6 sm:p-8" style={{ background: '#F7F5F0', borderRadius: '2px' }}>
        <div className="flex items-start justify-between mb-6">
          <h2 className="font-serif italic text-xl text-[#1C1A17]">
            {task ? '編輯任務' : '新增任務'}
          </h2>
          <button onClick={onClose} className="text-[#8C8680] hover:text-[#1C1A17] font-mono text-sm">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs tracking-widest uppercase text-[#8C8680] block mb-1.5">標題</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
              style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
              className="w-full px-3 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C45C3A]" />
          </div>
          <div>
            <label className="text-xs tracking-widest uppercase text-[#8C8680] block mb-1.5">備註</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
              className="w-full px-3 py-2.5 text-sm text-[#1C1A17] focus:outline-none focus:border-[#C45C3A] resize-none" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(['TODO','IN_PROGRESS','DONE'] as Status[]).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className="py-2 text-xs tracking-wider transition-all"
                style={{
                  background: status === s ? '#1C1A17' : '#FFFFFF',
                  color: status === s ? '#F7F5F0' : '#8C8680',
                  border: `1px solid ${status === s ? '#1C1A17' : '#E8E4DC'}`,
                  borderRadius: '2px',
                }}>
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs tracking-widest uppercase text-[#8C8680] block mb-1.5">優先</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
                className="w-full px-3 py-2.5 text-sm text-[#1C1A17] focus:outline-none">
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
              </select>
            </div>
            <div>
              <label className="text-xs tracking-widest uppercase text-[#8C8680] block mb-1.5">截止</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
                className="w-full px-3 py-2.5 text-sm text-[#1C1A17] focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            style={{ border: '1px solid #E8E4DC', borderRadius: '2px' }}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase text-[#8C8680] hover:border-[#1C1A17] hover:text-[#1C1A17] transition-colors">
            取消
          </button>
          <button onClick={() => save()} disabled={!title.trim() || isPending}
            style={{ background: '#1C1A17', borderRadius: '2px' }}
            className="flex-1 py-2.5 text-xs tracking-widest uppercase text-[#F7F5F0] hover:bg-[#C45C3A] transition-colors disabled:opacity-40">
            {isPending ? '儲存中…' : task ? '更新' : '新增'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'], queryFn: getTasks, retry: false,
  });

  const { mutate: removeTask } = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => updateTask(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const filtered = filter === 'ALL' ? tasks : tasks.filter(t => t.status === filter);

  const counts = {
    ALL: tasks.length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  };

  const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div style={{ background: '#F7F5F0', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid #E8E4DC', background: '#F7F5F0' }}
        className="sticky top-0 z-10 px-6 md:px-10 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-[#8C8680] font-mono">TaskFlow</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            style={{ border: '1px solid #1C1A17', borderRadius: '2px' }}
            className="px-4 py-1.5 text-xs tracking-[0.15em] uppercase text-[#1C1A17] hover:bg-[#1C1A17] hover:text-[#F7F5F0] transition-colors">
            + 新增
          </button>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-xs text-[#8C8680] hover:text-[#C45C3A] font-mono transition-colors">
            登出
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* Date heading */}
        <div className="mb-10">
          <p className="font-mono text-xs text-[#8C8680] mb-1">{today}</p>
          <h1 className="font-serif italic text-3xl text-[#1C1A17] font-normal">
            {counts.IN_PROGRESS > 0
              ? `${counts.IN_PROGRESS} 件進行中`
              : counts.TODO > 0 ? `${counts.TODO} 件待處理`
              : '所有任務完成'}
          </h1>
          <div className="mt-3 w-8 h-px bg-[#C45C3A]" />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-6 mb-8">
          {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="text-xs tracking-widest uppercase transition-colors pb-1"
              style={{
                color: filter === s ? '#1C1A17' : '#8C8680',
                borderBottom: filter === s ? '1px solid #C45C3A' : '1px solid transparent',
              }}>
              {s === 'ALL' ? `全部 ${counts.ALL}` :
               s === 'TODO' ? `未開始 ${counts.TODO}` :
               s === 'IN_PROGRESS' ? `進行中 ${counts.IN_PROGRESS}` :
               `完成 ${counts.DONE}`}
            </button>
          ))}
        </div>

        {/* Task list */}
        {isLoading ? (
          <p className="text-sm text-[#8C8680] font-mono">載入中…</p>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif italic text-[#8C8680] text-lg">空無一事</p>
            <p className="text-xs text-[#C8C4BC] mt-2 font-mono">點擊右上角新增任務</p>
          </div>
        ) : (
          <div>
            {filtered.map(task => (
              <TaskRow key={task.id} task={task}
                onEdit={(t) => { setEditing(t); setModalOpen(true); }}
                onDelete={(id) => removeTask(id)}
                onStatusChange={(id, status) => changeStatus({ id, status })}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="mt-16 text-center text-xs text-[#C8C4BC] font-mono tracking-wider">
          Claude × Gemini — 2025
        </p>
      </main>

      <TaskModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} task={editing} />
    </div>
  );
}
