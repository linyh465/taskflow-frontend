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
    <div style={{ background: '#F7F5F0', minHeight: '100vh' }}
      className="flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="mb-12 text-center">
          <p className="text-xs tracking-[0.25em] uppercase text-[#8C8680] mb-3 font-mono">TaskFlow</p>
          <h1 className="font-serif text-3xl font-normal text-[#1C1A17] italic">
            はじめまして
          </h1>
          <div className="mt-3 mx-auto w-8 h-px bg-[#C45C3A]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: '電子郵件', type: 'email', val: email, set: setEmail, ph: 'your@email.com' },
            { label: '密碼', type: 'password', val: password, set: setPassword, ph: '至少 8 個字元' },
            { label: '確認密碼', type: 'password', val: confirm, set: setConfirm, ph: '再輸入一次' },
          ].map(({ label, type, val, set, ph }) => (
            <div key={label}>
              <label className="block text-xs tracking-widest uppercase text-[#8C8680] mb-2">{label}</label>
              <input type={type} value={val} onChange={e => set(e.target.value)} required placeholder={ph}
                style={{ background: '#FFFFFF', border: '1px solid #E8E4DC', borderRadius: '2px' }}
                className="w-full px-4 py-3 text-sm text-[#1C1A17] placeholder-[#C8C4BC] focus:outline-none focus:border-[#C45C3A] transition-colors" />
            </div>
          ))}

          {error && <p className="text-xs text-[#C45C3A] font-mono">{error}</p>}

          <button type="submit" disabled={isPending}
            style={{ background: '#1C1A17', borderRadius: '2px' }}
            className="w-full py-3 text-xs tracking-[0.2em] uppercase text-[#F7F5F0] hover:bg-[#C45C3A] transition-colors disabled:opacity-40 mt-2">
            {isPending ? '建立中…' : '建立帳號'}
          </button>
        </form>

        <p className="text-center text-xs text-[#8C8680] mt-10">
          已有帳號？{' '}
          <Link href="/login" className="text-[#C45C3A] underline underline-offset-2 hover:no-underline">登入</Link>
        </p>
      </div>
    </div>
  );
}
