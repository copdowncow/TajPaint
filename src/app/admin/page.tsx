'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats { total_bookings:number; today_bookings:number; confirmed_bookings:number; total_games:number; total_revenue:number; }
interface Booking { id:string; booking_number:string; customer_name:string; customer_phone:string; game_date:string; game_time:string; players_count:number; balls_count:number; total_price:number; booking_status:string; prepayment_status:string; created_at:string; }

const STATUS_COLOR: Record<string,string> = {
  new:'#a855f7', awaiting_prepayment:'#f59e0b', prepayment_review:'#8b5cf6',
  confirmed:'#10b981', cancelled:'#ef4444', completed:'#6b7280', no_show:'#dc2626',
};
const STATUS_LABEL: Record<string,string> = {
  new:'Новая', awaiting_prepayment:'Ждёт предоплату', prepayment_review:'Чек на проверке',
  confirmed:'Подтверждена', cancelled:'Отменена', completed:'Завершена', no_show:'Не пришёл',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats|null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);

  useEffect(()=>{
    const token = localStorage.getItem('admin_token');
    const h = {'Authorization':`Bearer ${token}`,'Content-Type':'application/json'};
    fetch('/api/admin/stats',{headers:h}).then(r=>r.json()).then(setStats).catch(console.error);
    fetch('/api/admin/bookings?limit=6',{headers:h}).then(r=>r.json()).then(d=>setRecent(d.bookings||[])).catch(console.error);
  },[]);

  const statCards = stats ? [
    { label:'Всего броней', value:stats.total_bookings, icon:'📋', color:'#a855f7' },
    { label:'Сегодня', value:stats.today_bookings, icon:'📅', color:'#f59e0b' },
    { label:'Подтверждено', value:stats.confirmed_bookings, icon:'✅', color:'#10b981' },
    { label:'Игр сыграно', value:stats.total_games, icon:'🏁', color:'#8b5cf6' },
    { label:'Выручка (сом.)', value:stats.total_revenue.toLocaleString(), icon:'💰', color:'#06b6d4' },
  ] : [];

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Дашборд</h1>
        <p className="text-sm mt-1" style={{color:'#4b5563'}}>Taj Paintball — Панель управления</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {statCards.map(c=>(
          <div key={c.label} className="card p-4">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="text-2xl font-black" style={{color:c.color}}>{c.value}</div>
            <div className="text-xs mt-1" style={{color:'#4b5563'}}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          {href:'/admin/bookings',icon:'📋',label:'Все брони',desc:'Управление заявками'},
          {href:'/admin/bookings?status=awaiting_prepayment',icon:'💰',label:'Ждут оплату',desc:'Требуют действия'},
          {href:'/admin/history',icon:'🏁',label:'История игр',desc:'Архив'},
          {href:'/admin/pricing',icon:'🎯',label:'Тарифы',desc:'Цены и пакеты'},
        ].map(item=>(
          <Link key={item.href} href={item.href} className="card p-4 hover:border-blue-500/30 transition-all group block">
            <div className="text-3xl mb-2">{item.icon}</div>
            <div className="text-white font-bold text-sm group-hover:text-blue-400 transition-colors">{item.label}</div>
            <div className="text-xs mt-1" style={{color:'#4b5563'}}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent bookings as cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">Последние заявки</h2>
          <Link href="/admin/bookings" className="text-sm font-medium transition-colors" style={{color:'#c084fc'}}>Все →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recent.map(b=>(
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="card p-4 hover:border-blue-500/30 transition-all block group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-black font-mono" style={{color:'#c084fc'}}>{b.booking_number}</span>
                  <h3 className="text-white font-bold text-sm mt-0.5 group-hover:text-blue-400 transition-colors">{b.customer_name}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:`${STATUS_COLOR[b.booking_status]}20`,color:STATUS_COLOR[b.booking_status]||'#94a3b8'}}>
                  {STATUS_LABEL[b.booking_status]||b.booking_status}
                </span>
              </div>
              <div className="space-y-1 text-xs" style={{color:'#64748b'}}>
                <div className="flex items-center gap-1.5">📅 <span>{new Date(b.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в {String(b.game_time).substring(0,5)}</span></div>
                <div className="flex items-center gap-1.5">👥 <span>{b.players_count} чел. · 🎯 {b.balls_count} шаров</span></div>
                <div className="flex items-center gap-1.5">💰 <span className="font-bold text-white">{b.total_price} сом.</span></div>
              </div>
            </Link>
          ))}
          {recent.length===0&&<div className="card p-8 text-center col-span-3" style={{color:'#374151'}}>Нет заявок</div>}
        </div>
      </div>
    </div>
  );
}
