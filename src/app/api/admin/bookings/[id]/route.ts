import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', params.id).single();
  if (!booking) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
  const { data: logs } = await supabase.from('booking_logs').select('*')
    .eq('booking_id', params.id).order('created_at');
  return NextResponse.json({ ...booking, logs: logs || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  ['game_date','game_time','admin_comment'].forEach(k => { if (body[k] !== undefined) allowed[k] = body[k]; });
  const { data } = await supabase.from('bookings').update(allowed).eq('id', params.id).select().single();
  return NextResponse.json(data);
}
