import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const limit = Math.min(parseInt(p.get('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  let q = supabase.from('bookings').select('*', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  if (p.get('status')) q = q.eq('booking_status', p.get('status')!);
  if (p.get('date')) q = q.eq('game_date', p.get('date')!);
  if (p.get('phone')) q = q.ilike('customer_phone', `%${p.get('phone')}%`);
  if (p.get('name')) q = q.ilike('customer_name', `%${p.get('name')}%`);
  if (p.get('search')) q = q.eq('booking_number', p.get('search')!);

  const { data, count } = await q;
  return NextResponse.json({ bookings: data || [], total: count || 0, page, limit });
}
