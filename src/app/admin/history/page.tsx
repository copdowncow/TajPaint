'use client';
import { useEffect, useState, useCallback } from 'react';

interface H { id:string; booking_number:string; customer_name:string; customer_phone:string; game_date:string; game_time:string; players_count:number; balls_count:number; total_price:number; prepayment_amount:number; prepayment_status:string; final_status:string; finished_at:string; }

const FINAL: Record<string,{l:string;c:string}> = { completed:{l:'🏁 Завершена',c:'#10b981'}, no_show:{l:'🚫 Не пришёл',c:'#f59e0b'}, cancelled:{l:'❌ Отменена',c:'#ef4444'} };

export default function HistoryPage() {
  const [history, setHistory] = useState<H[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({date:'',phone:''});

  const fetch_ = useCallback(async()=>{
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const p = new URLSearchParams({page:String(page),limit:'12'});
    if(filters.date) p.set('date',filters.date);
    if(filters.phone) p.set('phone',filters.phone);
    const r = await fetch(`/api/admin/history?${p}`,{headers:{Authorization:`Bearer ${token}`}});
    const d = await r.json();
    setHistory(d.history||[]); setTotal(d.total||0);
    setLoading(false);
  },[page,filters]);

  useEffect(()=>{ fetch_(); },[fetch_]);
  const revenue = history.filter(h=>h.final_status==='completed').reduce((s,h)=>s+Number(h.total_price),0);

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">История игр</h1>
        <p className="text-sm mt-1" style={{color:'#4b5563'}}>Всего: {total} · Выручка на странице: {revenue} сом.</p>
      </div>
      <div className="card p-4 mb-6 flex gap-2 max-w-sm">
        <input type="date" value={filters.date} onChange={e=>setFilters(f=>({...f,date:e.target.value}))} className="input-field text-sm py-2.5 flex-1" style={{colorScheme:'dark'}}/>
        <input type="text" value={filters.phone} onChange={e=>setFilters(f=>({...f,phone:e.target.value}))} className="input-field text-sm py-2.5 flex-1" placeholder="Телефон"/>
      </div>
      {loading
        ?<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(6)].map((_,i)=><div key={i} className="card p-4 h-32 animate-pulse"/>)}</div>
        :<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {history.map(h=>{
            const fs = FINAL[h.final_status]||{l:h.final_status,c:'#94a3b8'};
            return (
              <div key={h.id} className="card p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-black font-mono" style={{color:'#c084fc'}}>{h.booking_number}</span>
                    <h3 className="text-white font-bold text-sm mt-0.5">{h.customer_name}</h3>
                    <p className="text-xs" style={{color:'#4b5563'}}>{h.customer_phone}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:`${fs.c}18`,color:fs.c}}>{fs.l}</span>
                </div>
                <div className="space-y-1 text-xs" style={{color:'#64748b'}}>
                  <div>📅 {new Date(h.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в {String(h.game_time).substring(0,5)}</div>
                  <div>👥 {h.players_count} чел. · 🎯 {h.balls_count} шаров</div>
                  <div className="flex justify-between pt-2 mt-1" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{color:h.prepayment_status==='returned'?'#c084fc':'#4b5563'}}>{h.prepayment_status==='returned'?'↩️ Возвр.':h.prepayment_status==='confirmed'?'✅ Оплач.':'—'}</span>
                    <span className="font-black text-white">{h.total_price} сом.</span>
                  </div>
                </div>
              </div>
            );
          })}
          {history.length===0&&<div className="card p-12 text-center col-span-3" style={{color:'#374151'}}>История пуста</div>}
        </div>
      }
      {total>12&&(
        <div className="flex items-center justify-center gap-4 mt-6">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">← Назад</button>
          <span className="text-sm" style={{color:'#4b5563'}}>Стр. {page} из {Math.ceil(total/12)}</span>
          <button disabled={page>=Math.ceil(total/12)} onClick={()=>setPage(p=>p+1)} className="btn-secondary py-2 px-4 text-sm disabled:opacity-40">Далее →</button>
        </div>
      )}
    </div>
  );
}
