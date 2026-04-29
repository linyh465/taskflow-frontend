'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { registerUser } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const { mutate: register, isPending } = useMutation({
    mutationFn: () => registerUser({ email, password }),
    onSuccess: (data) => {
      if (data.userId) router.push('/login?welcome=1');
      else setError(data.error || '註冊失敗');
    },
    onError: () => setError('連線失敗'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('兩次密碼不一致'); return; }
    if (password.length < 8) { setError('密碼至少 8 個字元'); return; }
    register();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #f0e8ff 0%, #e8f4fd 35%, #e8fff4 70%, #fde8f0 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <div style={{
        position: 'fixed', top: '-15%', right: '-10%', width: '450px', height: '450px',
        background: 'radial-gradient(circle, rgba(90,200,250,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-5%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(52,199,89,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div
        className="glass"
        style={{ width: '100%', maxWidth: '380px', borderRadius: '28px', padding: '48px 40px', position: 'relative' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #34c759, #30d158)',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 19L21 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '-0.5px' }}>
            建立帳號
          </h1>
          <p style={{ fontSize: '14px', color: '#6e6e73', marginTop: '4px' }}>
            開始管理你的任務
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              background: 'rgba(118,118,128,0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(118,118,128,0.12)',
              overflow: 'hidden',
            }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="電子郵件"
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(118,118,128,0.12)', outline: 'none', fontSize: '16px', color: '#1d1d1f' }}
              />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="密碼（至少 8 位）"
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
                  borderBottom: '1px solid rgba(118,118,128,0.12)', outline: 'none', fontSize: '16px', color: '#1d1d1f' }}
              />
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                required placeholder="確認密碼"
                style={{ width: '100%', padding: '14px 16px', background: 'transparent', border: 'none',
                  outline: 'none', fontSize: '16px', color: '#1d1d1f' }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(255,59,48,0.08)', borderRadius: '10px',
              marginBottom: '12px', fontSize: '13px', color: '#ff3b30' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={isPending}
            style={{ width: '100%', padding: '14px',
              background: isPending ? 'rgba(52,199,89,0.6)' : 'linear-gradient(180deg, #3dde6a 0%, #34c759 100%)',
              border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '500',
              color: 'white', cursor: isPending ? 'default' : 'pointer',
              boxShadow: '0 4px 16px rgba(52,199,89,0.35)', transition: 'all 0.2s', marginTop: '4px' }}
          >
            {isPending ? '建立中…' : '建立帳號'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6e6e73' }}>
          已有帳號？{' '}
          <Link href="/login" style={{ color: '#0071e3', textDecoration: 'none', fontWeight: '500' }}>
            登入
          </Link>
        </p>
      </div>
    </div>
  );
}
