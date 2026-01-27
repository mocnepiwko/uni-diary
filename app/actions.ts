'use server';

import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';
import Homework from '@/models/Homework';
import User from '@/models/User';
import InviteCode from '@/models/InviteCode'; // Не забудь про модель инвайтов
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { sendTelegramMessage } from '@/lib/telegram';

// --- HELPERS ---
function serializeLesson(doc: any) {
  const lesson = doc.toObject();
  return {
    ...lesson,
    _id: lesson._id.toString(),
    // Даты в строки, чтобы React не ругался
    specificDate: lesson.specificDate ? lesson.specificDate.toISOString() : null,
    createdAt: lesson.createdAt?.toString(),
    updatedAt: lesson.updatedAt?.toString(),
  };
}

// --- УРОКИ (LESSONS) ---

// Получаем уроки на конкретную неделю
export async function getLessons(startStr: string, endStr: string) {
  await dbConnect();

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  
  // 1. Повторяющиеся (обычное расписание) - у них нет specificDate
  const recurringLessons = await Lesson.find({ 
    specificDate: { $exists: false } 
  }).sort({ startTime: 1 });

  // 2. Разовые (доп. пары) - ищем строго в диапазоне дат
  const oneTimeLessons = await Lesson.find({
    specificDate: { 
      $gte: startDate, 
      $lte: endDate 
    }
  }).sort({ startTime: 1 });

  return { 
    recurring: recurringLessons.map(serializeLesson), 
    oneTime: oneTimeLessons.map(serializeLesson) 
  };
}

export async function createLesson(formData: {
  title: string;
  teacher: string;
  room: string;
  type: string;
  startTime: string;
  endTime: string;
  isCustom: boolean;
  // Новые поля
  isRecurring: boolean;
  day?: string;
  specificDate?: string;
}) {
  await dbConnect();

  const payload: any = {
    title: formData.title,
    teacher: formData.teacher,
    room: formData.room,
    type: formData.type,
    startTime: formData.startTime,
    endTime: formData.endTime,
    isCustom: formData.isCustom,
  };

  // Логика: или день недели, или конкретная дата
  if (formData.isRecurring) {
    payload.day = formData.day;
  } else {
    if (!formData.specificDate) throw new Error("Нет даты для разового урока");
    payload.specificDate = new Date(formData.specificDate);
  }

  await Lesson.create(payload);

  // --- TELEGRAM NOTIFICATION ---
  const timeInfo = formData.isRecurring 
    ? `🔄 Каждый: ${formData.day}` 
    : `📅 Дата: ${new Date(formData.specificDate!).toLocaleDateString('ru-RU')}`;

  const message = `
🆕 <b>Добавлена пара!</b>

📚 <b>${formData.title}</b> (${formData.type})
👨‍🏫 ${formData.teacher}
🚪 ${formData.room}
⏰ ${formData.startTime} - ${formData.endTime}
${timeInfo}
  `;
  await sendTelegramMessage(message);
  // -----------------------------

  revalidatePath('/'); 
}

export async function deleteLesson(id: string) {
  await dbConnect();
  await Lesson.findByIdAndDelete(id);
  revalidatePath('/');
}

// --- ДОМАШКА (HOMEWORK) ---

export async function getHomeworks(subject: string) {
  await dbConnect();
  const homeworks = await Homework.find({ subject }).sort({ deadline: 1 });
  
  return homeworks.map(doc => {
    const hw = doc.toObject();
    return {
      ...hw,
      _id: hw._id.toString(),
      deadline: hw.deadline ? new Date(hw.deadline).toISOString() : '',
      createdAt: hw.createdAt ? hw.createdAt.toString() : '',
    };
  });
}

export async function createHomework(data: {
  subject: string;
  description: string;
  deadline: string;
  createdBy: string;
}) {
  await dbConnect();
  await Homework.create({
    subject: data.subject,
    description: data.description,
    deadline: new Date(data.deadline), 
    createdBy: data.createdBy
  });

  // --- TELEGRAM NOTIFICATION ---
  const dateStr = new Date(data.deadline).toLocaleDateString('ru-RU');
  const message = `
📝 <b>Новое ДЗ!</b>

📚 <b>${data.subject}</b>
⚠️ ${data.description}
⏰ Дедлайн: ${dateStr}
👤 Добавил: ${data.createdBy}
  `;
  await sendTelegramMessage(message);
  // -----------------------------

  revalidatePath('/');
}

export async function deleteHomework(id: string) {
  await dbConnect();
  await Homework.findByIdAndDelete(id);
  revalidatePath('/');
}

// --- ПОЛЬЗОВАТЕЛИ И КОДЫ (USER & ADMIN) ---

export async function registerUser(formData: any) {
  await dbConnect();
  
  const { name, email, password, role, secretKey } = formData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Email уже занят');
  }

  let finalRole = 'student';

  // 1. Проверка на Админа (по email из env)
  if (process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase()) {
    finalRole = 'admin';
  }
  // 2. Проверка на Учителя (по инвайт-коду)
  else if (role === 'teacher') {
    const invite = await InviteCode.findOne({ code: secretKey });

    if (!invite) throw new Error('Неверный код доступа!');
    if (invite.isUsed) throw new Error('Код уже использован!');

    finalRole = 'teacher';
    
    // Сжигаем код
    invite.isUsed = true;
    invite.usedBy = email;
    await invite.save();
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: finalRole 
  });
  
  return { success: true };
}

export async function getAllUsers() {
  await dbConnect();
  const users = await User.find({}, { password: 0 }).sort({ role: 1, name: 1 });
  return users.map(user => ({
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }));
}

export async function deleteUser(userId: string) {
  await dbConnect();
  await User.findByIdAndDelete(userId);
  revalidatePath('/admin');
  return { success: true };
}

// --- ИНВАЙТ КОДЫ ---

export async function generateInviteCode() {
  await dbConnect();
  // Генерируем случайный код вида TEACH-X7Z12
  const code = 'TEACH-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  await InviteCode.create({ code, role: 'teacher' });
  revalidatePath('/admin');
  return { success: true, code };
}

export async function getInviteCodes() {
  await dbConnect();
  const codes = await InviteCode.find({}).sort({ createdAt: -1 }).limit(20);
  return codes.map(doc => ({
    _id: doc._id.toString(),
    code: doc.code,
    isUsed: doc.isUsed,
    usedBy: doc.usedBy
  }));
}

export async function deleteInviteCode(id: string) {
  await dbConnect();
  await InviteCode.findByIdAndDelete(id);
  revalidatePath('/admin');
  return { success: true };
}