// app/api/reminders/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';
import { sendTelegramMessage } from '@/lib/telegram';

// Массив дней для конвертации JS Date (0-6) в твои названия
const DAYS_MAP = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

export async function GET(req: Request) {
  try {
    // Простая защита, чтобы кто попало не вызывал этот адрес
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    now.setHours(now.getHours() + 1); 

    // Добавляем 10 минут
    now.setMinutes(now.getMinutes() + 10);

    // 2. Форматируем время в строку "HH:MM" (например, "09:00")
    const targetTime = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // 3. Получаем текущий день недели
    const currentDay = DAYS_MAP[now.getDay()];

    console.log(`Checking reminders for: ${currentDay} at ${targetTime}`);

    // 4. Ищем уроки, которые начинаются ровно через 10 минут
    const lessons = await Lesson.find({
      day: currentDay,
      startTime: targetTime,
    });

    if (lessons.length > 0) {
      for (const lesson of lessons) {
        const message = `
🏃‍♂️ <b>Через 10 минут пара!</b>

📚 <b>Предмет:</b> ${lesson.title}
🚪 <b>Аудитория:</b> ${lesson.room}
👨‍🏫 <b>Препод:</b> ${lesson.teacher}
ℹ️ <b>Тип:</b> ${lesson.type}
        `;
        await sendTelegramMessage(message);
      }
      return NextResponse.json({ ok: true, sent: lessons.length });
    }

    return NextResponse.json({ ok: true, sent: 0 });

  } catch (error) {
    console.error('Reminder Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}