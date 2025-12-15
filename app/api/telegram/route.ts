// app/api/telegram/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

const DAYS_MAP = [
  'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true }); 
    }

    const chatId = body.message.chat.id;
    const text = body.message.text;

    if (text === '/id') {
      await sendMessage(chatId, `🆔 ID этого чата: <code>${chatId}</code>`);
      return NextResponse.json({ ok: true });
    }
    // -----------------------------

    if (text === '/today') {
      await dbConnect();
      
      const now = new Date();
      now.setHours(now.getHours() + 1); 
      
      const todayIndex = now.getDay(); 
      const todayStr = DAYS_MAP[todayIndex];

      const lessons = await Lesson.find({ day: todayStr }).sort({ startTime: 1 });

      if (lessons.length === 0) {
        await sendMessage(chatId, `📅 <b>${todayStr}</b>\n\nПар нет! Отдыхай 😴`);
      } else {
        let response = `📅 <b>Расписание на ${todayStr}:</b>\n\n`;
        lessons.forEach((l) => {
          response += `⏰ <b>${l.startTime} - ${l.endTime}</b>\n`;
          response += `📚 ${l.title} (${l.type})\n`;
          response += `👨‍🏫 ${l.teacher}\n`;
          response += `🚪 ${l.room}\n\n`;
        });
        await sendMessage(chatId, response);
      }
    } 

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Bot Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}