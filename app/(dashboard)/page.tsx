'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask, updateTask, deleteTask } from '@/lib/api';
import { Task, Status, Priority } from '@/types';

const STATUS_PILL = {
  TODO:        { label: '未開始', color: 'rgba(142,142,147,0.15)', text: '#8e8e93', dot: '#8e8e93' },
  IN_PROGRESS: { label: '進行中', color: 'rgba(0,122,255,0.1)',    text: '#007aff', dot: '#007aff' },
  DONE:        { label: '已完成', color: 'rgba(52,199,89,0.12)',   text: '#34c759', dot: '#34c759' },
};

const PRIORITY_BADGE = {
  LOW:    { label: '低', color: 'rgba(142,142,147,0.12)', text: '#8e8e93' },
  MEDIUM: { label: '中', color: 'rgba(255,159,10,0.12)',  text: '#ff9f0a' },
  HIGH:   { label: '高', color: 'rgba(255,59,48,0.12)',   text: '#ff3b30' },
};

function TaskRow({ task, onEdit, onDelete, onStatusChange }: {
  task: Task; onEdit: (t: Task) => void; onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const next: Record<Status, Status> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
  const pill = STATUS_PILL[task.status];
  const badge = PRIORITY_BADGE[task.priority];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px',
        background: hovered ? 'rgba(255,255,255,0.7)' : 'transparent',
        borderRadius: '12px',
        transition: 'background 0.15s',
        cursor: 'default',
      }}
    >
      {/* Status toggle circle */}
      <button
        onClick={() => onStatusChange(task.id, next[task.status])}
        style={{
          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
          border: task.status === 'TODO' ? '1.5px solid rgba(142,142,147,0.5)' : 'none',
          background: task.status === 'DONE' ? '#34c759' : task.status === 'IN_PROGRESS' ? '#007aff' : 'transparent',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {task.status !== 'TODO' && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        onClick={() => onEdit(task)}
        style={{
          flex: 1, fontSize: '15px', cursor: 'pointer',
          color: task.status === 'DONE' ? '#aeaeb2' : '#1d1d1f',
          textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
          letterSpacing: '-0.1px',
        }}
      >
        {task.title}
      </span>

      {/* Priority badge */}
      <span style={{
        padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
        background: badge.color, color: badge.text, flexShrink: 0,
      }}>
        {badge.label}
      </span>

      {/* Status pill */}
      <span style={{
        padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
        background: pill.color, color: pill.text, flexShrink: 0, minWidth: '60px', textAlign: 'center',
      }}>
        {pill.label}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span style={{ fontSize: '12px', color: '#aeaeb2', flexShrink: 0, minWidth: '48px', textAlign: 'right' }}>
          {new Date(task.dueDate).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        style={{
          width: '24px', height: '24px', borderRadius: '50%',
          background: hovered ? 'rgba(255,59,48,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0, transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1L9 9M9 1L1 9" stroke="#ff3b30" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
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

  const inputGroupStyle: React.CSSProperties = {
    background: 'rgba(118,118,128,0.08)',
    borderRadius: '12px',
    border: '1px solid rgba(118,118,128,0.12)',
    overflow: 'hidden',
    marginBottom: '12px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', background: 'transparent',
    border: 'none', borderBottom: '1px solid rgba(118,118,128,0.1)',
    outline: 'none', fontSize: '15px', color: '#1d1d1f', fontFamily: 'inherit',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0,0,0,0.3)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div
          className="glass"
          style={{ borderRadius: '24px', padding: '28px 28px 32px', marginBottom: '8px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '-0.5px' }}>
              {task ? '編輯任務' : '新增任務'}
            </h2>
            <button onClick={onClose} style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'rgba(142,142,147,0.15)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1L11 11M11 1L1 11" stroke="#6e6e73" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div style={inputGroupStyle}>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
              placeholder="任務標題" style={inputStyle} />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="備註（選填）"
              style={{ ...inputStyle, borderBottom: 'none', resize: 'none' as const }} />
          </div>

          {/* Status selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {(['TODO', 'IN_PROGRESS', 'DONE'] as Status[]).map(s => {
              const pill = STATUS_PILL[s];
              const active = status === s;
              return (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: '10px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  background: active ? pill.color : 'rgba(142,142,147,0.08)',
                  color: active ? pill.text : '#aeaeb2',
                  fontSize: '13px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Priority + Due date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(118,118,128,0.08)', borderRadius: '12px', border: '1px solid rgba(118,118,128,0.12)', overflow: 'hidden' }}>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: '15px', color: '#1d1d1f', fontFamily: 'inherit', cursor: 'pointer' }}>
                <option value="LOW">低優先</option>
                <option value="MEDIUM">中優先</option>
                <option value="HIGH">高優先</option>
              </select>
            </div>
            <div style={{ background: 'rgba(118,118,128,0.08)', borderRadius: '12px', border: '1px solid rgba(118,118,128,0.12)', overflow: 'hidden' }}>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '13px 16px', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: '15px', color: dueDate ? '#1d1d1f' : '#aeaeb2', fontFamily: 'inherit' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <button onClick={onClose} style={{
              padding: '14px', borderRadius: '12px',
              background: 'rgba(142,142,147,0.12)', border: 'none',
              fontSize: '15px', fontWeight: '500', color: '#6e6e73',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              取消
            </button>
            <button onClick={() => save()} disabled={!title.trim() || isPending} style={{
              padding: '14px', borderRadius: '12px',
              background: !title.trim() || isPending ? 'rgba(0,113,227,0.4)' : 'linear-gradient(180deg, #1a8cff 0%, #0071e3 100%)',
              border: 'none', fontSize: '15px', fontWeight: '500', color: 'white',
              cursor: !title.trim() || isPending ? 'default' : 'pointer',
              boxShadow: !title.trim() || isPending ? 'none' : '0 4px 12px rgba(0,113,227,0.3)',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {isPending ? '儲存中…' : task ? '更新' : '新增任務'}
            </button>
          </div>
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

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t: Task) => t.status === filter);
  const counts = {
    ALL: tasks.length,
    TODO: tasks.filter((t: Task) => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter((t: Task) => t.status === 'DONE').length,
  };

  const today = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0f4ff 0%, #f5f0ff 30%, #fff0f8 60%, #f0fff5 100%)',
    }}>
      {/* Background blobs */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(0,113,227,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', left: '-8%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(90,200,250,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Navbar */}
      <header
        className="glass"
        style={{
          position: 'sticky', top: 0, zIndex: 40,
          padding: '0 24px',
          borderRadius: 0,
          borderLeft: 'none', borderRight: 'none', borderTop: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.5)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #0071e3, #34aadc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="4" width="10" height="2" rx="1" fill="white"/>
                <rect x="2" y="7" width="7" height="2" rx="1" fill="white" opacity="0.7"/>
                <rect x="2" y="10" width="9" height="2" rx="1" fill="white" opacity="0.5"/>
              </svg>
            </div>
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '-0.3px' }}>TaskFlow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              style={{
                padding: '7px 16px', borderRadius: '20px',
                background: 'linear-gradient(180deg, #1a8cff 0%, #0071e3 100%)',
                border: 'none', fontSize: '14px', fontWeight: '500', color: 'white',
                cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,113,227,0.3)',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> 新增
            </button>
            <button
              onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
              style={{ padding: '7px 12px', borderRadius: '20px', background: 'rgba(142,142,147,0.12)',
                border: 'none', fontSize: '14px', color: '#6e6e73', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              登出
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {/* Date + Heading */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', color: '#aeaeb2', marginBottom: '6px' }}>{today}</p>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1d1d1f', letterSpacing: '-1px', lineHeight: 1.2 }}>
            {counts.IN_PROGRESS > 0 ? `${counts.IN_PROGRESS} 件進行中` :
             counts.TODO > 0 ? `${counts.TODO} 件待處理` : '全部完成 ✓'}
          </h1>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: '待處理', count: counts.TODO, color: '#8e8e93', bg: 'rgba(142,142,147,0.1)' },
            { label: '進行中', count: counts.IN_PROGRESS, color: '#007aff', bg: 'rgba(0,122,255,0.08)' },
            { label: '已完成', count: counts.DONE, color: '#34c759', bg: 'rgba(52,199,89,0.08)' },
          ].map(({ label, count, color, bg }) => (
            <div key={label} className="glass" style={{ borderRadius: '16px', padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color, letterSpacing: '-1px' }}>{count}</div>
              <div style={{ fontSize: '12px', color: '#aeaeb2', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', padding: '4px',
          background: 'rgba(118,118,128,0.1)', borderRadius: '12px' }}>
          {(['ALL', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              flex: 1, padding: '7px 4px', borderRadius: '9px', border: 'none',
              background: filter === s ? 'rgba(255,255,255,0.9)' : 'transparent',
              boxShadow: filter === s ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              fontSize: '12px', fontWeight: filter === s ? '600' : '400',
              color: filter === s ? '#1d1d1f' : '#8e8e93', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}>
              {s === 'ALL' ? '全部' : s === 'TODO' ? '未開始' : s === 'IN_PROGRESS' ? '進行中' : '完成'}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="glass" style={{ borderRadius: '20px', padding: '8px', minHeight: '120px' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#aeaeb2', fontSize: '14px' }}>載入中…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>✦</div>
              <p style={{ fontSize: '16px', color: '#aeaeb2', fontWeight: '500' }}>
                {filter === 'ALL' ? '尚無任務' : '這裡空空的'}
              </p>
              <p style={{ fontSize: '13px', color: '#c7c7cc', marginTop: '4px' }}>
                點上方「新增」開始規劃
              </p>
            </div>
          ) : (
            filtered.map((task: Task) => (
              <TaskRow key={task.id} task={task}
                onEdit={(t) => { setEditing(t); setModalOpen(true); }}
                onDelete={(id) => removeTask(id)}
                onStatusChange={(id, status) => changeStatus({ id, status })}
              />
            ))
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '12px', color: '#c7c7cc' }}>
          Built with Claude × Gemini · 2026
        </p>
      </main>

      <TaskModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} task={editing} />
    </div>
  );
}
