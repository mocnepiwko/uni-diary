// components/LanguageSwitcher.tsx
'use client';
import { useLanguage } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
      <button
        onClick={() => setLang('ru')}
        className={`px-2 py-1 text-xs font-bold rounded-md transition ${
          lang === 'ru' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        RU
      </button>
      <button
        onClick={() => setLang('pl')}
        className={`px-2 py-1 text-xs font-bold rounded-md transition ${
          lang === 'pl' ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        PL
      </button>
    </div>
  );
}