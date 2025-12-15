'use client';

import { useState, useEffect } from 'react';
import { getLessons, createLesson, deleteLesson, getHomeworks, createHomework, deleteHomework } from './actions';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import HomeworkList from "@/components/HomeworkList";
import toast from 'react-hot-toast'; // <--- Красивые уведомления
import { 
  BookOpen, Clock, MapPin, User, GraduationCap, 
  Plus, Trash2, Search, Calendar, LogOut, NotebookPen, CheckCircle
} from 'lucide-react';

// Типы
type LessonType = {
  _id: string; title: string; teacher: string; room: string;
  type: 'lecture' | 'practice' | 'lab' | 'exam';
  day: string; startTime: string; endTime: string; isCustom: boolean;
};

type HomeworkType = {
  _id: string; subject: string; description: string; 
  deadline: string; createdBy: string;
};

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lessons, setLessons] = useState<LessonType[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('Понедельник');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Модалка Урока
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    title: '', teacher: '', room: '', type: 'lecture', 
    day: 'Понедельник', startTime: '09:00', endTime: '10:30'
  });

  // Модалка Домашки
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(''); // Какой предмет открыт
  const [homeworkList, setHomeworkList] = useState<HomeworkType[]>([]);
  const [hwForm, setHwForm] = useState({ description: '', deadline: '' });

  // --- ЭФФЕКТЫ ---
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadLessons();
  }, [status, router]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const data = await getLessons();
      // @ts-ignore
      setLessons(data);
    } catch {
      toast.error('Ошибка загрузки расписания');
    } finally {
      setLoading(false);
    }
  };

  // Открыть домашку для предмета
  const openHomework = async (subject: string) => {
    setCurrentSubject(subject);
    setIsHomeworkModalOpen(true);
    const data = await getHomeworks(subject);
    // @ts-ignore
    setHomeworkList(data);
  };

  // --- ХЕНДЛЕРЫ УРОКОВ ---
  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // @ts-ignore
    const role = session?.user?.role;
    
    await createLesson({ ...lessonForm, isCustom: role !== 'admin' });
    
    setLessonForm({ ...lessonForm, title: '', teacher: '', room: '' });
    setIsLessonModalOpen(false);
    toast.success('Занятие добавлено!');
    loadLessons();
  };

  const handleLessonDelete = async (id: string) => {
    if (confirm('Удалить занятие?')) {
      await deleteLesson(id);
      toast.success('Занятие удалено');
      loadLessons();
    }
  };

  // --- ХЕНДЛЕРЫ ДОМАШКИ ---
  const handleHwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubject) return;

    await createHomework({
      subject: currentSubject,
      description: hwForm.description,
      deadline: hwForm.deadline,
      // @ts-ignore
      createdBy: session?.user?.name || 'Преподаватель'
    });

    setHwForm({ description: '', deadline: '' });
    toast.success('Домашнее задание выдано!');
    
    // Обновляем список
    const data = await getHomeworks(currentSubject);
    // @ts-ignore
    setHomeworkList(data);
  };

  const handleHwDelete = async (id: string) => {
    await deleteHomework(id);
    toast.success('Задание удалено');
    const data = await getHomeworks(currentSubject);
    // @ts-ignore
    setHomeworkList(data);
  };

  // --- РЕНДЕР ---
  if (status === 'loading') return <div className="flex h-screen items-center justify-center text-indigo-600">Загрузка системы...</div>;
  // @ts-ignore
  const userRole = session?.user?.role || 'student';

  const filteredLessons = lessons.filter(l => {
    return l.day === selectedDay && 
      (l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       l.teacher.toLowerCase().includes(searchQuery.toLowerCase()));
  });

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
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800">{session?.user?.name}</p>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">{userRole}</p>
            </div>
            <button onClick={() => signOut()} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Расписание</h2>
            <p className="text-gray-500 mt-1">Управляй своим временем эффективно</p>
          </div>
          <div className="flex gap-3">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Поиск предмета..." 
                className="pl-9 pr-4 py-2.5 border rounded-xl bg-white w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            {userRole !== 'student' && (
              <button onClick={() => setIsLessonModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                <Plus size={18} /> <span className="hidden md:inline">Пара</span>
              </button>
            )}
          </div>
        </div>

        {/* DAYS */}
        <div className="flex overflow-x-auto pb-4 gap-2 mb-6 scrollbar-hide">
          {DAYS.map(day => (
            <button key={day} onClick={() => setSelectedDay(day)} className={`px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${selectedDay === day ? 'bg-indigo-900 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>
              {day}
            </button>
          ))}
        </div>

        {/* GRID */}
        <div className="grid gap-4">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Пар нет. Можно спать! 😴</p>
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <div key={lesson._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden group">
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${
                        lesson.type === 'lecture' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>{lesson.type}</span>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                    </div>
                    
                    {/* Кнопка Домашки */}
                    <button onClick={() => openHomework(lesson.title)} 
                      className="flex items-center gap-1 text-sm bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">
                      <NotebookPen size={16} />
                      <span className="hidden sm:inline">Задания</span>
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

      {/* --- МОДАЛКА УРОКА --- */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
             <h2 className="text-xl font-bold mb-4">Добавить пару</h2>
             <form onSubmit={handleLessonSubmit} className="space-y-4">
                <input required placeholder="Название предмета" className="w-full p-3 border rounded-xl bg-gray-50" 
                  value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
                {/* Остальные инпуты (тип, время...) упростил для краткости, они те же */}
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-3 border rounded-xl" value={lessonForm.type} onChange={e => setLessonForm({...lessonForm, type: e.target.value})}>
                    <option value="lecture">Лекция</option><option value="practice">Практика</option><option value="exam">Экзамен</option>
                  </select>
                  <select className="p-3 border rounded-xl" value={lessonForm.day} onChange={e => setLessonForm({...lessonForm, day: e.target.value})}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input type="time" required className="p-3 border rounded-xl" value={lessonForm.startTime} onChange={e => setLessonForm({...lessonForm, startTime: e.target.value})} />
                   <input type="time" required className="p-3 border rounded-xl" value={lessonForm.endTime} onChange={e => setLessonForm({...lessonForm, endTime: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="Преподаватель" className="p-3 border rounded-xl" value={lessonForm.teacher} onChange={e => setLessonForm({...lessonForm, teacher: e.target.value})} />
                   <input required placeholder="Аудитория" className="p-3 border rounded-xl" value={lessonForm.room} onChange={e => setLessonForm({...lessonForm, room: e.target.value})} />
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setIsLessonModalOpen(false)} className="flex-1 py-3 text-gray-500 hover:bg-gray-100 rounded-xl">Отмена</button>
                  <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">Сохранить</button>
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
                <h2 className="text-2xl font-bold text-gray-900">Задания</h2>
                <p className="text-gray-500 text-sm">Предмет: <span className="text-indigo-600 font-semibold">{currentSubject}</span></p>
              </div>
              <button onClick={() => setIsHomeworkModalOpen(false)} className="text-gray-400 hover:text-gray-600">Закрыть</button>
            </div>

            {/* Список заданий */}
            <div className="space-y-3 mb-8">
              {homeworkList.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                  <CheckCircle className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500">Домашних заданий пока нет</p>
                </div>
              ) : (
                homeworkList.map(hw => (
                  <div key={hw._id} className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 relative group">
                    <p className="text-gray-800 font-medium mb-1">{hw.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                       <span>Дедлайн: {new Date(hw.deadline).toLocaleDateString()}</span>
                       <span>Задал: {hw.createdBy}</span>
                    </div>
                    {/* Удалять может только админ или учитель */}
                    {userRole !== 'student' && (
                      <button onClick={() => handleHwDelete(hw._id)} className="absolute top-2 right-2 text-indigo-300 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {userRole !== 'student' && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase">Новое задание</h3>
                <form onSubmit={handleHwSubmit} className="space-y-3">
                  <textarea required placeholder="Что нужно сделать? (Прочитать стр. 45-50)" 
                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" rows={3}
                    value={hwForm.description} onChange={e => setHwForm({...hwForm, description: e.target.value})} />
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 ml-1 block mb-1">Дедлайн сдачи</label>
                      <input type="date" required className="w-full p-2.5 border rounded-xl"
                        value={hwForm.deadline} onChange={e => setHwForm({...hwForm, deadline: e.target.value})} />
                    </div>
                    <button type="submit" className="self-end px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium shadow-md hover:bg-indigo-700 transition">
                      Выдать
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}