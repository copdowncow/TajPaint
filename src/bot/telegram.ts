import { supabase } from '@/lib/supabase';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
// Два администратора
const CHAT_IDS = [
  process.env.TELEGRAM_ADMIN_CHAT_ID,
  process.env.TELEGRAM_ADMIN_CHAT_ID_2,
].filter(Boolean) as string[];

const TG = `https://api.telegram.org/bot${TOKEN}`;

async function call(method: string, body: Record<string, unknown>) {
  if (!TOKEN) return null;
  try {
    const r = await fetch(`${TG}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  } catch (e) {
    console.error(`TG ${method} error:`, e);
    return null;
  }
}

// Отправить всем администраторам
async function broadcast(text: string, extra?: Record<string, unknown>) {
  for (const chatId of CHAT_IDS) {
    await call('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra });
  }
}

export async function tgSend(chatId: string | number, text: string, extra?: Record<string, unknown>) {
  return call('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown', ...extra });
}

export async function tgAnswer(id: string, text: string) {
  return call('answerCallbackQuery', { callback_query_id: id, text });
}

export async function tgEditMarkup(chatId: number, messageId: number) {
  return call('editMessageReplyMarkup', {
    chat_id: chatId, message_id: messageId,
    reply_markup: { inline_keyboard: [] },
  });
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('ru-RU');
}

export async function notifyNewBooking(b: Record<string, unknown>) {
  if (!TOKEN || CHAT_IDS.length === 0) return;
  const text =
    `🎯 *Новая бронь — Taj Paintball*\n\n` +
    `📋 #${b.booking_number}\n` +
    `👤 ${b.customer_name}\n` +
    `📞 ${b.customer_phone}\n` +
    `📅 ${fmtDate(b.game_date as string)} в ${String(b.game_time).substring(0, 5)}\n` +
    `👥 ${b.players_count} чел. · 🎯 ${b.balls_count} шаров\n` +
    `💵 ${b.total_price} сомони\n` +
    `💰 Предоплата: ${b.prepayment_amount} сомони\n` +
    (b.customer_comment ? `💬 ${b.customer_comment}\n` : '') +
    `\n_Нажмите кнопку после получения предоплаты_`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💰 Предоплата получена → Подтвердить', callback_data: `prepay_${b.id}` }],
        [{ text: '✅ Подтвердить', callback_data: `confirm_${b.id}` }, { text: '❌ Отменить', callback_data: `cancel_${b.id}` }],
        [{ text: '🏁 Завершить игру', callback_data: `complete_${b.id}` }, { text: '🚫 Не пришёл', callback_data: `noshow_${b.id}` }],
        [{ text: '↩️ Вернуть предоплату', callback_data: `refund_${b.id}` }],
      ],
    },
  };

  for (const chatId of CHAT_IDS) {
    await tgSend(chatId, text, keyboard);
  }
}

export async function notifyStatusChange(b: Record<string, unknown>, status: string) {
  if (!TOKEN || CHAT_IDS.length === 0) return;
  const labels: Record<string, string> = {
    confirmed: '✅ Подтверждена', cancelled: '❌ Отменена',
    completed: '🏁 Завершена', no_show: '🚫 Не пришёл',
  };
  await broadcast(
    `🔄 *#${b.booking_number}* — ${labels[status] || status}\n` +
    `${b.customer_name} · ${fmtDate(b.game_date as string)}`
  );
}

export async function handleCallback(query: {
  id: string;
  data?: string;
  message?: { chat: { id: number }; message_id: number };
}) {
  if (!query.data || !query.message) return;

  const { data, message } = query;
  const chatId = message.chat.id;
  const msgId = message.message_id;
  const parts = data.split('_');
  const bookingId = parts[parts.length - 1];
  const action = parts.slice(0, -1).join('_');

  type A = { label: string; status?: string; prepayment?: string; autoConfirm?: boolean };
  const actions: Record<string, A> = {
    prepay:   { label: '💰 Предоплата получена — бронь подтверждена!', prepayment: 'confirmed', autoConfirm: true },
    confirm:  { label: '✅ Бронь подтверждена', status: 'confirmed' },
    cancel:   { label: '❌ Бронь отменена', status: 'cancelled' },
    complete: { label: '🏁 Игра завершена', status: 'completed' },
    noshow:   { label: '🚫 Клиент не пришёл', status: 'no_show' },
    refund:   { label: '↩️ Предоплата возвращена', prepayment: 'returned' },
  };

  const mapped = actions[action];
  if (!mapped) return;

  try {
    if (mapped.prepayment) {
      const upd: Record<string, unknown> = { prepayment_status: mapped.prepayment };
      if (mapped.prepayment === 'confirmed') upd.prepayment_confirmed_at = new Date().toISOString();
      if (mapped.prepayment === 'returned') upd.prepayment_returned_at = new Date().toISOString();
      if (mapped.autoConfirm) { upd.booking_status = 'confirmed'; upd.confirmed_at = new Date().toISOString(); }
      await supabase.from('bookings').update(upd).eq('id', bookingId);
    }

    if (mapped.status) {
      const upd: Record<string, unknown> = { booking_status: mapped.status };
      if (mapped.status === 'confirmed') upd.confirmed_at = new Date().toISOString();
      if (mapped.status === 'cancelled') upd.cancelled_at = new Date().toISOString();
      if (['completed', 'no_show'].includes(mapped.status)) upd.completed_at = new Date().toISOString();
      const { data: bk } = await supabase.from('bookings').update(upd).eq('id', bookingId).select().single();
      if (bk && ['completed', 'no_show'].includes(mapped.status)) {
        await supabase.from('games_history').insert({
          booking_id: bk.id, booking_number: bk.booking_number,
          customer_name: bk.customer_name, customer_phone: bk.customer_phone,
          game_date: bk.game_date, game_time: bk.game_time,
          players_count: bk.players_count, balls_count: bk.balls_count,
          total_price: bk.total_price, prepayment_amount: bk.prepayment_amount,
          prepayment_status: bk.prepayment_status, final_status: mapped.status,
          finished_at: new Date().toISOString(),
        });
      }
    }

    await supabase.from('booking_logs').insert({
      booking_id: bookingId, event_type: action,
      description: mapped.label, performed_by: 'telegram_bot',
    });

    await tgAnswer(query.id, mapped.label);
    await tgEditMarkup(chatId, msgId);
    await tgSend(chatId, mapped.label);
  } catch (e) {
    console.error('handleCallback error:', e);
    await tgAnswer(query.id, 'Ошибка при обновлении');
  }
}

export async function registerWebhook() {
  if (!TOKEN) { console.warn('⚠️  TELEGRAM_BOT_TOKEN not set'); return; }
  const raw = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_URL || '';
  if (!raw) { console.warn('⚠️  Set APP_URL for Telegram webhook'); return; }
  const domain = raw.replace(/^https?:\/\//, '');
  const webhookUrl = `https://${domain}/api/telegram`;
  const r = await fetch(`${TG}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, drop_pending_updates: true, allowed_updates: ['message', 'callback_query'] }),
  });
  const res = await r.json() as { ok: boolean; description?: string };
  console.log(res.ok ? `🤖 Telegram webhook: ${webhookUrl}` : `⚠️  Webhook error: ${res.description}`);
}
