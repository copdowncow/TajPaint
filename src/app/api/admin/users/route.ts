import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const page = parseInt(p.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let q = supabase.from('users').select('*', { count: 'exact' })
    .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (p.get('phone')) q = q.ilike('phone', `%${p.get('phone')}%`);
  if (p.get('level')) q = q.eq('level', p.get('level')!);

  const { data, count } = await q;
  return NextResponse.json({ users: data || [], total: count || 0 });
}
