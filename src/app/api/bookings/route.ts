import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyNewBooking } from '@/bot/telegram';
import { getUser } from '@/lib/userAuth';
import { getLevel, getDiscount } from '@/lib/levels';

async function genNumber(): Promise<string> {
  try {
    const { data } = await supabase.rpc('generate_booking_number');
    if (data) return data;
  } catch {}
  try {
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true });
    return `TJP-${String((count || 0) + 1).padStart(4, '0')}`;
  } catch {}
  return `TJP-${Date.now()}`;
}

export async function GET(req: NextRequest) {
  const balls = parseInt(req.nextUrl.searchParams.get('balls') || '0');
  if (balls < 100) return NextResponse.json({ error: 'Минимум 100 шаров' }, { status: 400 });
  return NextResponse.json({ total_price: (balls / 100) * 70, prepayment_amount: 50 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, customer_phone, game_date, game_time,
            players_count, balls_count, customer_comment, agree_terms,
            bonus_balls_to_use = 0 } = body;

    if (!customer_name?.trim()) return NextResponse.json({ error: 'Введите имя' }, { status: 400 });
    if (!customer_phone?.trim()) return NextResponse.json({ error: 'Введите телефон' }, { status: 400 });
    if (!game_date) return NextResponse.json({ error: 'Выберите дату' }, { status: 400 });
    if (!game_time) return NextResponse.json({ error: 'Выберите время' }, { status: 400 });
    if (!agree_terms) return NextResponse.json({ error: 'Необходимо согласие с условиями' }, { status: 400 });

    const [y, m, d] = game_date.split('-').map(Number);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(y, m - 1, d) < today) return NextResponse.json({ error: 'Нельзя бронировать прошедшую дату' }, { status: 400 });

    const balls = parseInt(String(balls_count)) || 300;
    const players = parseInt(String(players_count)) || 1;
    const formattedTime = String(game_time).length === 5 ? `${game_time}:00` : String(game_time);
    const bookingNumber = await genNumber();

    // Проверить авторизованного пользователя
    const userPayload = getUser(req);
    let userData: Record<string, unknown> | null = null;
    if (userPayload) {
      const { data } = await supabase.from('users').select('*').eq('id', userPayload.id).single();
      userData = data;
    }

    // Скидка по уровню пользователя
    const discount = userData ? getDiscount(userData.total_balls as number) : 0;
    const pricePerBall = 70 * (1 - discount / 100); // цена за 100 шаров с учётом скидки

    // Проверить бонусные шары
    const bonusToUse = Math.max(0, Math.min(bonus_balls_to_use, userData ? (userData.bonus_balls as number) : 0, balls));
    const paidBalls = balls - bonusToUse;
    const totalPrice = Math.round((paidBalls / 100) * pricePerBall);

    const { data: booking, error } = await supabase.from('bookings').insert({
      booking_number: bookingNumber,
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      game_date, game_time: formattedTime,
      players_count: players, balls_count: balls,
      price_per_100_balls: 70, total_price: totalPrice,
      prepayment_amount: 50, prepayment_status: 'pending',
      booking_status: 'awaiting_prepayment',
      customer_comment: customer_comment?.trim() || null,
      user_id: userData?.id || null,
      bonus_balls_used: bonusToUse,
    }).select().single();

    if (error) {
      console.error('Insert error:', JSON.stringify(error));
      return NextResponse.json({ error: error.message || 'Ошибка БД' }, { status: 500 });
    }

    // Списать бонусные шары если использованы
    if (bonusToUse > 0 && userData) {
      const newBonus = Math.max(0, (userData.bonus_balls as number) - bonusToUse);
      await supabase.from('users').update({ bonus_balls: newBonus }).eq('id', userData.id);
      await supabase.from('bonus_transactions').insert({
        user_id: userData.id, amount: -bonusToUse, type: 'used',
        description: `Использовано ${bonusToUse} бонусных шаров в брони #${bookingNumber}`,
        booking_id: booking.id,
      });
    }

    supabase.from('booking_logs').insert({
      booking_id: booking.id, event_type: 'booking_created',
      description: 'Заявка создана через сайт', performed_by: 'client',
    }).then(undefined, console.error);

    notifyNewBooking(booking).catch(console.error);

    return NextResponse.json({
      success: true,
      booking_number: booking.booking_number,
      booking_id: booking.id,
      total_price: booking.total_price,
      prepayment_amount: booking.prepayment_amount,
      bonus_balls_used: bonusToUse,
      discount,
    }, { status: 201 });
  } catch (e) {
    console.error('POST /api/bookings error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка сервера' }, { status: 500 });
  }
}
