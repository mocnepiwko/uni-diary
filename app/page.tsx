'use client';

import { useState, useEffect } from 'react';
import { getLessons, createLesson, deleteLesson, getHomeworks, createHomework, deleteHomework } from './actions';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  User, MapPin, GraduationCap, Plus, Trash2, Search, Calendar, 
  LogOut, NotebookPen, CheckCircle, ShieldCheck, ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';

// ИМПОРТЫ ДЛЯ ЯЗЫКОВ
import { useLanguage } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

// Типы
type LessonType = {
  _id: string; title: string; teacher: string; room: string;
  type: 'lecture' | 'practice' | 'lab' | 'exam';
  day?: string; 
  specificDate?: string; 
  startTime: string; endTime: string; isCustom: boolean;
};

type HomeworkType = {
  _id: string; subject: string; description: string; 
  deadline: string; createdBy: string;
};

// ВАЖНО: Это названия, которые хранятся в Базе Данных (всегда на русском, чтобы не ломать логику)
const DB_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ПОДКЛЮЧАЕМ ХУК ЯЗЫКА
  const { t, days, locale } = useLanguage(); 

  // --- СОСТОЯНИЕ ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [recurringLessons, setRecurringLessons] = useState<LessonType[]>([]);
  const [oneTimeLessons, setOneTimeLessons] = useState<LessonType[]>([]);
  
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0); // 0 = Понедельник
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Модалка Урока
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '', teacher: '', room: '', type: 'lecture', 
    startTime: '09:00', endTime: '10:30',
    isRecurring: true, 
    day: DB_DAYS[0], // Сохраняем русское название дня в БД
    specificDate: '' 
  });

  // Модалка Домашки
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState('');
  const [homeworkList, setHomeworkList] = useState<HomeworkType[]>([]);
  const [hwForm, setHwForm] = useState({ description: '', deadline: '' });

  // --- ХЕЛПЕРЫ ДЛЯ КАЛЕНДАРЯ ---
  
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); 
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    d.setDate(diff);
    d.setHours(0,0,0,0);
    return d;
  };

  const getDateForDayIndex = (index: number) => {
    const start = getStartOfWeek(currentDate);
    const d = new Date(start);
    d.setDate(d.getDate() + index);
    return d;
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentDate(newDate);
  };

  const handleDateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const selected = new Date(e.target.value);
      setCurrentDate(selected);
      const dayIndex = selected.getDay() === 0 ? 6 : selected.getDay() - 1; 
      if (dayIndex >= 0 && dayIndex <= 5) setSelectedDayIndex(dayIndex);
    }
  };

  // --- ЗАГРУЗКА ---
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadLessons();
  }, [status, router, currentDate]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const data = await getLessons(start.toISOString(), end.toISOString());
      
      // @ts-ignore
      setRecurringLessons(data.recurring);
      // @ts-ignore
      setOneTimeLessons(data.oneTime);
    } catch {
      toast.error('Error loading schedule');
    } finally {
      setLoading(false);
    }
  };

  // --- ФИЛЬТРАЦИЯ ---
  const getLessonsForSelectedDay = () => {
    const targetDate = getDateForDayIndex(selectedDayIndex);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // ВАЖНО: Фильтруем по DB_DAYS (русские названия), даже если интерфейс на польском
    const targetDayName = DB_DAYS[selectedDayIndex];

    const recurring = recurringLessons.filter(l => l.day === targetDayName);

    const oneTime = oneTimeLessons.filter(l => {
        if (!l.specificDate) return false;
        return l.specificDate.startsWith(targetDateStr);
    });

    const combined = [...recurring, ...oneTime].sort((a, b) => a.startTime.localeCompare(b.startTime));

    return combined.filter(l => 
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.teacher.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const currentLessons = getLessonsForSelectedDay();

  // --- ХЕНДЛЕРЫ ---
  
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // @ts-ignore
    const role = session?.user?.role;
    
    await createLesson({ 
      ...lessonForm, 
      isCustom: role !== 'admin'
    });
    
    setLessonForm({ 
      title: '', teacher: '', room: '', type: 'lecture', 
      startTime: '09:00', endTime: '10:30',
      isRecurring: true, day: DB_DAYS[selectedDayIndex], specificDate: ''
    });
    setIsLessonModalOpen(false);
    toast.success(t('save') + '!'); // "Сохранить!"
    loadLessons();
  };
  
  const handleLessonDelete = async (id: string) => {
      if (confirm(t('delete') + '?')) {
        await deleteLesson(id);
        toast.success(t('delete'));
        loadLessons();
      }
  };

  const openHomework = async (subject: string) => {
    setCurrentSubject(subject);
    setIsHomeworkModalOpen(true);
    const data = await getHomeworks(subject);
    // @ts-ignore
    setHomeworkList(data);
  };

  const handleHwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject) return;
    await createHomework({
      subject: currentSubject, description: hwForm.description, deadline: hwForm.deadline,
      // @ts-ignore
      createdBy: session?.user?.name || 'Teacher'
    });
    setHwForm({ description: '', deadline: '' });
    toast.success(t('save'));
    const data = await getHomeworks(currentSubject);
    // @ts-ignore
    setHomeworkList(data);
  };

  const handleHwDelete = async (id: string) => {
    await deleteHomework(id);
    toast.success(t('delete'));
    const data = await getHomeworks(currentSubject);
    // @ts-ignore
    setHomeworkList(data);
  };

  // --- РЕНДЕР ---
  if (status === 'loading') return <div className="flex h-screen items-center justify-center text-indigo-600">Loading...</div>;
  // @ts-ignore
  const userRole = session?.user?.role || 'student';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm/50 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <GraduationCap className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold hidden md:block">Uni<span className="text-indigo-600">Pro</span></h1>
          </div>

          <div className="flex items-center gap-4">
            
            {/* ПЕРЕКЛЮЧАТЕЛЬ ЯЗЫКА */}
            <LanguageSwitcher />

            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800">{session?.user?.name}</p>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">{userRole}</p>
            </div>
            
            {userRole === 'admin' && (
              <button 
                onClick={() => router.push('/admin')} 
                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                title={t('admin_panel')}
              >
                <ShieldCheck size={20} />
              </button>
            )}

            <button onClick={() => signOut()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title={t('logout')}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {/* --- НАВИГАЦИЯ --- */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
          
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-gray-800">{t('schedule')}</h2>
            <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 w-fit shadow-sm">
                <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronLeft size={20}/></button>
                
                <div className="flex items-center gap-2 px-2 font-medium text-gray-700">
                    <CalendarDays size={18} className="text-indigo-600"/>
                    <span className="tabular-nums">
                        {/* ИСПОЛЬЗУЕМ LOCALE для формата даты */}
                        {getStartOfWeek(currentDate).toLocaleDateString(locale, {day:'numeric', month:'long'})}
                    </span>
                    <span className="text-gray-300">|</span>
                    <input 
                        type="date" 
                        className="bg-transparent border-none outline-none text-sm cursor-pointer w-[110px]"
                        onChange={handleDateSearch}
                        value={currentDate.toISOString().split('T')[0]} 
                    />
                </div>
                
                <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-100 rounded-lg transition"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="flex gap-3">
            {userRole !== 'student' && (
              <button onClick={() => setIsLessonModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                <Plus size={18} /> <span className="hidden md:inline">{t('add_lesson')}</span>
              </button>
            )}
          </div>
        </div>

        {/* --- ТАБЫ ДНЕЙ (Используем days из хука перевода) --- */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-hide">
          {days.map((dayName, index) => {
            const date = getDateForDayIndex(index);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDayIndex === index;

            return (
                <button 
                    key={index} 
                    onClick={() => setSelectedDayIndex(index)} 
                    className={`
                        relative px-5 py-3 rounded-2xl whitespace-nowrap transition-all border
                        flex flex-col items-center min-w-[100px]
                        ${isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }
                    `}
                >
                    <span className="text-xs opacity-80 uppercase tracking-wide font-semibold">{dayName.slice(0, 3)}</span>
                    <span className="text-lg font-bold">{date.getDate()}</span>
                    {isToday && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                    )}
                </button>
            );
          })}
        </div>

        {/* --- СПИСОК УРОКОВ --- */}
        <div className="grid gap-4">
          {currentLessons.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">{t('no_lessons')}</p>
            </div>
          ) : (
            currentLessons.map((lesson) => (
              <div key={lesson._id} className={`
                 bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group
                 ${lesson.specificDate ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'} 
              `}>
                {lesson.specificDate && (
                    <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                        {t('extra_lesson')}
                    </div>
                )}

                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  lesson.type === 'lecture' ? 'bg-blue-500' : lesson.type === 'practice' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                
                <div className="flex flex-col justify-center min-w-[100px]">
                  <span className="text-2xl font-bold text-gray-800">{lesson.startTime}</span>
                  <span className="text-sm text-gray-500 font-medium">{lesson.endTime}</span>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Перевод типа урока */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${
                        lesson.type === 'lecture' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                         {/* @ts-ignore - чтобы TS не ругался на динамический ключ */}
                         {t(lesson.type)}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                    </div>
                    
                    <button onClick={() => openHomework(lesson.title)} 
                      className="flex items-center gap-1 text-sm bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">
                      <NotebookPen size={16} />
                      <span className="hidden sm:inline">{t('homework')}</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                    <span className="flex items-center gap-1.5"><User size={15} className="text-indigo-400"/> {lesson.teacher}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={15} className="text-indigo-400"/> {lesson.room}</span>
                  </div>
                </div>

                {userRole === 'admin' && (
                  <button onClick={() => handleLessonDelete(lesson._id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- МОДАЛКА УРОКОВ --- */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
             <h2 className="text-xl font-bold mb-4">{t('add_lesson')}</h2>
             <form onSubmit={handleLessonSubmit} className="space-y-4">
                
                <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
                    <button 
                        type="button"
                        onClick={() => setLessonForm({...lessonForm, isRecurring: true})}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${lessonForm.isRecurring ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                    >
                        {t('recurring')}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setLessonForm({...lessonForm, isRecurring: false})}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${!lessonForm.isRecurring ? 'bg-white shadow text-amber-600' : 'text-gray-500'}`}
                    >
                        {t('one_time')}
                    </button>
                </div>

                <input required placeholder="Название предмета" className="w-full p-3 border rounded-xl bg-gray-50" 
                  value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-3 border rounded-xl" value={lessonForm.type} onChange={e => setLessonForm({...lessonForm, type: e.target.value})}>
                    <option value="lecture">{t('lecture')}</option>
                    <option value="practice">{t('practice')}</option>
                    <option value="exam">{t('exam')}</option>
                  </select>
                  
                  {/* ВЫБОР ДНЯ: Отображаем дни из хука, но value берем из DB_DAYS! */}
                  {lessonForm.isRecurring ? (
                      <select className="p-3 border rounded-xl" value={lessonForm.day} onChange={e => setLessonForm({...lessonForm, day: e.target.value})}>
                        {DB_DAYS.map((d, i) => (
                           <option key={d} value={d}>
                             {days[i]} {/* Текст - польский/русский, Значение - всегда Русское (БД) */}
                           </option>
                        ))}
                      </select>
                  ) : (
                      <input 
                        type="date" 
                        required 
                        className="p-3 border rounded-xl"
                        value={lessonForm.specificDate} 
                        onChange={e => setLessonForm({...lessonForm, specificDate: e.target.value})} 
                      />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <input type="time" required className="p-3 border rounded-xl" value={lessonForm.startTime} onChange={e => setLessonForm({...lessonForm, startTime: e.target.value})} />
                   <input type="time" required className="p-3 border rounded-xl" value={lessonForm.endTime} onChange={e => setLessonForm({...lessonForm, endTime: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder={t('teacher')} className="p-3 border rounded-xl" value={lessonForm.teacher} onChange={e => setLessonForm({...lessonForm, teacher: e.target.value})} />
                   <input required placeholder={t('room')} className="p-3 border rounded-xl" value={lessonForm.room} onChange={e => setLessonForm({...lessonForm, room: e.target.value})} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl">{t('cancel')}</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">{t('save')}</button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* --- МОДАЛКА ДОМАШКИ --- */}
      {isHomeworkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('homework')}</h2>
                <p className="text-gray-500 text-sm">{t('type')}: <span className="text-indigo-600 font-semibold">{currentSubject}</span></p>
              </div>
              <button onClick={() => setIsHomeworkModalOpen(false)} className="text-gray-400 hover:text-gray-600">{t('cancel')}</button>
            </div>

            <div className="space-y-3 mb-8">
              {homeworkList.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed"><CheckCircle className="mx-auto h-10 w-10 text-gray-300 mb-2"/><p className="text-gray-500">{t('no_lessons')}</p></div>
              ) : (
                homeworkList.map(hw => (
                  <div key={hw._id} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 relative group">
                    <p className="text-gray-800 font-medium mb-1">{hw.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                        {/* Формат даты с учетом локали */}
                        <span>{t('deadline')}: {new Date(hw.deadline).toLocaleDateString(locale)}</span>
                        <span>User: {hw.createdBy}</span>
                    </div>
                    {userRole !== 'student' && (<button onClick={() => handleHwDelete(hw._id)} className="absolute top-2 right-2 text-indigo-300 hover:text-red-500"><Trash2 size={16} /></button>)}
                  </div>
                ))
              )}
            </div>

            {userRole !== 'student' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">{t('add_hw')}</h3>
                <form onSubmit={handleHwSubmit} className="space-y-3">
                  <textarea required placeholder="..." className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} value={hwForm.description} onChange={e => setHwForm({...hwForm, description: e.target.value})} />
                  <div className="flex gap-3"><div className="flex-1"><label className="text-xs text-gray-500 ml-1 block mb-1">{t('deadline')}</label><input type="date" required className="w-full p-2.5 border rounded-xl" value={hwForm.deadline} onChange={e => setHwForm({...hwForm, deadline: e.target.value})} /></div><button type="submit" className="self-end px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-md hover:bg-indigo-700 transition">{t('save')}</button></div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}