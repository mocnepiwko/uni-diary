'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '../actions';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      router.push('/login'); // После успеха кидаем на логин
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex justify-center mb-6 text-indigo-600">
           <GraduationCap size={48} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Регистрация в UniPro</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="ФИО" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, name: e.target.value})} />
          
          <input required type="email" placeholder="Email" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, email: e.target.value})} />
          
          <input required type="password" placeholder="Пароль" className="w-full p-3 border rounded-xl"
            onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <div>
            <label className="block text-sm text-gray-600 mb-1 ml-1">Роль</label>
            <select className="w-full p-3 border rounded-xl bg-white"
              onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="student">Студент</option>
              <option value="teacher">Преподаватель</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
            Создать аккаунт
          </button>
        </form>
        <p className="text-center mt-4 text-gray-500 text-sm">
          Уже есть аккаунт? <Link href="/login" className="text-indigo-600 hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}