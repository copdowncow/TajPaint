import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signUserToken } from '@/lib/userAuth';
import { getLevel } from '@/lib/levels';

function genCode(id: string): string {
  return `TAJ${id.substring(0, 6).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, birth_date, phone, ref } = await req.json();
    if (!email?.trim() || !email.includes('@')) return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
    if (!password || password.length < 6) return NextResponse.json({ error: 'Пароль минимум 6 символов' }, { status: 400 });

    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase().trim()).single();
    if (existing) return NextResponse.json({ error: 'Email уже зарегистрирован' }, { status: 409 });

    // Найти реферера
    let referrerId: string | null = null;
    if (ref) {
      const { data: referrer } = await supabase.from('users').select('id').eq('referral_code', ref.toUpperCase()).single();
      if (referrer) referrerId = referrer.id;
    }

    const hash = await bcrypt.hash(password, 10);
    const tempId = crypto.randomUUID();
    const referralCode = genCode(tempId);

    const { data: user, error } = await supabase.from('users').insert({
      email: email.toLowerCase().trim(),
      password_hash: hash,
      full_name: full_name?.trim() || null,
      birth_date: birth_date || null,
      phone: phone?.trim() || null,
      bonus_balls: 50,
      registration_bonus_given: true,
      level: 'rookie',
      xp: 0,
      referral_code: referralCode,
      referred_by: referrerId,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Обновить реферальный код с реальным ID
    const realCode = genCode(user.id);
    await supabase.from('users').update({ referral_code: realCode }).eq('id', user.id);

    // Регистрационный бонус
    await supabase.from('bonus_transactions').insert({
      user_id: user.id, amount: 50, type: 'registration',
      description: '🎁 Приветственный бонус за регистрацию',
    });

    // Создать реферальную запись
    if (referrerId) {
      await supabase.from('referrals').insert({
        referrer_id: referrerId,
        referred_id: user.id,
        status: 'pending',
      });
      // Уведомить реферера
      await supabase.from('user_notifications').insert({
        user_id: referrerId, type: 'referral_joined',
        title: '👥 Друг зарегистрировался!',
        body: `${full_name || email} зарегистрировался по вашей ссылке. Бонус придёт когда он сыграет первую игру.`,
      });
    }

    // Приветственное уведомление
    await supabase.from('user_notifications').insert({
      user_id: user.id, type: 'welcome',
      title: '🎯 Добро пожаловать в Taj Paintball!',
      body: 'Вам начислено 50 бонусных шаров. Используйте их при следующем бронировании!',
    });

    const token = signUserToken({ id: user.id, email: user.email, type: 'user' });
    const level = getLevel(0);
    return NextResponse.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, bonus_balls: 50, total_balls: 0, xp: 0, level: level.key, level_name: level.name, level_emoji: level.emoji, referral_code: realCode } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка' }, { status: 500 });
  }
}
