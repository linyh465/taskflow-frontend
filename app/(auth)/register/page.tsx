'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('兩次密碼不一致'); return; }
    if (password.length < 8) { setError('密碼至少需要 8 個字元'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error || '註冊失敗，請稍後再試'); return; }
      router.push('/login?registered=1');
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Right: Decorative */}
      <div style={{
        width: 440,
        background: 'var(--bg-paper)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'var(--accent-light)', opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', bottom: 40, right: -40,
          width: 160, height: 160, borderRadius: '50%',
          background: 'var(--accent)', opacity: 0.08,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 28, fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 16, lineHeight: 1.25,
          }}>
            開始整理<br />你的思緒。
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14, color: 'var(--text-secondary)',
            lineHeight: 1.7, marginBottom: 40,
          }}>
            TaskFlow 讓你用最舒適的方式，<br />
            管理每一個待辦事項。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { num: '01', title: '建立帳號', desc: '只需電子郵件與密碼' },
              { num: '02', title: '新增任務', desc: '記錄你腦中每一個想法' },
              { num: '03', title: '追蹤進度', desc: '看著任務一一完成' },
            ].map(step => (
              <div key={step.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13, fontWeight: 700,
                  color: 'var(--accent)',
                  width: 24, flexShrink: 0,
                  paddingTop: 1,
                }}>{step.num}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{step.title}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
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
            開始你的工作。
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text-secondary)',
            marginBottom: 32, lineHeight: 1.65,
          }}>
            建立帳號，開始整理你的待辦事項。
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 11,
                fontFamily: 'var(--font-body)',
                color: 'var(--text-secondary)',
                marginBottom: 6,
                letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>Email</label>
              <input
                type="email" required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                type="password" required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 8 個字元"
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
              }}>Confirm Password</label>
              <input
                type="password" required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="再輸入一次密碼"
                style={{
                  ...inp,
                  borderColor: confirm && confirm !== password ? 'var(--red)' : undefined,
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              {confirm && confirm !== password && (
                <p style={{ margin: '4px 0 0', fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--red)' }}>密碼不一致</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (confirm.length > 0 && confirm !== password)}
              style={{
                marginTop: 4, padding: '12px',
                background: loading ? 'var(--accent-light)' : 'var(--accent)',
                border: 'none', borderRadius: 8,
                color: 'white',
                fontSize: 15, fontFamily: 'var(--font-body)', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '建立中…' : '建立帳號'}
            </button>
          </form>

          <div style={{ marginTop: 22, textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
              已有帳號？{' '}
            </span>
            <Link href="/login" style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--accent-dark)', fontWeight: 600,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>
              返回登入
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
