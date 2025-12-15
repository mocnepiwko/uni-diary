'use server';

import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson'; // Removed ILesson if not used directly, or keep imports
import { revalidatePath } from 'next/cache';
import User from '@/models/User'; 
import bcrypt from 'bcryptjs';    
import Homework from '@/models/Homework';
import { sendTelegramMessage } from "@/lib/telegram";

// --- HELPER ---
function serializeLesson(doc: any) {
  const lesson = doc.toObject();
  return {
    ...lesson,
    _id: lesson._id.toString(),
    createdAt: lesson.createdAt?.toString(),
    updatedAt: lesson.updatedAt?.toString(),
  };
}

// --- LESSON ACTIONS ---
export async function getLessons() {
  try {
    await dbConnect();
    const lessons = await Lesson.find({}).sort({ startTime: 1 });
    return lessons.map(serializeLesson);
  } catch (error) {
    console.error("Error getting lessons:", error);
    return [];
  }
}

export async function createLesson(formData: {
  title: string;
  teacher: string;
  room: string;
  type: string;
  day: string;
  startTime: string;
  endTime: string;
  isCustom: boolean;
}) {
  await dbConnect();
  await Lesson.create(formData);
  
  const message = `
📅 <b>Новая пара!</b>

📚 <b>Предмет:</b> ${formData.title}
👨‍🏫 <b>Препод:</b> ${formData.teacher}
🚪 <b>Кабинет:</b> ${formData.room}
⏰ <b>Время:</b> ${formData.day}, ${formData.startTime} - ${formData.endTime}
ℹ️ <b>Тип:</b> ${formData.type}
  `;
  await sendTelegramMessage(message);

  revalidatePath('/'); 
}
export async function deleteLesson(id: string) {
  await dbConnect();
  await Lesson.findByIdAndDelete(id);
  revalidatePath('/');
}

// --- USER ACTIONS ---
export async function registerUser(formData: any) {
  await dbConnect();
  
  const { name, email, password, role } = formData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('Пользователь с таким Email уже существует');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'student' 
  });
  
  return { success: true };
}

// --- HOMEWORK ACTIONS ---

export async function getHomeworks(subject: string) {
  try {
    await dbConnect();
    // Sort by deadline ascending (soonest first)
    const homeworks = await Homework.find({ subject }).sort({ deadline: 1 });
    
    return homeworks.map(doc => {
      const hw = doc.toObject();
      return {
        ...hw,
        _id: hw._id.toString(),
        // Safe check for date conversion
        deadline: hw.deadline ? new Date(hw.deadline).toISOString() : '',
        createdAt: hw.createdAt ? hw.createdAt.toString() : '',
      };
    });
  } catch (error) {
    console.error("Error getting homeworks:", error);
    return [];
  }
}

export async function createHomework(data: {
  subject: string;
  description: string;
  deadline: string;
  createdBy: string;
}) {
  try {
    await dbConnect();
    await Homework.create({
      subject: data.subject,
      description: data.description,
      deadline: new Date(data.deadline), 
      createdBy: data.createdBy
    });

    // --- SEND NOTIFICATION ---
    const dateStr = new Date(data.deadline).toLocaleDateString('ru-RU');
    const message = `
📝 <b>Новое ДЗ!</b>

📚 <b>Предмет:</b> ${data.subject}
⚠️ <b>Задание:</b> ${data.description}
⏰ <b>Дедлайн:</b> ${dateStr}
👤 <b>Добавил:</b> ${data.createdBy}
    `;
    await sendTelegramMessage(message);
    // -------------------------

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error creating homework:", error);
    return { success: false };
  }
}

export async function deleteHomework(id: string) {
  try {
    await dbConnect();
    await Homework.findByIdAndDelete(id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting homework:", error);
    return { success: false };
  }
}


