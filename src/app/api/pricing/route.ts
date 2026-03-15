import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get('settings')) {
    const { data } = await supabase.from('settings').select('*');
    return NextResponse.json(data || []);
  }
  if (p.get('all')) {
    if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const { data } = await supabase.from('pricing').select('*').order('sort_order');
    return NextResponse.json(data || []);
  }
  const { data } = await supabase.from('pricing').select('*').eq('is_active', true).order('sort_order');
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const body = await req.json();
  const { data } = await supabase.from('pricing').insert(body).select().single();
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const body = await req.json();
  if (p.get('settings') && p.get('key')) {
    const { data } = await supabase.from('settings')
      .update({ value: body.value, updated_at: new Date().toISOString() })
      .eq('key', p.get('key')!).select().single();
    return NextResponse.json(data);
  }
  if (p.get('id')) {
    const { data } = await supabase.from('pricing').update(body).eq('id', p.get('id')!).select().single();
    return NextResponse.json(data);
  }
  return NextResponse.json({ error: 'Нет id' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Нет id' }, { status: 400 });
  await supabase.from('pricing').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
