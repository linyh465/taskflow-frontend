'use client';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, updateTask } from '@/lib/api';
import { Task, Status, Priority } from '@/types';

interface Props { isOpen: boolean; onClose: () => void; editingTask?: Task | null; }

export function TaskModal({ isOpen, onClose, editingTask }: Props) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<Status>('TODO');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title); setDesc(editingTask.description || '');
      setStatus(editingTask.status); setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate?.slice(0, 10) || '');
    } else { setTitle(''); setDesc(''); setStatus('TODO'); setPriority('MEDIUM'); setDueDate(''); }
  }, [editingTask, isOpen]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const payload = { title, description: desc, status, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined };
      return editingTask ? updateTask(editingTask.id, payload) : createTask(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); onClose(); },
  });

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{editingTask ? '✏️ 編輯任務' : '➕ 新增任務'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">任務標題 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="輸入任務名稱..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="可選填描述..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select value={status} onChange={e => setStatus(e.target.value as Status)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="TODO">📋 待處理</option><option value="IN_PROGRESS">⚡ 進行中</option><option value="DONE">✅ 已完成</option>
              </select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">優先級</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="LOW">🟢 低</option><option value="MEDIUM">🟡 中</option><option value="HIGH">🔴 高</option>
              </select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">取消</button>
          <button onClick={() => save()} disabled={!title.trim() || isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {isPending ? '儲存中...' : editingTask ? '更新' : '新增任務'}
          </button>
        </div>
      </div>
    </div>
  );
}
