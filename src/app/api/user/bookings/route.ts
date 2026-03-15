import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { data } = await supabase.from('bookings').select('*')
    .eq('user_id', user.id).order('created_at', { ascending: false });

  return NextResponse.json(data || []);
}
