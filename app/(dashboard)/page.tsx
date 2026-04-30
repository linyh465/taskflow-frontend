'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ──────────────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  createdAt: string;
}

interface ModalState {
  open: boolean;
  task: Partial<Task> | null;
  defaultStatus?: Task['status'];
}

type ViewMode = 'kanban' | 'list';

// ── Constants ──────────────────────────────────────────────────────────────
const COLUMNS = [
  { status: 'TODO' as const,        label: '待處理', color: '#636366', bg: 'rgba(99,99,102,0.07)',   dot: '#aeaeb2', icon: '○' },
  { status: 'IN_PROGRESS' as const, label: '進行中', color: '#007aff', bg: 'rgba(0,122,255,0.07)',   dot: '#007aff', icon: '◑' },
  { status: 'DONE' as const,        label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.07)',    dot: '#34c759', icon: '●' },
];

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: '低',  color: '#34c759', bg: 'rgba(52,199,89,0.12)'  },
  MEDIUM: { label: '中',  color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
  HIGH:   { label: '高',  color: '#ff3b30', bg: 'rgba(255,59,48,0.12)'  },
};

// ── Hooks ──────────────────────────────────────────────────────────────────
function useApi() {
  const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return useMemo(() => {
    const h = (): Record<string, string> => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`,
    });
    return {
      getTasks:   () => fetch(`${BASE}/api/tasks`, { headers: h() }),
      createTask: (d: Record<string, unknown>) => fetch(`${BASE}/api/tasks`, { method: 'POST', headers: h(), body: JSON.stringify(d) }),
      updateTask: (id: string, d: Record<string, unknown>) => fetch(`${BASE}/api/tasks/${id}`, { method: 'PATCH', headers: h(), body: JSON.stringify(d) }),
      deleteTask: (id: string) => fetch(`${BASE}/api/tasks/${id}`, { method: 'DELETE', headers: h() }),
    };
  // BASE is build-time constant; stable reference is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── TaskModal ──────────────────────────────────────────────────────────────
function TaskModal({ modal, onClose, onSave, onDelete, saving }: {
  modal: ModalState;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  saving: boolean;
}) {
  const isEdit = !!modal.task?.id;
  const [form, setForm] = useState<Partial<Task>>({
    title: '', description: '', status: modal.defaultStatus || 'TODO', priority: 'MEDIUM', dueDate: '',
  });

  useEffect(() => {
    if (modal.task) {
      setForm({ ...modal.task, dueDate: modal.task.dueDate ? new Date(modal.task.dueDate).toISOString().slice(0, 10) : '' });
    } else {
      setForm({ title: '', description: '', status: modal.defaultStatus || 'TODO', priority: 'MEDIUM', dueDate: '' });
    }
  }, [modal.task, modal.defaultStatus, modal.open]);

  const valid = !!(form.title?.trim());

  const field: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '10px 13px', fontSize: 14,
    border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, background: 'rgba(255,255,255,0.9)',
    outline: 'none', color: '#1c1c1e', fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
               background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '32px 28px',
                 width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
                 border: '1px solid rgba(255,255,255,0.8)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1c1c1e' }}>{isEdit ? '編輯任務' : '新增任務'}</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#8e8e93' }}>{isEdit ? '修改任務詳情' : '建立一個新的任務'}</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'rgba(0,0,0,0.07)', color: '#636366', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636366', marginBottom: 6 }}>標題 <span style={{ color: '#ff3b30' }}>*</span></label>
            <input style={field} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="輸入任務標題…" autoFocus maxLength={100} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636366', marginBottom: 6 }}>描述</label>
            <textarea style={{ ...field, height: 80, resize: 'none' }} value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="選填描述…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636366', marginBottom: 6 }}>狀態</label>
              <select style={field} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}>
                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636366', marginBottom: 6 }}>優先級</label>
              <select style={field} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                <option value="LOW">低優先</option>
                <option value="MEDIUM">中優先</option>
                <option value="HIGH">高優先</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#636366', marginBottom: 6 }}>截止日期</label>
            <input type="date" style={field} value={form.dueDate as string || ''}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>

        {/* Priority indicator */}
        {form.priority && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: PRIORITY[form.priority].bg, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY[form.priority].color }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: PRIORITY[form.priority].color }}>
              {PRIORITY[form.priority].label}優先級任務
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {isEdit && onDelete && (
            <button onClick={() => { if (form.id) onDelete(form.id); }}
              style={{ padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'rgba(255,59,48,0.1)', color: '#ff3b30', fontWeight: 600, fontSize: 13 }}>
              刪除
            </button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.1)',
              background: 'transparent', color: '#636366', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            取消
          </button>
          <button
            onClick={() => { if (valid) onSave(form); }}
            disabled={!valid || saving}
            style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14,
              cursor: valid && !saving ? 'pointer' : 'not-allowed',
              background: valid ? 'linear-gradient(135deg, #007aff, #5856d6)' : 'rgba(0,0,0,0.1)',
              color: valid ? '#fff' : '#aeaeb2',
              boxShadow: valid ? '0 4px 16px rgba(0,122,255,0.25)' : 'none',
              transition: 'all 0.2s' }}
          >
            {saving ? '儲存中…' : isEdit ? '儲存變更' : '新增任務'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TaskCard ───────────────────────────────────────────────────────────────
function TaskCard({ task, colColor, onClick, onStatusToggle }: {
  task: Task; colColor: string;
  onClick: () => void;
  onStatusToggle: (t: Task) => void;
}) {
  const [hover, setHover] = useState(false);
  const done = task.status === 'DONE';
  const isOverdue = task.dueDate && !done && new Date(task.dueDate) < new Date();
  const nextStatus: Record<Task['status'], Task['status']> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
  const p = PRIORITY[task.priority];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: 14,
        padding: '14px 14px 12px',
        marginBottom: 8,
        cursor: 'pointer',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 12px 36px rgba(0,0,0,0.12)' : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        opacity: done ? 0.75 : 1,
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <button
          onClick={e => { e.stopPropagation(); onStatusToggle({ ...task, status: nextStatus[task.status] }); }}
          style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            border: `2px solid ${colColor}`,
            background: done ? colColor : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="切換狀態"
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: done ? '#aeaeb2' : '#1c1c1e',
          textDecoration: done ? 'line-through' : 'none', lineHeight: '1.35', overflowWrap: 'break-word' }}>
          {task.title}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: p.bg, color: p.color, flexShrink: 0, alignSelf: 'flex-start' }}>
          {p.label}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{ margin: '8px 0 0 30px', fontSize: 12, color: '#8e8e93', lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
          {task.description}
        </p>
      )}

      {/* Footer */}
      {task.dueDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, marginLeft: 30 }}>
          <span style={{ fontSize: 11, color: isOverdue ? '#ff3b30' : '#aeaeb2' }}>
            {isOverdue ? '⚠ 已逾期' : '📅'} {new Date(task.dueDate).toLocaleDateString('zh-TW')}
          </span>
        </div>
      )}
    </div>
  );
}

// ── KanbanColumn ───────────────────────────────────────────────────────────
function KanbanColumn({ col, tasks, onTaskClick, onStatusToggle, onAddClick }: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onStatusToggle: (t: Task) => void;
  onAddClick: (status: Task['status']) => void;
}) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 220, display: 'flex', flexDirection: 'column',
      background: col.bg, borderRadius: 20, padding: '16px 12px 12px' }}>
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, padding: '0 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
          <span style={{ background: col.dot + '28', color: col.color, fontSize: 11,
            fontWeight: 700, borderRadius: 10, padding: '2px 8px' }}>{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddClick(col.status)}
          style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${col.dot}`,
            background: 'rgba(255,255,255,0.5)', color: col.color, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          title={`新增${col.label}任務`}
        >+</button>
      </div>

      {/* Tasks */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 12px', color: '#c7c7cc' }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}>{col.icon}</div>
            <div style={{ fontSize: 12 }}>暫無{col.label}任務</div>
          </div>
        ) : (
          tasks.map(t => (
            <TaskCard key={t.id} task={t} colColor={col.dot}
              onClick={() => onTaskClick(t)} onStatusToggle={onStatusToggle} />
          ))
        )}
      </div>
    </div>
  );
}

// ── ListView ───────────────────────────────────────────────────────────────
function ListView({ tasks, onTaskClick, onStatusToggle }: {
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onStatusToggle: (t: Task) => void;
}) {
  const nextStatus: Record<Task['status'], Task['status']> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
  const col = (s: Task['status']) => COLUMNS.find(c => c.status === s)!;

  return (
    <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#aeaeb2' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>尚無任務</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>點擊「+ 新增任務」建立第一個任務</div>
        </div>
      ) : tasks.map((t, i) => {
        const c = col(t.status);
        const done = t.status === 'DONE';
        const isOverdue = t.dueDate && !done && new Date(t.dueDate) < new Date();
        const p = PRIORITY[t.priority];
        return (
          <div key={t.id} onClick={() => onTaskClick(t)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
            borderBottom: i < tasks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
            cursor: 'pointer', transition: 'background 0.15s',
            background: 'transparent',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {/* Status button */}
            <button onClick={ev => { ev.stopPropagation(); onStatusToggle({ ...t, status: nextStatus[t.status] }); }}
              style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${c.dot}`, background: done ? c.dot : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </button>
            {/* Title */}
            <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: done ? '#aeaeb2' : '#1c1c1e',
              textDecoration: done ? 'line-through' : 'none', minWidth: 0, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
            {/* Status badge */}
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
              background: c.dot + '20', color: c.color, flexShrink: 0 }}>{c.label}</span>
            {/* Priority badge */}
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
              background: p.bg, color: p.color, flexShrink: 0 }}>{p.label}</span>
            {/* Due date */}
            {t.dueDate && (
              <span style={{ fontSize: 12, color: isOverdue ? '#ff3b30' : '#aeaeb2', flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                {isOverdue ? '⚠ ' : ''}{new Date(t.dueDate).toLocaleDateString('zh-TW')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, percent }: {
  icon: string; label: string; value: number; color: string; bg: string; percent?: number;
}) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18, padding: '16px 18px',
      flex: '1 1 100px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
        <span style={{ fontSize: 12, color: '#8e8e93', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {percent !== undefined && (
        <div style={{ marginTop: 10 }}>
          <div style={{ height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: color,
              width: `${percent}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── DashboardPage ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const api = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, task: null });
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.getTasks();
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); } finally { setLoading(false); }
  }, [api, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setUserEmail(localStorage.getItem('email') || '');
    fetchTasks();
  }, [fetchTasks, router]);

  const handleSave = async (data: Partial<Task>) => {
    if (!data.title?.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!data.id;
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
      };
      if (data.dueDate) {
        payload.dueDate = new Date(data.dueDate).toISOString();
      }
      const res = isEdit ? await api.updateTask(data.id!, payload) : await api.createTask(payload);
      if (res.ok) { setModal({ open: false, task: null }); await fetchTasks(); }
    } finally { setSaving(false); }
  };

  const handleStatusToggle = async (updated: Task) => {
    try {
      await api.updateTask(updated.id, { status: updated.status });
      setTasks(prev => prev.map(t => t.id === updated.id ? { ...t, status: updated.status } : t));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTask(id);
      setModal({ open: false, task: null });
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch { /* ignore */ }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  }, [tasks, search]);

  const grouped = useMemo(() =>
    COLUMNS.reduce((acc, col) => {
      acc[col.status] = filtered.filter(t => t.status === col.status);
      return acc;
    }, {} as Record<string, Task[]>),
  [filtered]);

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'DONE').length;
  const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      background: 'linear-gradient(150deg, #f0f4ff 0%, #fafaff 40%, #f4f0ff 80%, #fff0f8 100%)' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,122,255,0.1) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(88,86,214,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, height: 58,
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #007aff, #5856d6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,122,255,0.3)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="12" height="2.5" rx="1.25" fill="white" opacity="0.95"/>
              <rect x="2" y="8" width="8" height="2.5" rx="1.25" fill="white" opacity="0.75"/>
              <rect x="2" y="12" width="10" height="2" rx="1" fill="white" opacity="0.55"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1c1c1e', letterSpacing: '-0.3px' }}>TaskFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {userEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px',
              background: 'rgba(0,0,0,0.05)', borderRadius: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%',
                background: 'linear-gradient(135deg, #007aff, #5856d6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#fff', fontWeight: 700 }}>
                {userEmail[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: '#3a3a3c', fontWeight: 500 }}>{userEmail}</span>
            </div>
          )}
          <button
            onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('email'); router.push('/login'); }}
            style={{ padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(255,59,48,0.08)', color: '#ff3b30', fontWeight: 600, fontSize: 13,
              transition: 'background 0.15s' }}>
            登出
          </button>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1c1c1e', margin: 0, letterSpacing: '-0.5px' }}>
            我的任務
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#8e8e93' }}>
            管理並追蹤您的所有工作項目
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard icon="📋" label="待處理" value={grouped['TODO']?.length ?? 0}  color="#636366" bg="rgba(99,99,102,0.1)"  percent={pct(grouped['TODO']?.length ?? 0)} />
          <StatCard icon="⚡" label="進行中" value={grouped['IN_PROGRESS']?.length ?? 0} color="#007aff" bg="rgba(0,122,255,0.1)"  percent={pct(grouped['IN_PROGRESS']?.length ?? 0)} />
          <StatCard icon="✅" label="已完成" value={grouped['DONE']?.length ?? 0}   color="#34c759" bg="rgba(52,199,89,0.1)"  percent={pct(grouped['DONE']?.length ?? 0)} />
          <StatCard icon="📊" label="完成率" value={pct(done)} color="#5856d6" bg="rgba(88,86,214,0.1)" percent={pct(done)} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px', position: 'relative', minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 14, color: '#aeaeb2', pointerEvents: 'none' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋任務…"
              style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 14,
                height: 40, borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.8)', fontSize: 14, color: '#1c1c1e',
                outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.75)', border: '1.5px solid rgba(0,0,0,0.08)',
            borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: viewMode === v ? '#007aff' : 'transparent',
                  color: viewMode === v ? '#fff' : '#636366',
                  transition: 'all 0.2s' }}>
                {v === 'kanban' ? '⊞ 看板' : '☰ 列表'}
              </button>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => setModal({ open: true, task: null, defaultStatus: 'TODO' })}
            style={{ padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
              boxShadow: '0 4px 16px rgba(0,122,255,0.3)', transition: 'transform 0.15s, box-shadow 0.15s',
              display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,122,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,122,255,0.3)'; }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 新增任務
          </button>
        </div>

        {/* Search hint */}
        {search && (
          <div style={{ marginBottom: 16, fontSize: 13, color: '#8e8e93' }}>
            搜尋「{search}」，共找到 {filtered.length} 筆結果
            <button onClick={() => setSearch('')} style={{ marginLeft: 8, color: '#007aff', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>清除</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#aeaeb2' }}>
            <div style={{ fontSize: 40, marginBottom: 16, animation: 'spin 1s linear infinite' }}>⟳</div>
            <div style={{ fontSize: 15 }}>載入中…</div>
          </div>
        ) : viewMode === 'kanban' ? (
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
            {COLUMNS.map(col => (
              <KanbanColumn key={col.status} col={col} tasks={grouped[col.status] || []}
                onTaskClick={t => setModal({ open: true, task: t })}
                onStatusToggle={handleStatusToggle}
                onAddClick={s => setModal({ open: true, task: null, defaultStatus: s })} />
            ))}
          </div>
        ) : (
          <ListView tasks={filtered} onTaskClick={t => setModal({ open: true, task: t })} onStatusToggle={handleStatusToggle} />
        )}
      </main>

      {/* Modal */}
      {modal.open && (
        <TaskModal
          modal={modal}
          onClose={() => setModal({ open: false, task: null })}
          onSave={handleSave}
          onDelete={modal.task?.id ? handleDelete : undefined}
          saving={saving}
        />
      )}
    </div>
  );
}
