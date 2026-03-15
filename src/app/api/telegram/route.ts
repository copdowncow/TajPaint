import { NextRequest, NextResponse } from 'next/server';
import { handleCallback, tgSend } from '@/bot/telegram';

// Telegram присылает сюда все обновления
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    }

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      if (update.message.text === '/start') {
        await tgSend(chatId,
          `🎯 *Taj Paintball Bot*\n\nChat ID: \`${chatId}\`\nБот активен ✅\n\nПолучаю уведомления о новых бронированиях.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook active' });
}
