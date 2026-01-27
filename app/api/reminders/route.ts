import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';
import { sendTelegramMessage } from '@/lib/telegram';

const DAYS_MAP = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    
    if (key !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Неверный ключ (Unauthorized)' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    
    const serverTimeUTC = now.toISOString();
    const YOUR_OFFSET = 1; 
    now.setHours(now.getHours() + YOUR_OFFSET);

    now.setMinutes(now.getMinutes() + 10);

    const targetTime = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const currentDay = DAYS_MAP[now.getDay()];

    const lessons = await Lesson.find({
      day: currentDay,
      startTime: targetTime,
    });

    if (lessons.length > 0) {
      for (const lesson of lessons) {
        const message = `🔔 <b>Напоминание!</b>\n\nЧерез 10 минут (${lesson.startTime}):\n<b>${lesson.title}</b> в ${lesson.room}`;
        await sendTelegramMessage(message);
      }
    }

    return NextResponse.json({
      status: 'success',
      debug: {
        serverTimeUTC: serverTimeUTC,
        yourTimeOffset: YOUR_OFFSET,
        calculatedTimeWithOffset: now.toString(),
        lookingForDay: currentDay,
        lookingForTime: targetTime,
        lessonsFoundCount: lessons.length,
        lessonsFound: lessons 
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера', details: error }, { status: 500 });
  }
}