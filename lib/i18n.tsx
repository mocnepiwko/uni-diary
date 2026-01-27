// lib/i18n.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. СЛОВАРЬ
const translations = {
  ru: {
    locale: 'ru-RU',
    schedule: 'Расписание',
    homework: 'Задания',
    add_lesson: 'Добавить пару',
    add_hw: 'Выдать ДЗ',
    teacher: 'Преподаватель',
    room: 'Аудитория',
    type: 'Тип',
    lecture: 'Лекция',
    practice: 'Практика',
    exam: 'Экзамен',
    deadline: 'Дедлайн',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    logout: 'Выйти',
    search: 'Поиск...',
    no_lessons: 'Пар нет. Можно спать! 😴',
    recurring: 'Каждую неделю',
    one_time: 'Разовое занятие',
    admin_panel: 'Админ-панель',
    extra_lesson: 'ДОП. ЗАНЯТИЕ',
    days: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
  },
  pl: {
    locale: 'pl-PL',
    schedule: 'Plan zajęć',
    homework: 'Prace domowe',
    add_lesson: 'Dodaj zajęcia',
    add_hw: 'Zadaj pracę',
    teacher: 'Nauczyciel',
    room: 'Sala',
    type: 'Typ',
    lecture: 'Wykład',
    practice: 'Ćwiczenia',
    exam: 'Egzamin',
    deadline: 'Termin',
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    logout: 'Wyloguj',
    search: 'Szukaj...',
    no_lessons: 'Brak zajęć. Można spać! 😴',
    recurring: 'Co tydzień',
    one_time: 'Jednorazowo',
    admin_panel: 'Panel Admina',
    extra_lesson: 'DODATKOWE',
    days: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
  }
};

type Language = 'ru' | 'pl';
// Получаем все ключи словаря (locale, schedule, days...)
type TranslationKeys = keyof typeof translations['ru'];

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  // ИСПРАВЛЕНИЕ: Исключаем 'days' из ключей для функции t, так как t возвращает только строки
  t: (key: Exclude<TranslationKeys, 'days'>) => string; 
  days: string[]; // Дни отдаем отдельно массивом
  locale: string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ru');

  useEffect(() => {
    const saved = localStorage.getItem('app-lang') as Language;
    if (saved) setLangState(saved);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('app-lang', l);
  };

  // ИСПРАВЛЕНИЕ: Добавили 'as string', чтобы TS понимал, что мы берем именно строковое значение
  const t = (key: Exclude<TranslationKeys, 'days'>) => {
    return (translations[lang][key] as string) || key;
  };

  return (
    <I18nContext.Provider value={{ 
      lang, 
      setLang, 
      t, 
      days: translations[lang].days,
      locale: translations[lang].locale
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};