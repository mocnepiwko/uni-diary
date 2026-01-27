

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const CHAT_ID = '-1003687270384'; 

export async function sendTelegramMessage(text: string) {
  console.log("🚀 Пытаюсь отправить сообщение в:", CHAT_ID); 

  if (!TELEGRAM_TOKEN) {
    console.error("❌ Нет токена бота!");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ ОШИБКА ТЕЛЕГРАМА:", JSON.stringify(data, null, 2));
    } else {
      console.log("✅ Сообщение успешно ушло!");
    }

  } catch (error) {
    console.error("❌ Ошибка сети:", error);
  }
}