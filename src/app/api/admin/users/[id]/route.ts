import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { data: user } = await supabase.from('users').select('*').eq('id', params.id).single();
  if (!user) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  const { data: tx } = await supabase.from('bonus_transactions').select('*').eq('user_id', params.id).order('created_at', { ascending: false }).limit(20);
  const { data: books } = await supabase.from('bookings').select('*').eq('user_id', params.id).order('created_at', { ascending: false });
  return NextResponse.json({ ...user, transactions: tx || [], bookings: books || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  ['is_active', 'level', 'bonus_balls', 'full_name'].forEach(k => { if (body[k] !== undefined) allowed[k] = body[k]; });

  // Если меняем бонусные шары — записать транзакцию
  if (body.bonus_balls !== undefined && body.bonus_balls_reason) {
    const { data: user } = await supabase.from('users').select('bonus_balls').eq('id', params.id).single();
    if (user) {
      const diff = body.bonus_balls - user.bonus_balls;
      if (diff !== 0) {
        await supabase.from('bonus_transactions').insert({
          user_id: params.id, amount: diff, type: 'admin_gift',
          description: body.bonus_balls_reason || 'Начисление администратором',
        });
      }
    }
  }

  const { data } = await supabase.from('users').update(allowed).eq('id', params.id).select().single();
  return NextResponse.json(data);
}
