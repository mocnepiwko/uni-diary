import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lesson from '@/models/Lesson';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Helper to send message back
async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

// Map JS day index (0=Sunday) to your DB day strings
const DAYS_MAP = [
  'Воскресенье', // 0
  'Понедельник', // 1
  'Вторник',     // 2
  'Среда',       // 3
  'Четверг',     // 4
  'Пятница',     // 5
  'Суббота'      // 6
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Check if it's a message
    if (!body.message || !body.message.text) {
      return NextResponse.json({ ok: true }); // Just ignore non-text updates
    }

    const chatId = body.message.chat.id;
    const text = body.message.text;

    // --- LOGIC FOR COMMANDS ---

    if (text === '/today') {
      await dbConnect();
      
      const todayIndex = new Date().getDay(); 
      const todayStr = DAYS_MAP[todayIndex];

      // Find lessons for today
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
    else if (text === '/start') {
      await sendMessage(chatId, "Привет! Я бот UniDiary. Напиши /today чтобы узнать расписание.");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}