import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { prepayment_status } = await req.json();
  const valid = ['not_paid','pending','confirmed','returned','held','cancelled'];
  if (!valid.includes(prepayment_status)) return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });

  const upd: Record<string, unknown> = { prepayment_status };
  if (prepayment_status === 'confirmed') {
    upd.prepayment_confirmed_at = new Date().toISOString();
    upd.booking_status = 'confirmed';
    upd.confirmed_at = new Date().toISOString();
  }
  if (prepayment_status === 'returned') upd.prepayment_returned_at = new Date().toISOString();

  const { data: bk } = await supabase.from('bookings').update(upd).eq('id', params.id).select().single();
  if (!bk) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  await supabase.from('booking_logs').insert({
    booking_id: params.id, event_type: 'prepayment_updated',
    new_value: prepayment_status, performed_by: admin.login,
  });

  return NextResponse.json(bk);
}
