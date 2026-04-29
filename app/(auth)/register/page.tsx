'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.80)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12,
  padding: '12px 16px', fontSize: 15,
  background: 'rgba(255,255,255,0.75)',
  outline: 'none', marginTop: 6,
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
};

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('兩次密碼不一致'); return; }
    if (password.length < 6) { setError('密碼至少需要 6 個字元'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || '註冊失敗，請稍後再試'); return; }
      router.push('/login?registered=1');
    } catch {
      setError('網路錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #fafbff 50%, #f5f0ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      padding: '20px',
    }}>
      <div style={{ ...GLASS, borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #007aff, #5856d6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 6px 20px rgba(0,122,255,0.35)',
          }}>
            <span style={{ color: '#fff', fontSize: 24, fontWeight: 800 }}>T</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1c1c1e' }}>建立帳號</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#8e8e93' }}>加入 TaskFlow，開始管理你的任務</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#636366' }}>電子郵件</label>
            <input
              type="email" required
              style={inputStyle}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#636366' }}>密碼</label>
            <input
              type="password" required
              style={inputStyle}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少 6 個字元"
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#636366' }}>確認密碼</label>
            <input
              type="password" required
              style={{
                ...inputStyle,
                borderColor: confirm && confirm !== password ? '#ff3b30' : 'rgba(0,0,0,0.12)',
              }}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="再輸入一次密碼"
            />
            {confirm && confirm !== password && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ff3b30' }}>密碼不一致</p>
            )}
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,59,48,0.08)',
              border: '1px solid rgba(255,59,48,0.2)',
              color: '#ff3b30', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (confirm.length > 0 && confirm !== password)}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: loading ? '#c7c7cc' : 'linear-gradient(135deg, #007aff, #5856d6)',
              color: '#fff', fontWeight: 700, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,255,0.3)',
              transition: 'all 0.2s ease',
              marginTop: 4,
            }}
          >
            {loading ? '建立中…' : '建立帳號'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#8e8e93' }}>
          已有帳號？{' '}
          <Link href="/login" style={{ color: '#007aff', fontWeight: 600, textDecoration: 'none' }}>
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
