'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Booking { id:string; booking_number:string; customer_name:string; customer_phone:string; game_date:string; game_time:string; players_count:number; balls_count:number; total_price:number; booking_status:string; prepayment_status:string; created_at:string; }

const STATUS_COLOR: Record<string,string> = { new:'#a855f7', awaiting_prepayment:'#f59e0b', prepayment_review:'#8b5cf6', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6b7280', no_show:'#dc2626' };
const STATUS_LABEL: Record<string,string> = { new:'Новая', awaiting_prepayment:'Ждёт предоплату', prepayment_review:'Чек на проверке', confirmed:'Подтверждена', cancelled:'Отменена', completed:'Завершена', no_show:'Не пришёл' };
const PREPAY_LABEL: Record<string,string> = { not_paid:'❌ Нет', pending:'⏳ Ожидается', confirmed:'✅ Внесена', returned:'↩️ Возвращена', held:'🔒 Удержана', cancelled:'🚫 Отменена' };

export default function AdminBookingsPage() {
  const sp = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status:sp.get('status')||'', date:'', phone:'', name:'', search:'' });

  const fetch_ = useCallback(async()=>{
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const p = new URLSearchParams({page:String(page),limit:'12'});
      if(filters.status) p.set('status',filters.status);
      if(filters.date) p.set('date',filters.date);
      if(filters.phone) p.set('phone',filters.phone);
      if(filters.name) p.set('name',filters.name);
      if(filters.search) p.set('search',filters.search);
      const r = await fetch(`/api/admin/bookings?${p}`,{headers:{'Authorization':`Bearer ${token}`}});
      const d = await r.json();
      setBookings(d.bookings||[]); setTotal(d.total||0);
    } finally { setLoading(false); }
  },[page,filters]);

  useEffect(()=>{ fetch_(); },[fetch_]);

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-white">Бронирования</h1><p className="text-sm mt-1" style={{color:'#4b5563'}}>Всего: {total}</p></div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-2">
        <select value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} className="input-field text-sm py-2.5">
          <option value="">Все статусы</option>
          {Object.entries(STATUS_LABEL).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
        <input type="date" value={filters.date} onChange={e=>setFilters(f=>({...f,date:e.target.value}))} className="input-field text-sm py-2.5" style={{colorScheme:'dark'}}/>
        <input type="text" value={filters.phone} onChange={e=>setFilters(f=>({...f,phone:e.target.value}))} className="input-field text-sm py-2.5" placeholder="Телефон"/>
        <input type="text" value={filters.name} onChange={e=>setFilters(f=>({...f,name:e.target.value}))} className="input-field text-sm py-2.5" placeholder="Имя"/>
        <input type="text" value={filters.search} onChange={e=>setFilters(f=>({...f,search:e.target.value}))} className="input-field text-sm py-2.5" placeholder="TJP-0001"/>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_,i)=><div key={i} className="card p-4 h-36 animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {bookings.map(b=>(
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="card p-4 hover:border-blue-500/30 transition-all block group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-black font-mono" style={{color:'#c084fc'}}>{b.booking_number}</span>
                  <h3 className="text-white font-bold text-sm mt-0.5 group-hover:text-blue-400 transition-colors">{b.customer_name}</h3>
                  <p className="text-xs mt-0.5" style={{color:'#4b5563'}}>{b.customer_phone}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0" style={{background:`${STATUS_COLOR[b.booking_status]}18`,color:STATUS_COLOR[b.booking_status]||'#94a3b8'}}>
                  {STATUS_LABEL[b.booking_status]||b.booking_status}
                </span>
              </div>
              <div className="space-y-1 text-xs" style={{color:'#64748b'}}>
                <div>📅 {new Date(b.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в {String(b.game_time).substring(0,5)}</div>
                <div>👥 {b.players_count} чел. · 🎯 {b.balls_count} шаров</div>
                <div className="flex items-center justify-between mt-2 pt-2" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{color:b.prepayment_status==='confirmed'?'#10b981':b.prepayment_status==='returned'?'#c084fc':'#f59e0b'}} className="font-medium">
                    {PREPAY_LABEL[b.prepayment_status]||b.prepayment_status}
                  </span>
                  <span className="font-black text-white">{b.total_price} сом.</span>
                </div>
              </div>
            </Link>
          ))}
          {bookings.length===0&&<div className="card p-12 text-center col-span-3" style={{color:'#374151'}}>Бронирований не найдено</div>}
        </div>
      )}

      {total > 12 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Назад</button>
          <span className="text-sm" style={{color:'#4b5563'}}>Стр. {page} из {Math.ceil(total/12)}</span>
          <button disabled={page>=Math.ceil(total/12)} onClick={()=>setPage(p=>p+1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Далее →</button>
        </div>
      )}
    </div>
  );
}
