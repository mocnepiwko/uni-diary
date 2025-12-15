'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      email, password, redirect: false
    });

    if (res?.error) {
      setError('Неверный email или пароль');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6 text-indigo-600">
           <GraduationCap size={48} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Вход в систему</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="email" placeholder="Email" className="w-full p-3 border rounded-xl"
            onChange={e => setEmail(e.target.value)} />
          
          <input required type="password" placeholder="Пароль" className="w-full p-3 border rounded-xl"
            onChange={e => setPassword(e.target.value)} />

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Войти
          </button>
        </form>
        <p className="text-center mt-4 text-gray-500 text-sm">
          Нет аккаунта? <Link href="/register" className="text-indigo-600 hover:underline">Регистрация</Link>
        </p>
      </div>
    </div>
  );
}