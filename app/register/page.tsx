'use client';

import { useState } from 'react';
import { registerUser } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    secretKey: '' // Поле для секретного кода
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      toast.success('Регистрация успешна! Теперь войдите.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Регистрация</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              required
              className="w-full p-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Кто вы?</label>
            <select
              className="w-full p-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
            </select>
          </div>

          {/* Показываем поле ключа ТОЛЬКО если выбран Учитель */}
          {formData.role === 'teacher' && (
            <div className="animate-fade-in-down">
              <label className="block text-sm font-medium text-indigo-600 mb-1">Код доступа преподавателя</label>
              <input
                type="password"
                placeholder="Введите секретный код"
                className="w-full p-3 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none transition"
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            Создать аккаунт
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}