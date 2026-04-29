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
      else setError(data.error || '登入失敗');
    },
    onError: () => setError('伺服器錯誤，請稍後再試'),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <p className="text-gray-500 text-sm mt-1">登入你的帳號</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); setError(''); login(); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="最少 8 個字元"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" /></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">{error}</div>}
          <button type="submit" disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-60">
            {isPending ? '登入中...' : '登入'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          還沒有帳號？ <Link href="/register" className="text-indigo-600 font-medium hover:underline">立即註冊</Link>
        </p>
      </div>
    </div>
  );
}
