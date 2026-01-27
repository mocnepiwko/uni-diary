// components/AdminCodes.tsx
'use client';

import { useState, useEffect } from 'react';
import { generateInviteCode, getInviteCodes, deleteInviteCode } from '@/app/actions';
import { Copy, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCodes() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    const data = await getInviteCodes();
    setCodes(data);
  };

  const createNewCode = async () => {
    setLoading(true);
    const res = await generateInviteCode();
    if (res.success) {
      toast.success(`Код создан: ${res.code}`);
      loadCodes();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Удалить этот код?")) return;
    
    await deleteInviteCode(id);
    toast.success("Код удален");
    setCodes(prev => prev.filter(c => c._id !== id));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано!');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <KeyRound className="text-indigo-600" />
          Коды учителей
        </h3>
        <button 
          onClick={createNewCode} 
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition shadow-lg shadow-gray-200"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Создать
        </button>
      </div>

      <div className="space-y-3">
        {codes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Активных кодов нет</p>
        ) : (
          codes.map((c) => (
            <div key={c._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-100 transition group">
              <div className="flex flex-col">
                <span className={`font-mono font-bold text-lg ${c.isUsed ? 'text-gray-400 line-through' : 'text-indigo-600'}`}>
                  {c.code}
                </span>
                {c.isUsed && <span className="text-xs text-gray-400">Использовал: {c.usedBy}</span>}
              </div>
              
              <div className="flex gap-2">
                {!c.isUsed && (
                  <button onClick={() => copyToClipboard(c.code)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Копировать">
                    <Copy size={18} />
                  </button>
                )}
                <button onClick={() => handleDelete(c._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Удалить">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}