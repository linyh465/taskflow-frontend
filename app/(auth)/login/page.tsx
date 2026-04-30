'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '@/lib/api';

const inp: React.CSSProperties = {
  width: '100%',
  padding: '11px 15px',
  background: 'rgba(255,255,255,0.55)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { mutate: login, isPending } = useMutation({
    mutationFn: () => loginUser({ email, password }),
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', email);
        router.push('/');
      } else {
        setError(data.error || '帳號或密碼錯誤');
      }
    },
    onError: () => setError('連線失敗，請稍後再試'),
  });

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--accent)';
    e.target.style.boxShadow = '0 0 0 3px rgba(139,115,85,0.12)';
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-main)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ruled lines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--accent) 27px, var(--accent) 28px)',
        backgroundSize: '100% 28px',
      }} />

      {/* Left: Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 52 }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--accent)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 20, fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>TaskFlow</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 34, fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 6, lineHeight: 1.2,
          }}>
            歡迎回來。
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 32, lineHeight: 1.65,
          }}>
            登入以繼續你的任務清單。
          </p>

          {error && (
            <div style={{
              marginBottom: 18, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(194,91,63,0.1)',
              border: '1px solid rgba(194,91,63,0.2)',
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <form
            onSubmit={e => { e.preventDefault(); setError(''); login(); }}
            style={{ display: 'flex', flexDirection: 'column', gap: 15 }}
          >
            <div>
              <label style={{
                display: 'block', fontSize: 11,
                fontFamily: 'var(--font-body)',
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inp}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={{
                display: 'block', fontSize: 11,
                fontFamily: 'var(--font-body)',
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 8 個字元"
                required
                style={inp}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                marginTop: 4, padding: '12px',
                background: isPending ? 'var(--accent-light)' : 'var(--accent)',
                border: 'none', borderRadius: 8,
                color: 'white',
                fontSize: 15, fontFamily: 'var(--font-body)', fontWeight: 600,
                cursor: isPending ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {isPending ? '登入中…' : '登入'}
            </button>
          </form>

          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
              還沒有帳號？{' '}
            </span>
            <Link href="/register" style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--accent-dark)', fontWeight: 600,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              立即註冊
            </Link>
          </div>
        </div>
      </div>

      {/* Right: Decorative */}
      <div style={{
        width: 440,
        background: 'var(--bg-paper)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'var(--accent-light)', opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', bottom: 40, left: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: 'var(--accent)', opacity: 0.08,
        }} />

        <blockquote style={{ position: 'relative', zIndex: 1, marginBottom: 48 }}>
          <p style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 21, color: 'var(--text-primary)',
            lineHeight: 1.55, fontStyle: 'italic', marginBottom: 14,
          }}>
            "The secret of getting ahead is getting started."
          </p>
          <cite style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12, color: 'var(--text-muted)',
            fontStyle: 'normal', letterSpacing: '0.04em',
          }}>— Mark Twain</cite>
        </blockquote>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
          {[
            { icon: '○', label: '待處理', desc: '記錄所有待辦事項' },
            { icon: '◑', label: '進行中', desc: '專注追蹤當前工作' },
            { icon: '●', label: '已完成', desc: '見證每一份成就感' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: 'var(--accent)', fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 1 }}>{f.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mini kanban preview */}
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, position: 'relative', zIndex: 1 }}>
          {[['待處理', 3], ['進行中', 2], ['已完成', 1]].map(([col, count]) => (
            <div key={col as string} style={{
              background: 'rgba(255,255,255,0.5)',
              borderRadius: 8, padding: '8px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-body)', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.04em' }}>{col}</div>
              {Array.from({ length: count as number }).map((_, j) => (
                <div key={j} style={{ height: 5, background: 'var(--accent-light)', borderRadius: 3, marginBottom: 4, opacity: 0.7 + j * 0.1 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
