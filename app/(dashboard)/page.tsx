'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Design tokens ──────────────────────────────────────────────────────────
const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.5)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
};

const CARD: React.CSSProperties = {
  ...GLASS,
  borderRadius: 16,
  padding: '16px 20px',
  marginBottom: 12,
  cursor: 'pointer',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
};

const COLUMNS = [
  { status: 'TODO',        label: '待處理', color: '#8e8e93', bg: 'rgba(142,142,147,0.08)', dot: '#c7c7cc' },
  { status: 'IN_PROGRESS', label: '進行中', color: '#007aff', bg: 'rgba(0,122,255,0.06)',   dot: '#007aff' },
  { status: 'DONE',        label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.06)',    dot: '#34c759' },
];

const PRIORITY_COLOR: Record<string, string> = {
  LOW:    '#34c759',
  MEDIUM: '#ff9f0a',
  HIGH:   '#ff3b30',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: '低', MEDIUM: '中', HIGH: '高',
};

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
  defaultStatus?: string;
}

// ── TaskCard ───────────────────────────────────────────────────────────────
function TaskCard({
  task,
  colColor,
  onClick,
  onStatusToggle,
}: {
  task: Task;
  colColor: string;
  onClick: () => void;
  onStatusToggle: (t: Task) => void;
}) {
  const [hover, setHover] = useState(false);
  const isOverdue =
    task.dueDate &&
    task.status !== 'DONE' &&
    new Date(task.dueDate) < new Date();

  const nextStatus: Record<string, Task['status']> = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'DONE',
    DONE: 'TODO',
  };

  return (
    <div
      style={{
        ...CARD,
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover
          ? '0 16px 48px rgba(0,0,0,0.14)'
          : '0 8px 32px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); onStatusToggle({ ...task, status: nextStatus[task.status] }); }}
          title={`切換狀態 → ${nextStatus[task.status]}`}
          style={{
            width: 20, height: 20, borderRadius: '50%',
            border: `2px solid ${colColor}`,
            background: task.status === 'DONE' ? colColor : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {task.status === 'DONE' && (
            <svg width="10" height="10" viewBox="0 0 10 10">
              <polyline points="1.5,5 4,7.5 8.5,2.5"
                stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        <span style={{
          flex: 1, fontWeight: 600, fontSize: 14,
          color: task.status === 'DONE' ? '#aeaeb2' : '#1c1c1e',
          textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
          background: `${PRIORITY_COLOR[task.priority]}20`,
          color: PRIORITY_COLOR[task.priority],
        }}>
          {PRIORITY_LABEL[task.priority]}
        </span>
      </div>
      {task.description && (
        <p style={{
          margin: '0 0 8px 30px', fontSize: 12, color: '#636366',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.description}
        </p>
      )}
      {task.dueDate && (
        <div style={{
          marginLeft: 30, fontSize: 11, fontWeight: 500,
          color: isOverdue ? '#ff3b30' : '#8e8e93',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {isOverdue ? '⚠' : '📅'}
          {new Date(task.dueDate).toLocaleDateString('zh-TW')}
        </div>
      )}
    </div>
  );
}

// ── KanbanColumn ───────────────────────────────────────────────────────────
function KanbanColumn({
  col, tasks, onTaskClick, onStatusToggle, onAddClick,
}: {
  col: typeof COLUMNS[number];
  tasks: Task[];
  onTaskClick: (t: Task) => void;
  onStatusToggle: (t: Task) => void;
  onAddClick: (status: string) => void;
}) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 0, background: col.bg,
      borderRadius: 20, padding: '16px 12px',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.dot }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
          <span style={{ background: col.dot + '30', color: col.color, fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddClick(col.status)}
          style={{
            width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${col.dot}`,
            background: 'transparent', color: col.color, fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
          }}
          title={`新增${col.label}任務`}
        >+</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 4 }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#c7c7cc', fontSize: 13, paddingTop: 32 }}>暫無任務</div>
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

// ── TaskModal ──────────────────────────────────────────────────────────────
function TaskModal({ modal, onClose, onSave, onDelete }: {
  modal: ModalState;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
  onDelete?: (id: string) => void;
}) {
  const [form, setForm] = useState<Partial<Task>>({
    title: '', description: '',
    status: (modal.defaultStatus as Task['status']) || 'TODO',
    priority: 'MEDIUM', dueDate: '',
  });

  useEffect(() => {
    if (modal.task) {
      setForm({ ...modal.task, dueDate: modal.task.dueDate ? new Date(modal.task.dueDate).toISOString().slice(0, 10) : '' });
    } else {
      setForm({ title: '', description: '', status: (modal.defaultStatus as Task['status']) || 'TODO', priority: 'MEDIUM', dueDate: '' });
    }
  }, [modal.task, modal.defaultStatus]);

  const isEdit = !!modal.task?.id;
  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', marginTop: 4,
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#636366', display: 'block', marginBottom: 2 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', width: '100%', maxWidth: 520 }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#1c1c1e' }}>{isEdit ? '編輯任務' : '新增任務'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>標題 *</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="輸入任務標題" autoFocus />
          </div>
          <div>
            <label style={labelStyle}>描述</label>
            <textarea style={{ ...inputStyle, height: 72, resize: 'none' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="選填" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>狀態</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}>
                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>優先級</label>
              <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}>
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>截止日期</label>
            <input type="date" style={inputStyle} value={form.dueDate as string} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          {isEdit && onDelete && (
            <button onClick={() => onDelete(form.id!)} style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>刪除</button>
          )}
          <button onClick={onClose} style={{ flex: 1, padding: '12px 20px', borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.06)', color: '#636366', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>取消</button>
          <button onClick={() => { if (form.title?.trim()) onSave(form); }} disabled={!form.title?.trim()}
            style={{ flex: 2, padding: '12px 20px', borderRadius: 12, border: 'none', background: form.title?.trim() ? '#007aff' : '#c7c7cc', color: '#fff', fontWeight: 700, fontSize: 14, cursor: form.title?.trim() ? 'pointer' : 'not-allowed' }}>
            {isEdit ? '儲存' : '新增'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DashboardPage ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, task: null });
  const [userEmail, setUserEmail] = useState('');
  const API = process.env.NEXT_PUBLIC_API_URL || '';

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks`, { headers: authHeaders() });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch { setTasks([]); } finally { setLoading(false); }
  }, [API, authHeaders, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setUserEmail(localStorage.getItem('email') || '');
    fetchTasks();
  }, [fetchTasks, router]);

  const handleSave = async (data: Partial<Task>) => {
    const isEdit = !!data.id;
    const url = isEdit ? `${API}/tasks/${data.id}` : `${API}/tasks`;
    try {
      const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: authHeaders(), body: JSON.stringify({ title: data.title, description: data.description, status: data.status, priority: data.priority, dueDate: data.dueDate || null }) });
      if (res.ok) { setModal({ open: false, task: null }); fetchTasks(); }
    } catch { /* ignore */ }
  };

  const handleStatusToggle = async (updated: Task) => {
    try {
      await fetch(`${API}/tasks/${updated.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ status: updated.status }) });
      fetchTasks();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/tasks/${id}`, { method: 'DELETE', headers: authHeaders() });
      setModal({ open: false, task: null }); fetchTasks();
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('email');
    router.push('/login');
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter(t => t.status === col.status);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}>
      <nav style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #007aff, #5856d6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>T</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#1c1c1e' }}>TaskFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {userEmail && <span style={{ fontSize: 13, color: '#636366' }}>{userEmail}</span>}
          <button onClick={handleLogout} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>登出</button>
        </div>
      </nav>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {COLUMNS.map(col => (
            <div key={col.status} style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 16, padding: '14px 20px', flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                {col.status === 'TODO' ? '📋' : col.status === 'IN_PROGRESS' ? '⚡' : '✅'}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: col.color }}>{grouped[col.status]?.length ?? 0}</div>
                <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 500 }}>{col.label}</div>
              </div>
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', borderRadius: 16, padding: '14px 20px', flex: '1 1 120px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(88,86,214,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📊</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#5856d6' }}>{tasks.length}</div>
              <div style={{ fontSize: 12, color: '#8e8e93', fontWeight: 500 }}>總計</div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setModal({ open: true, task: null, defaultStatus: 'TODO' })} style={{ padding: '10px 22px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #007aff, #5856d6)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,122,255,0.3)' }}>
            + 新增任務
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', paddingTop: 80, color: '#8e8e93', fontSize: 15 }}>載入中…</div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {COLUMNS.map(col => (
              <KanbanColumn key={col.status} col={col} tasks={grouped[col.status] || []}
                onTaskClick={t => setModal({ open: true, task: t })}
                onStatusToggle={handleStatusToggle}
                onAddClick={status => setModal({ open: true, task: null, defaultStatus: status })} />
            ))}
          </div>
        )}
      </main>
      {modal.open && (
        <TaskModal modal={modal} onClose={() => setModal({ open: false, task: null })} onSave={handleSave} onDelete={modal.task?.id ? handleDelete : undefined} />
      )}
    </div>
  );
}
