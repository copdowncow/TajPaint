import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/userAuth';
import { getLevel, getLevelProgress, getNextLevel, LEVELS } from '@/lib/levels';

export const dynamic = 'force-dynamic';

const ACHIEVEMENTS = [
  { id: 'first_game',   emoji: '🎮', title: 'Первая игра',     desc: 'Сыграл первую игру',          cond: (g: number, b: number, xp: number) => g >= 1 },
  { id: 'five_games',   emoji: '🔥', title: 'Ветеран',         desc: '5 игр сыграно',               cond: (g: number, b: number, xp: number) => g >= 5 },
  { id: 'ten_games',    emoji: '⚡', title: 'Боец',            desc: '10 игр сыграно',              cond: (g: number, b: number, xp: number) => g >= 10 },
  { id: 'twenty_games', emoji: '🎯', title: 'Снайпер',         desc: '20 игр сыграно',              cond: (g: number, b: number, xp: number) => g >= 20 },
  { id: 'fifty_games',  emoji: '👑', title: 'Король арены',    desc: '50 игр сыграно',              cond: (g: number, b: number, xp: number) => g >= 50 },
  { id: 'balls_1000',   emoji: '💯', title: 'Тысячник',        desc: '1000 шаров использовано',     cond: (g: number, b: number, xp: number) => b >= 1000 },
  { id: 'balls_5000',   emoji: '🏆', title: 'Мастер',          desc: '5000 шаров использовано',     cond: (g: number, b: number, xp: number) => b >= 5000 },
  { id: 'balls_20000',  emoji: '💎', title: 'Легенда',         desc: 'Достигнут уровень Элита',     cond: (g: number, b: number, xp: number) => xp >= 20000 },
  { id: 'streak_3',     emoji: '🔥', title: 'Серия 3 дня',     desc: '3 дня подряд',                cond: (g: number, b: number, xp: number, s: number) => s >= 3 },
  { id: 'referral_1',   emoji: '👥', title: 'Вербовщик',       desc: 'Первый реферал сыграл',       cond: (g: number, b: number, xp: number, s: number, r: number) => r >= 1 },
];

export async function GET(req: NextRequest) {
  const userPayload = getUser(req);
  if (!userPayload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { data: u } = await supabase.from('users').select('*').eq('id', userPayload.id).single();
  if (!u) return NextResponse.json({ error: 'Не найден' }, { status: 404 });

  // Истёкшие бонусы
  const { data: expired } = await supabase.from('bonus_transactions')
    .select('id, amount').eq('user_id', u.id).eq('type', 'purchase_bonus')
    .lt('expires_at', new Date().toISOString()).gt('amount', 0);
  if (expired?.length) {
    const total = expired.reduce((s: number, t: {amount: number}) => s + t.amount, 0);
    if (total > 0 && u.bonus_balls > 0) {
      const remove = Math.min(total, u.bonus_balls);
      await supabase.from('users').update({ bonus_balls: u.bonus_balls - remove }).eq('id', u.id);
      for (const t of expired) await supabase.from('bonus_transactions').update({ amount: 0 }).eq('id', t.id);
    }
  }

  // Статистика по месяцам
  const { data: bkData } = await supabase.from('bookings').select('game_date, balls_count, game_time')
    .eq('user_id', u.id).eq('booking_status', 'completed');
  const monthlyStats: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  bkData?.forEach(b => {
    const m = b.game_date?.substring(0, 7);
    if (m) monthlyStats[m] = (monthlyStats[m] || 0) + (b.balls_count || 0);
    const h = parseInt(String(b.game_time || '12').substring(0, 2));
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const stats6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { month: key, balls: monthlyStats[key] || 0 };
  });
  const favoriteHour = Object.keys(hourCounts).length > 0
    ? parseInt(Object.entries(hourCounts).sort((a,b)=>b[1]-a[1])[0][0]) : 12;

  // Рефералы
  const { data: referrals } = await supabase.from('referrals').select('*, referred:referred_id(full_name, email, created_at)')
    .eq('referrer_id', u.id).order('created_at', { ascending: false });
  const activatedReferrals = referrals?.filter(r => r.status === 'activated').length || 0;

  // Достижения
  const achievements = ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: a.cond(u.total_games||0, u.total_balls||0, u.xp||0, u.streak_days||0, activatedReferrals),
    cond: undefined,
  }));

  // Уведомления
  const { data: notifications } = await supabase.from('user_notifications').select('*')
    .eq('user_id', u.id).order('created_at', { ascending: false }).limit(20);
  const unread = notifications?.filter(n => !n.is_read).length || 0;

  // Транзакции
  const { data: transactions } = await supabase.from('bonus_transactions').select('*')
    .eq('user_id', u.id).order('created_at', { ascending: false }).limit(15);

  // ДР
  let birthdayIn: number | null = null;
  if (u.birth_date) {
    const today = new Date();
    const bd = new Date(u.birth_date);
    let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next = new Date(today.getFullYear()+1, bd.getMonth(), bd.getDate());
    birthdayIn = Math.ceil((next.getTime() - today.getTime()) / 86400000);
  }

  const xp = u.xp || 0;
  const level = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const progress = getLevelProgress(xp);

  return NextResponse.json({
    id: u.id, email: u.email, phone: u.phone, full_name: u.full_name,
    birth_date: u.birth_date, avatar_emoji: u.avatar_emoji || '🎯',
    bonus_balls: u.bonus_balls || 0, total_balls: u.total_balls || 0,
    total_games: u.total_games || 0, total_spent: u.total_spent || 0,
    xp, streak_days: u.streak_days || 0,
    level: { ...level, progress, nextLevel },
    all_levels: LEVELS,
    achievements,
    monthly_stats: stats6,
    favorite_hour: favoriteHour,
    avg_balls: (u.total_games||0) > 0 ? Math.round((u.total_balls||0) / u.total_games) : 0,
    referral_code: u.referral_code || `TAJ${u.id.substring(0,6).toUpperCase()}`,
    referrals: referrals || [],
    activated_referrals: activatedReferrals,
    birthday_in: birthdayIn,
    notifications: notifications || [],
    unread_notifications: unread,
    transactions: transactions || [],
    created_at: u.created_at,
  });
}

export async function PATCH(req: NextRequest) {
  const userPayload = getUser(req);
  if (!userPayload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if (body.full_name !== undefined) allowed.full_name = body.full_name?.trim() || null;
  if (body.birth_date !== undefined) allowed.birth_date = body.birth_date || null;
  if (body.phone !== undefined) allowed.phone = body.phone?.trim() || null;
  if (body.avatar_emoji !== undefined) allowed.avatar_emoji = body.avatar_emoji;
  const { data } = await supabase.from('users').update(allowed).eq('id', userPayload.id).select().single();
  return NextResponse.json(data);
}
