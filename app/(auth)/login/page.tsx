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
      if (data.token) { localStorage.setItem('token', data.token); router.push('/'); }
      else setError(data.error || '帳號或密碼錯誤');
    },
    onError: () => setError('連線失敗，請稍後再試'),
  });

  return (
    <div style={{ background: '#F7F5F0', minHeight: '100vh' }}
      className="flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-12 text-center">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8C8680] mb-3 font-mono">TaskFlow</p>
          <h1 className="font-serif text-3xl font-normal text-[#1C1A17] italic">
            今日の仕事
          </h1>
          <div className="mt-3 mx-auto w-8 h-px bg-[#C45C3A]" />
        </div>

        {/* Form */}
        <form onSubmit={e => { e.preventDefault(); setError(''); login(); }}
          className="space-y-5">

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#8C8680] mb-2">
              電子郵件
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="your@email.com"
              style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
              className="w-full px-4 py-3 text-sm text-[#1C1A17] placeholder-[#C8C4BC] focus:outline-none focus:border-[#C45C3A] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-[#8C8680] mb-2">
              密碼
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
              className="w-full px-4 py-3 text-sm text-[#1C1A17] placeholder-[#C8C4BC] focus:outline-none focus:border-[#C45C3A] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-[#C45C3A] font-mono">{error}</p>
          )}

          <button type="submit" disabled={isPending}
            style={{ background: '#1C1A17', borderRadius: '2px' }}
            className="w-full py-3 text-xs tracking-[0.2em] uppercase text-[#F7F5F0] hover:bg-[#C45C3A] transition-colors disabled:opacity-40 mt-2">
            {isPending ? '進入中…' : '登　入'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-[#8C8680] mt-10">
          初次使用？{' '}
          <Link href="/register"
            className="text-[#C45C3A] underline underline-offset-2 hover:no-underline">
            建立帳號
          </Link>
        </p>

        <p className="text-center text-xs text-[#C8C4BC] mt-16 font-mono tracking-wider">
          Built by Claude × Gemini
        </p>
      </div>
    </div>
  );
}
