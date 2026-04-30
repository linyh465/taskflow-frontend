'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { loginUser } from '@/lib/api';

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
      } else setError(data.error || '帳號或密碼錯誤');
    },
    onError: () => setError('連線失敗，請稍後再試'),
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #e8f4fd 0%, #f0e8ff 35%, #fde8f0 70%, #e8fff4 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(0,113,227,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', right: '-5%', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(90,200,250,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* Glass card */}
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '380px',
          borderRadius: '28px',
          padding: '48px 40px',
          position: 'relative',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #0071e3, #34aadc)',
            margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,113,227,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="8" width="20" height="4" rx="2" fill="white" opacity="0.9"/>
              <rect x="4" y="14" width="14" height="4" rx="2" fill="white" opacity="0.7"/>
              <rect x="4" y="20" width="18" height="4" rx="2" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1d1d1f', letterSpacing: '-0.5px' }}>
            TaskFlow
          </h1>
          <p style={{ fontSize: '14px', color: '#6e6e73', marginTop: '4px' }}>
            登入以繼續
          </p>
        </div>

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); setError(''); login(); }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              background: 'rgba(118,118,128,0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(118,118,128,0.12)',
              overflow: 'hidden',
            }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="電子郵件"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(118,118,128,0.12)',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#1d1d1f',
                }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="密碼"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  color: '#1d1d1f',
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,59,48,0.08)',
              borderRadius: '10px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#ff3b30',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              padding: '14px',
              background: isPending ? 'rgba(0,113,227,0.6)' : 'linear-gradient(180deg, #1a8cff 0%, #0071e3 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '500',
              color: 'white',
              cursor: isPending ? 'default' : 'pointer',
              letterSpacing: '-0.1px',
              boxShadow: '0 4px 16px rgba(0,113,227,0.35)',
              transition: 'all 0.2s',
              marginTop: '4px',
            }}
          >
            {isPending ? '登入中…' : '登入'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6e6e73' }}>
          還沒有帳號？{' '}
          <Link href="/register" style={{ color: '#0071e3', textDecoration: 'none', fontWeight: '500' }}>
            建立帳號
          </Link>
        </p>
      </div>
    </div>
  );
}
