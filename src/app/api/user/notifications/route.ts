import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/userAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { data } = await supabase.from('user_notifications').select('*')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
  const unread = data?.filter(n => !n.is_read).length || 0;
  return NextResponse.json({ notifications: data || [], unread });
}

export async function PATCH(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  await supabase.from('user_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
  return NextResponse.json({ success: true });
}
