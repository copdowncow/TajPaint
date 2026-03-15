import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signUserToken } from '@/lib/userAuth';
import { getLevel } from '@/lib/levels';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });

    const { data: user } = await supabase.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
    if (!user) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    if (!user.is_active) return NextResponse.json({ error: 'Аккаунт заблокирован' }, { status: 403 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });

    const token = signUserToken({ id: user.id, email: user.email, type: 'user' });
    const level = getLevel(user.total_balls);
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, birth_date: user.birth_date, phone: user.phone, avatar_emoji: user.avatar_emoji, bonus_balls: user.bonus_balls, total_balls: user.total_balls, total_games: user.total_games, level: level.key, level_name: level.name, level_emoji: level.emoji },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Ошибка' }, { status: 500 });
  }
}
