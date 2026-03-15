import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bookingNumber = formData.get('booking_number') as string;
    const bookingId = formData.get('booking_id') as string;
    const customerName = formData.get('customer_name') as string;
    const customerPhone = formData.get('customer_phone') as string;

    if (!file) return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });

    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!TOKEN || !CHAT_ID) {
      return NextResponse.json({ error: 'Telegram не настроен' }, { status: 500 });
    }

    // Отправить фото/документ в Telegram
    const caption =
      `📎 *Чек об оплате*\n\n` +
      `📋 Бронь: #${bookingNumber}\n` +
      `👤 ${customerName}\n` +
      `📞 ${customerPhone}\n` +
      `💰 Предоплата 50 сомони\n` +
      `📱 Алиф или Dushanbe City (DC)\n` +
      `📞 +992 20 840 00 00\n\n` +
      `_Нажмите «Предоплата получена» для подтверждения брони_`;

    const tgForm = new FormData();
    tgForm.append('chat_id', CHAT_ID);
    tgForm.append('caption', caption);
    tgForm.append('parse_mode', 'Markdown');
    tgForm.append('reply_markup', JSON.stringify({
      inline_keyboard: [[
        { text: '💰 Предоплата получена → Подтвердить', callback_data: `prepay_${bookingId}` },
      ]],
    }));

    // Определяем тип файла
    const isImage = file.type.startsWith('image/');
    const method = isImage ? 'sendPhoto' : 'sendDocument';
    const field = isImage ? 'photo' : 'document';

    const bytes = await file.arrayBuffer();
    const blob = new Blob([bytes], { type: file.type });
    tgForm.append(field, blob, file.name);

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      body: tgForm,
    });

    const result = await res.json() as { ok: boolean; description?: string };

    if (!result.ok) {
      console.error('Telegram sendPhoto error:', result.description);
      return NextResponse.json({ error: 'Не удалось отправить в Telegram' }, { status: 500 });
    }

    // Обновить статус предоплаты на "ожидает проверки"
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('bookings').update({
        prepayment_status: 'pending',
        booking_status: 'prepayment_review',
      }).eq('id', bookingId);
      await supabase.from('booking_logs').insert({
        booking_id: bookingId,
        event_type: 'receipt_uploaded',
        description: 'Клиент прикрепил чек об оплате',
        performed_by: 'client',
      });
    } catch (e) {
      console.error('DB update error:', e);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Receipt upload error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
