// app/admin/page.tsx
'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import AdminCodes from "@/components/AdminCodes";
import UserManagement from "@/components/UserManagement";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Защита страницы: Если не админ - выкидываем на главную
  useEffect(() => {
    if (status === 'authenticated') {
      // @ts-ignore
      if (session?.user?.role !== 'admin') {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  if (status === 'loading') return <div className="p-10 text-center">Проверка прав...</div>;

  // @ts-ignore
  if (session?.user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition">
             <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-indigo-600"/> Панель Администратора
            </h1>
            <p className="text-gray-500 text-sm">Управление доступом и пользователями</p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка: Коды (узкая) */}
          <div className="lg:col-span-1">
            <AdminCodes />
          </div>

          {/* Правая колонка: Пользователи (широкая) */}
          <div className="lg:col-span-2">
            <UserManagement />
          </div>
        </div>
      </div>
    </div>
  );
}