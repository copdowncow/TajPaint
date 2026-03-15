import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEFAULT_SLOTS = [
  '10:00','11:00','12:00','13:00','14:00','15:00',
  '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'
].map((t, i) => ({ id: `d${i}`, slot_time: t, is_active: true, sort_order: i }));

const BLOCKING = ['new', 'awaiting_prepayment', 'prepayment_review', 'confirmed'];

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');

  let slots = DEFAULT_SLOTS;
  try {
    const { data } = await supabase
      .from('time_slots').select('*').eq('is_active', true).order('sort_order');
    if (data && data.length > 0) slots = data;
  } catch {}

  let booked = new Set<string>();
  if (date) {
    try {
      const { data } = await supabase
        .from('bookings').select('game_time')
        .eq('game_date', date)
        .in('booking_status', BLOCKING);
      booked = new Set(data?.map(b => String(b.game_time).substring(0, 5)) || []);
    } catch {}
  }

  const now = new Date();
  const isToday = date === todayString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return NextResponse.json(
    slots.map(slot => {
      const timeStr = String(slot.slot_time).substring(0, 5);
      const [h, m] = timeStr.split(':').map(Number);
      const slotMinutes = h * 60 + m;

      const isBooked = booked.has(timeStr);
      // Закрываем слот если сегодня и до него меньше 30 минут
      const isPast = isToday && slotMinutes <= nowMinutes + 30;

      return { ...slot, is_available: !isBooked && !isPast };
    }),
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
