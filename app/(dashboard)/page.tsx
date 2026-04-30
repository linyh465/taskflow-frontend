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
  { status: 'TODO' as const,        label: '待處理', icon: '○', color: '#B8A898', dot: '#B8A898' },
  { status: 'IN_PROGRESS' as const, label: '進行中', icon: '◑', color: '#8B7355', dot: '#8B7355' },
  { status: 'DONE' as const,        label: '已完成', icon: '●', color: '#6B7C65', dot: '#6B7C65' },
];

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
  LOW:    { label: '低',  color: '#6B7C65', bg: 'rgba(107,124,101,0.12)' },
  MEDIUM: { label: '中',  color: '#8B7355', bg: 'rgba(139,115,85,0.12)'  },
  HIGH:   { label: '高',  color: '#C25B3F', bg: 'rgba(194,91,63,0.12)'   },
};

// ── useApi ─────────────────────────────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, onToggle, userEmail, onLogout }: {
  collapsed: boolean;
  onToggle: () => void;
  userEmail: string;
  onLogout: () => void;
}) {
  const initial = userEmail ? userEmail[0].toUpperCase() : 'U';

  return (
    <nav style={{
      width: collapsed ? 64 : 240,
      minHeight: '100vh',
      background: 'var(--bg-paper)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: collapsed ? '24px 16px' : '28px 24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--accent)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          {!collapsed && (
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>TaskFlow</span>
          )}
        </div>
      </div>

      {/* Nav section label */}
      {!collapsed && (
        <div style={{ padding: '20px 24px 8px' }}>
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
          }}>工作區</span>
        </div>
      )}

      {/* Nav items */}
      <div style={{ padding: '4px 10px', flex: 1 }}>
        {[
          {
            label: '我的任務', icon: (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            )
          },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center',
            gap: 10, padding: collapsed ? '10px 12px' : '10px 14px',
            background: 'var(--bg-active)',
            border: 'none', borderRadius: 8, cursor: 'default',
            color: 'var(--accent-dark)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600,
            marginBottom: 2,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </div>
        ))}

        {/* Section separator */}
        {!collapsed && (
          <div style={{ margin: '16px 4px 8px', height: 1, background: 'var(--border-light)' }} />
        )}

        {/* Kanban status summary */}
        {!collapsed && (
          <div style={{ padding: '0 14px' }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-body)', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
              狀態總覽
            </div>
            {COLUMNS.map(col => (
              <div key={col.status} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                <span style={{ color: col.dot, fontSize: 14, width: 16, textAlign: 'center' }}>{col.icon}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{col.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User & Collapse */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && userEmail && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', marginBottom: 4 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-dark)', fontWeight: 700 }}>{initial}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          title="登出"
          style={{
            width: '100%', padding: '8px',
            background: 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 8,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)', fontSize: 13,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>登出</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          style={{
            width: '100%', padding: '8px',
            background: 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            color: 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {collapsed
              ? <path d="M9 18l6-6-6-6"/>
              : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </button>
      </div>
    </nav>
  );
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

  const fieldStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 13px', fontSize: 14,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.7)',
    outline: 'none', color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11,
    fontFamily: 'var(--font-body)',
    color: 'var(--text-secondary)',
    marginBottom: 6,
    letterSpacing: '0.07em', textTransform: 'uppercase',
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = 'var(--accent)';
    (e.target as HTMLElement).style.boxShadow = '0 0 0 3px rgba(139,115,85,0.12)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = 'var(--border)';
    (e.target as HTMLElement).style.boxShadow = 'none';
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(44,31,20,0.4)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 14, padding: '28px',
          width: '100%', maxWidth: 460,
          boxShadow: '0 20px 60px rgba(44,31,20,0.2)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isEdit ? '編輯任務' : '新增任務'}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
              {isEdit ? '修改任務詳情' : '建立一個新的任務'}
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--bg-hover)', color: 'var(--text-muted)',
            fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <label style={labelStyle}>標題 <span style={{ color: 'var(--red)' }}>*</span></label>
            <input
              style={fieldStyle} value={form.title || ''}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="輸入任務標題…" autoFocus maxLength={100}
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>
          <div>
            <label style={labelStyle}>描述</label>
            <textarea
              style={{ ...fieldStyle, height: 80, resize: 'none' }}
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="選填描述…"
              onFocus={onFocus} onBlur={onBlur}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>狀態</label>
              <select style={fieldStyle} value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as Task['status'] }))}
                onFocus={onFocus} onBlur={onBlur}>
                {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>優先級</label>
              <select style={fieldStyle} value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                onFocus={onFocus} onBlur={onBlur}>
                <option value="LOW">低優先</option>
                <option value="MEDIUM">中優先</option>
                <option value="HIGH">高優先</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>截止日期</label>
            <input type="date" style={fieldStyle} value={form.dueDate as string || ''}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        {/* Priority indicator */}
        {form.priority && (
          <div style={{
            marginTop: 14, padding: '9px 13px', borderRadius: 8,
            background: PRIORITY[form.priority].bg,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY[form.priority].color }} />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 600, color: PRIORITY[form.priority].color }}>
              {PRIORITY[form.priority].label}優先級任務
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {isEdit && onDelete && (
            <button onClick={() => { if (form.id) onDelete(form.id); }}
              style={{ padding: '11px 15px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(194,91,63,0.1)', color: 'var(--red)',
                fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-body)' }}>
              刪除
            </button>
          )}
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              fontFamily: 'var(--font-body)' }}>
            取消
          </button>
          <button
            onClick={() => { if (valid) onSave(form); }}
            disabled={!valid || saving}
            style={{ flex: 2, padding: '11px', borderRadius: 8, border: 'none',
              fontWeight: 700, fontSize: 14, cursor: valid && !saving ? 'pointer' : 'not-allowed',
              background: valid ? 'var(--accent)' : 'var(--accent-light)',
              color: 'white',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}>
            {saving ? '儲存中…' : isEdit ? '儲存變更' : '新增任務'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TaskCard ───────────────────────────────────────────────────────────────
function TaskCard({ task, col, onClick, onStatusToggle }: {
  task: Task;
  col: typeof COLUMNS[number];
  onClick: () => void;
  onStatusToggle: (t: Task) => void;
}) {
  const done = task.status === 'DONE';
  const isOverdue = task.dueDate && !done && new Date(task.dueDate) < new Date();
  const nextStatus: Record<Task['status'], Task['status']> = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
  const p = PRIORITY[task.priority];

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px',
        marginBottom: 8, cursor: 'pointer',
        transition: 'all 0.12s',
        boxShadow: '0 1px 3px rgba(44,31,20,0.06)',
        opacity: done ? 0.8 : 1,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(44,31,20,0.12)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(44,31,20,0.06)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <button
          onClick={e => { e.stopPropagation(); onStatusToggle({ ...task, status: nextStatus[task.status] }); }}
          style={{
            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            border: `1.5px solid ${col.dot}`,
            background: done ? col.dot : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="切換狀態"
        >
          {done && (
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <span style={{
          flex: 1, fontFamily: 'var(--font-body)',
          fontWeight: 500, fontSize: 13,
          color: done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: done ? 'line-through' : 'none',
          lineHeight: 1.4, overflowWrap: 'break-word',
        }}>
          {task.title}
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-body)', fontWeight: 700,
          padding: '2px 7px', borderRadius: 10,
          background: p.bg, color: p.color,
          flexShrink: 0, alignSelf: 'flex-start',
        }}>
          {p.label}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p style={{
          margin: '0 0 8px 28px', fontSize: 12,
          fontFamily: 'var(--font-body)',
          color: 'var(--text-muted)', lineHeight: 1.45,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          {task.description}
        </p>
      )}

      {/* Progress bar */}
      <div style={{ height: 2, background: 'var(--border-light)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: '100%',
          width: col.status === 'DONE' ? '100%' : col.status === 'IN_PROGRESS' ? '50%' : '0%',
          background: col.dot, transition: 'width 0.4s',
        }} />
      </div>

      {/* Footer */}
      {task.dueDate && (
        <div style={{ marginLeft: 28, fontSize: 11, fontFamily: 'var(--font-body)', color: isOverdue ? 'var(--red)' : 'var(--text-muted)' }}>
          {isOverdue ? '⚠ 已逾期 · ' : ''}{new Date(task.dueDate).toLocaleDateString('zh-TW')}
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
  onAddClick: (s: Task['status']) => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div style={{
      flex: '1 1 0', minWidth: 240,
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg-paper)',
      border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Column header */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: col.dot, fontSize: 14 }}>{col.icon}</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{col.label}</span>
          <span style={{
            fontFamily: 'var(--font-body)', fontSize: 11,
            color: 'var(--text-muted)',
            background: 'var(--border)',
            padding: '1px 7px', borderRadius: 10,
          }}>{tasks.length}</span>
        </div>
        <button
          onClick={() => onAddClick(col.status)}
          style={{
            width: 24, height: 24, borderRadius: '50%',
            border: `1px solid ${col.dot}`,
            background: 'transparent', color: col.color,
            fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title={`新增${col.label}任務`}
        >+</button>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 0' }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>{col.icon}</div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-body)' }}>暫無{col.label}任務</div>
          </div>
        ) : tasks.map(t => (
          <TaskCard key={t.id} task={t} col={col}
            onClick={() => onTaskClick(t)} onStatusToggle={onStatusToggle} />
        ))}

        {/* Add card inline */}
        {adding ? (
          <AddCardInline col={col} onAdd={(title) => { onAddClick(col.status); setAdding(false); }} onCancel={() => setAdding(false)} />
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              width: '100%', padding: '9px', marginBottom: 10,
              background: 'transparent',
              border: '1px dashed var(--border)',
              borderRadius: 10, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新增卡片
          </button>
        )}
      </div>
    </div>
  );
}

function AddCardInline({ col, onAdd, onCancel }: { col: typeof COLUMNS[number]; onAdd: (title: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  return (
    <div style={{ padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 10, marginBottom: 8 }}>
      <textarea
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="卡片標題…"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (title.trim()) onAdd(title.trim()); } if (e.key === 'Escape') onCancel(); }}
        style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', resize: 'none', outline: 'none', minHeight: 56, boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button
          onClick={() => { if (title.trim()) onAdd(title.trim()); }}
          style={{ padding: '5px 12px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 600 }}>
          新增
        </button>
        <button onClick={onCancel} style={{ padding: '5px 10px', background: 'transparent', border: 'none', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>取消</button>
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
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, marginBottom: 12, opacity: 0.3 }}>○</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 500, marginBottom: 4 }}>尚無任務</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>點擊「+ 新增任務」建立第一個任務</div>
        </div>
      ) : tasks.map((t, i) => {
        const c = col(t.status);
        const done = t.status === 'DONE';
        const isOverdue = t.dueDate && !done && new Date(t.dueDate) < new Date();
        const p = PRIORITY[t.priority];
        return (
          <div key={t.id} onClick={() => onTaskClick(t)} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px',
            borderBottom: i < tasks.length - 1 ? '1px solid var(--border-light)' : 'none',
            cursor: 'pointer', transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <button onClick={ev => { ev.stopPropagation(); onStatusToggle({ ...t, status: nextStatus[t.status] }); }}
              style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: `1.5px solid ${c.dot}`, background: done ? c.dot : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {done && <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </button>
            <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: done ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: done ? 'line-through' : 'none', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: c.dot + '22', color: c.color, flexShrink: 0 }}>{c.label}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: p.bg, color: p.color, flexShrink: 0 }}>{p.label}</span>
            {t.dueDate && (
              <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: isOverdue ? 'var(--red)' : 'var(--text-muted)', flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
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
function StatCard({ icon, label, value, color, percent }: {
  icon: string; label: string; value: number; color: string; percent?: number;
}) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: '18px 20px',
      flex: '1 1 100px', minWidth: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 18, opacity: 0.7, color }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{label}</div>
      {percent !== undefined && (
        <div style={{ height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: color, width: `${percent}%`, transition: 'width 0.5s ease' }} />
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    router.push('/login');
  };

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
      if (data.dueDate) payload.dueDate = new Date(data.dueDate).toISOString();
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早安' : hour < 18 ? '午安' : '晚安';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)', position: 'relative' }}>
      {/* Ruled lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--accent) 27px, var(--accent) 28px)',
        backgroundSize: '100% 28px',
      }} />

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        {/* Top header */}
        <div style={{
          padding: '28px 36px 0',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 28, fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0, lineHeight: 1.2,
            }}>
              {greeting}。
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
              {new Date().toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })} · 管理你的任務
            </p>
          </div>

          {/* Add button */}
          <button
            onClick={() => setModal({ open: true, task: null, defaultStatus: 'TODO' })}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: 'white',
              fontWeight: 600, fontSize: 14,
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
              boxShadow: '0 2px 8px rgba(139,115,85,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dark)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.transform = 'none'; }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 新增任務
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, padding: '0 36px', marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard icon="○" label="待處理" value={grouped['TODO']?.length ?? 0}  color="#B8A898" percent={pct(grouped['TODO']?.length ?? 0)} />
          <StatCard icon="◑" label="進行中" value={grouped['IN_PROGRESS']?.length ?? 0} color="var(--accent)" percent={pct(grouped['IN_PROGRESS']?.length ?? 0)} />
          <StatCard icon="●" label="已完成" value={grouped['DONE']?.length ?? 0} color="var(--green)" percent={pct(grouped['DONE']?.length ?? 0)} />
          <StatCard icon="%" label="完成率" value={pct(done)} color="var(--accent-dark)" percent={pct(done)} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 36px', marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 200px', position: 'relative', minWidth: 180 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="搜尋任務…"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 36, paddingRight: 14,
                height: 38, borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                fontSize: 14, fontFamily: 'var(--font-body)',
                color: 'var(--text-primary)', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* View toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          }}>
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                style={{
                  padding: '7px 16px', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  background: viewMode === v ? 'var(--accent)' : 'transparent',
                  color: viewMode === v ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}>
                {v === 'kanban' ? '看板' : '列表'}
              </button>
            ))}
          </div>
        </div>

        {/* Search hint */}
        {search && (
          <div style={{ padding: '0 36px', marginBottom: 12, fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
            搜尋「{search}」，找到 {filtered.length} 筆
            <button onClick={() => setSearch('')} style={{ marginLeft: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>清除</button>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '0 36px 48px', overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text-muted)' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 36, marginBottom: 16, opacity: 0.4 }}>◌</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 15 }}>載入中…</div>
            </div>
          ) : viewMode === 'kanban' ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8, minHeight: 400 }}>
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
        </div>
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
