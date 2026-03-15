import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { signToken, getAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();
    if (!login || !password) {
      return NextResponse.json({ error: 'Заполните все поля' }, { status: 400 });
    }

    const { data: admin, error: dbError } = await supabase
      .from('admins').select('*').eq('login', login).single();

    if (dbError) {
      console.error('Auth DB error:', dbError.message);
      // Если таблица пустая или нет записи
      if (dbError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Ошибка базы данных: ' + dbError.message }, { status: 500 });
    }

    if (!admin) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
    }

    const token = signToken({ id: admin.id, login: admin.login, role: admin.role });
    return NextResponse.json({
      token,
      admin: { id: admin.id, login: admin.login, role: admin.role },
    });
  } catch (e) {
    console.error('Auth error:', e);
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Ошибка сервера',
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const admin = getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  return NextResponse.json({ admin });
}
