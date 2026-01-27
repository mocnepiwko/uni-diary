// app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [data, setData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      toast.error('Неверный Email или пароль');
      setLoading(false);
    } else {
      toast.success('Вход выполнен!');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Логотип и Заголовок */}
        <div className="text-center mb-8">
          <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <GraduationCap className="text-white h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Вход в систему</h2>
          <p className="text-gray-500 text-sm mt-1">Введите свои данные для доступа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            {/* Я добавил text-gray-900 для текста и placeholder:text-gray-400 для подсказки */}
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Пароль"
              required
              className="w-full p-3.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500">
          Нет аккаунта?{' '}
          <Link href="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition">
            Регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}