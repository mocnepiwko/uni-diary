// components/UserManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, deleteUser } from '@/app/actions';
import { Trash2, User, Shield, GraduationCap, School } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type UserData = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export default function UserManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      toast.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Вы точно хотите удалить пользователя ${name}? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      await deleteUser(id);
      toast.success(`Пользователь ${name} удален`);
      // Удаляем из локального списка сразу, чтобы не ждать перезагрузки
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (e) {
      toast.error('Ошибка при удалении');
    }
  };

  // Иконка в зависимости от роли
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={18} className="text-red-500" />;
      case 'teacher': return <School size={18} className="text-indigo-600" />; // или GraduationCap
      default: return <User size={18} className="text-gray-400" />;
    }
  };

  // Перевод роли
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'teacher': return 'Преподаватель';
      case 'student': return 'Студент';
      default: return role;
    }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Загрузка пользователей...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mt-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <User size={20} className="text-indigo-600"/> 
        Пользователи ({users.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              <th className="py-3 px-2">Имя</th>
              <th className="py-3 px-2">Email</th>
              <th className="py-3 px-2">Роль</th>
              <th className="py-3 px-2 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // Проверяем, это ли текущий админ (чтобы не удалить себя)
              const isMe = session?.user?.email === user.email;

              return (
                <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-2 font-medium text-gray-800">{user.name}</td>
                  <td className="py-3 px-2 text-gray-500 text-sm">{user.email}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === 'admin' ? 'bg-red-50 text-red-700' :
                      user.role === 'teacher' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {getRoleIcon(user.role)}
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {!isMe && (
                      <button 
                        onClick={() => handleDelete(user._id, user.name)}
                        className="text-gray-300 hover:text-red-500 p-1 transition"
                        title="Удалить"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    {isMe && <span className="text-xs text-gray-400">Это вы</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}