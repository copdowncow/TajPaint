import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const today = new Date().toISOString().split('T')[0];
  const [total, todayR, confirmed, completed] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('game_date', today),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'confirmed'),
    supabase.from('games_history').select('id', { count: 'exact', head: true }),
  ]);
  const { data: rev } = await supabase.from('games_history').select('total_price').eq('final_status', 'completed');
  return NextResponse.json({
    total_bookings: total.count || 0,
    today_bookings: todayR.count || 0,
    confirmed_bookings: confirmed.count || 0,
    total_games: completed.count || 0,
    total_revenue: rev?.reduce((s, r) => s + Number(r.total_price), 0) || 0,
  });
}
