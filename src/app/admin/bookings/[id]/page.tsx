'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Log { id:string; event_type:string; description?:string; old_value?:string; new_value?:string; performed_by?:string; created_at:string; }
interface Booking { id:string; booking_number:string; customer_name:string; customer_phone:string; game_date:string; game_time:string; players_count:number; balls_count:number; total_price:number; prepayment_amount:number; booking_status:string; prepayment_status:string; customer_comment?:string; admin_comment?:string; created_at:string; logs?:Log[]; }

const STATUSES = [{v:'new',l:'🆕 Новая'},{v:'awaiting_prepayment',l:'💰 Ждёт предоплату'},{v:'prepayment_review',l:'🔍 Чек на проверке'},{v:'confirmed',l:'✅ Подтверждена'},{v:'completed',l:'🏁 Завершена'},{v:'no_show',l:'🚫 Не пришёл'},{v:'cancelled',l:'❌ Отменена'}];
const PREPAYS = [{v:'not_paid',l:'❌ Не внесена'},{v:'pending',l:'⏳ Ожидается'},{v:'confirmed',l:'✅ Подтверждена'},{v:'returned',l:'↩️ Возвращена'},{v:'held',l:'🔒 Удержана'},{v:'cancelled',l:'🚫 Отменена'}];
const STATUS_COLOR: Record<string,string> = { new:'#a855f7', awaiting_prepayment:'#f59e0b', prepayment_review:'#8b5cf6', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6b7280', no_show:'#dc2626' };

export default function BookingDetailPage() {
  const { id } = useParams<{id:string}>();
  const [booking, setBooking] = useState<Booking|null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPrepay, setNewPrepay] = useState('');
  const [adminComment, setAdminComment] = useState('');

  const load = ()=>{
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    fetch(`/api/admin/bookings/${id}`,{headers:{'Authorization':`Bearer ${token}`}})
      .then(r=>r.json()).then(d=>{setBooking(d);setNewStatus(d.booking_status);setNewPrepay(d.prepayment_status);setAdminComment(d.admin_comment||'');})
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[id]);

  const doAction = async(url:string,body:object)=>{
    setSaving(true); setMsg('');
    const token = localStorage.getItem('admin_token');
    try {
      const r = await fetch(url,{method:'PATCH',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(r.ok){setMsg('✅ Сохранено'); load();}
      else { const d=await r.json(); setMsg('❌ '+d.error); }
    } catch { setMsg('❌ Ошибка'); }
    finally { setSaving(false); }
  };

  if(loading) return <div className="p-12 text-center" style={{color:'#a855f7'}}>Загрузка...</div>;
  if(!booking) return <div className="p-12 text-center" style={{color:'#4b5563'}}>Не найдено</div>;

  const statusColor = STATUS_COLOR[booking.booking_status]||'#94a3b8';

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/bookings" className="text-sm transition-colors" style={{color:'#4b5563'}}>← Назад</Link>
        <div>
          <h1 className="text-xl font-black text-white">Бронь <span style={{color:'#c084fc'}}>{booking.booking_number}</span></h1>
          <p className="text-xs mt-0.5" style={{color:'#4b5563'}}>{new Date(booking.created_at).toLocaleString('ru-RU')}</p>
        </div>
        <span className="ml-auto text-sm font-bold px-3 py-1.5 rounded-xl" style={{background:`${statusColor}18`,color:statusColor}}>
          {STATUSES.find(s=>s.v===booking.booking_status)?.l||booking.booking_status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Info card */}
        <div className="card p-5">
          <h2 className="text-white font-bold mb-4 text-sm uppercase tracking-wider" style={{color:'#4b5563'}}>Данные клиента</h2>
          <div className="space-y-3">
            {[
              ['👤 Имя', booking.customer_name],
              ['📞 Телефон', booking.customer_phone],
              ['📅 Дата', `${new Date(booking.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в ${String(booking.game_time).substring(0,5)}`],
              ['👥 Игроков', `${booking.players_count} чел.`],
              ['🎯 Шаров', `${booking.balls_count} шт.`],
              ['💵 Итого', `${booking.total_price} сомони`],
              ['💳 Предоплата', `${booking.prepayment_amount} сомони`],
            ].map(([k,v])=>(
              <div key={String(k)} className="flex justify-between items-start gap-4 text-sm">
                <span style={{color:'#4b5563'}}>{k}</span>
                <span className="text-white font-medium text-right">{v}</span>
              </div>
            ))}
            {booking.customer_comment&&(
              <div className="pt-3" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
                <p className="text-xs mb-1" style={{color:'#4b5563'}}>Комментарий клиента:</p>
                <p className="text-sm text-white">{booking.customer_comment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Quick actions */}
          <div className="card p-4">
            <h2 className="text-sm font-bold mb-3" style={{color:'#4b5563'}}>БЫСТРЫЕ ДЕЙСТВИЯ</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                {l:'💰 Предоплата ✓',fn:()=>doAction(`/api/admin/bookings/${id}/prepayment`,{prepayment_status:'confirmed'}),color:'#10b981'},
                {l:'✅ Подтвердить',fn:()=>doAction(`/api/admin/bookings/${id}/status`,{status:'confirmed'}),color:'#a855f7'},
                {l:'🏁 Завершить',fn:()=>doAction(`/api/admin/bookings/${id}/status`,{status:'completed'}),color:'#8b5cf6'},
                {l:'🚫 Не пришёл',fn:()=>doAction(`/api/admin/bookings/${id}/status`,{status:'no_show'}),color:'#f59e0b'},
                {l:'↩️ Вернуть пред.',fn:()=>doAction(`/api/admin/bookings/${id}/prepayment`,{prepayment_status:'returned'}),color:'#06b6d4'},
                {l:'❌ Отменить',fn:()=>doAction(`/api/admin/bookings/${id}/status`,{status:'cancelled'}),color:'#ef4444'},
              ].map(a=>(
                <button key={a.l} disabled={saving} onClick={a.fn}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all disabled:opacity-40 text-left"
                  style={{background:`${a.color}12`,border:`1px solid ${a.color}30`,color:a.color,WebkitTapHighlightColor:'transparent'}}>
                  {a.l}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="card p-4">
            <h2 className="text-sm font-bold mb-3" style={{color:'#4b5563'}}>СТАТУС БРОНИ</h2>
            <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="input-field text-sm py-2.5 mb-2">
              {STATUSES.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <textarea value={adminComment} onChange={e=>setAdminComment(e.target.value)} className="input-field text-sm resize-none mb-2" rows={2} placeholder="Комментарий..."/>
            <button onClick={()=>doAction(`/api/admin/bookings/${id}/status`,{status:newStatus,admin_comment:adminComment||undefined})} disabled={saving} className="btn-primary w-full py-2.5 text-sm">Сохранить</button>
          </div>

          {/* Prepayment */}
          <div className="card p-4">
            <h2 className="text-sm font-bold mb-3" style={{color:'#4b5563'}}>СТАТУС ПРЕДОПЛАТЫ</h2>
            <select value={newPrepay} onChange={e=>setNewPrepay(e.target.value)} className="input-field text-sm py-2.5 mb-2">
              {PREPAYS.map(s=><option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <button onClick={()=>doAction(`/api/admin/bookings/${id}/prepayment`,{prepayment_status:newPrepay})} disabled={saving} className="btn-secondary w-full py-2.5 text-sm">Сохранить</button>
          </div>

          {msg&&<p className="text-center text-sm font-medium" style={{color:msg.startsWith('✅')?'#4ade80':'#f87171'}}>{msg}</p>}
        </div>
      </div>

      {/* Logs */}
      {booking.logs && booking.logs.length > 0 && (
        <div className="card mt-4 overflow-hidden">
          <div className="p-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <h2 className="text-white font-bold text-sm">История изменений</h2>
          </div>
          <div>
            {booking.logs.map(log=>(
              <div key={log.id} className="p-4 text-sm" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold" style={{color:'#c084fc'}}>{log.event_type}</span>
                  <span className="text-xs" style={{color:'#374151'}}>{new Date(log.created_at).toLocaleString('ru-RU')}</span>
                </div>
                {log.description&&<p style={{color:'#94a3b8'}}>{log.description}</p>}
                {log.performed_by&&<p className="text-xs mt-0.5" style={{color:'#374151'}}>👤 {log.performed_by}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
