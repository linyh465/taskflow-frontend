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
      if (data.userId) router.push('/login?registered=1');
      else setError(data.error || '註冊失敗');
    },
    onError: () => setError('伺服器錯誤，請稍後再試'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('兩次密碼不一致'); return; }
    if (password.length < 8) { setError('密碼至少需要 8 個字元'); return; }
    register();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-gray-900">建立帳號</h1>
          <p className="text-gray-500 text-sm mt-1">開始管理你的任務</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="最少 8 個字元"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">確認密碼</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="再輸入一次密碼"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">{error}</div>}
          <button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60">
            {isPending ? '建立中...' : '建立帳號'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          已有帳號？ <Link href="/login" className="text-indigo-600 font-medium hover:underline">直接登入</Link>
        </p>
      </div>
    </div>
  );
}
