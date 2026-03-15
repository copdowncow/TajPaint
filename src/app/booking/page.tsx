'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Slot { id: string; slot_time: string; is_available: boolean; }
interface UserData { full_name?: string; phone?: string; bonus_balls: number; level_emoji: string; level_name: string; }

const DEFAULT_SLOTS = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00']
  .map((t, i) => ({ id: `d${i}`, slot_time: t, is_available: true }));
const BALLS_OPTS = [100, 200, 300, 500];
const PG = 'linear-gradient(135deg,#7c3aed,#a855f7)';
const PS = '0 4px 16px rgba(168,85,247,0.35)';

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [success, setSuccess] = useState<{ booking_number: string; total_price: number; prepayment_amount: number; booking_id: string; bonus_balls_used: number; discount: number } | null>(null);
  const [receiptSent, setReceiptSent] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    game_date: '', game_time: '',
    customer_name: '', customer_phone: '',
    players_count: 4, balls_per_player: 200,
    customer_comment: '', agree_terms: false,
    bonus_balls_to_use: 0,
  });

  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  const totalBalls = form.players_count * form.balls_per_player;
  const bonusToUse = Math.min(form.bonus_balls_to_use, user?.bonus_balls || 0, totalBalls);
  const paidBalls = totalBalls - bonusToUse;
  const totalPrice = (paidBalls / 100) * 70;

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  // Load logged-in user
  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const saved = localStorage.getItem('user_data');
    if (token && saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        if (u.full_name) set('customer_name', u.full_name);
        if (u.phone) set('customer_phone', u.phone);
      } catch {}
    }
  }, []);

  const loadSlots = useCallback(async (date: string) => {
    setSlotsLoading(true); setSlots([]);
    try {
      const r = await fetch(`/api/slots?date=${date}`, { cache: 'no-store' });
      const d = await r.json();
      setSlots(Array.isArray(d) && d.length > 0 ? d : DEFAULT_SLOTS);
    } catch { setSlots(DEFAULT_SLOTS); }
    finally { setSlotsLoading(false); }
  }, []);

  useEffect(() => {
    if (form.game_date) { set('game_time', ''); loadSlots(form.game_date); }
  }, [form.game_date, loadSlots]);

  const handleSubmit = async () => {
    setError('');
    if (!form.agree_terms) { setError('Необходимо согласие с условиями'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('user_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/bookings', {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, balls_count: totalBalls, bonus_balls_to_use: bonusToUse }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка'); return; }
      setSuccess(data);
    } catch { setError('Ошибка соединения'); }
    finally { setSubmitting(false); }
  };

  const handleReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !success) return;
    if (file.size > 5 * 1024 * 1024) { setError('Файл слишком большой. Максимум 5MB'); return; }
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('booking_number', success.booking_number);
      fd.append('booking_id', success.booking_id); fd.append('customer_name', form.customer_name);
      fd.append('customer_phone', form.customer_phone);
      const res = await fetch('/api/receipt', { method: 'POST', body: fd });
      if (res.ok) setReceiptSent(true);
      else { const d = await res.json(); setError(d.error || 'Ошибка'); }
    } catch { setError('Ошибка отправки'); }
    finally { setUploading(false); }
  };

  // SUCCESS
  if (success) return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#07050f' }}>
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div style={{ width: 72, height: 72, background: PG, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>🎯</div>
          <h1 className="text-2xl font-black text-white mb-1">Заявка принята!</h1>
          <p className="font-black text-lg gradient-text">{success.booking_number}</p>
        </div>

        <div className="card p-5 mb-4 space-y-4">
          {[
            { done: true, n: 1, label: 'Заявка создана', sub: `${new Date(form.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в ${form.game_time}` },
            { done: receiptSent, n: 2, label: 'Внесите предоплату', sub: receiptSent ? 'Чек отправлен' : `${success.prepayment_amount} сомони`, yellow: !receiptSent },
            { done: false, n: 3, label: 'Бронь подтверждена', sub: 'После получения предоплаты', grey: true },
          ].map(item => (
            <div key={item.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: item.done ? '#16a34a' : item.yellow ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)', color: item.done ? 'white' : item.yellow ? '#fbbf24' : '#4b5563' }}>
                {item.done ? '✓' : item.n}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-xs font-medium" style={{ color: item.done ? '#4ade80' : item.yellow ? '#fbbf24' : '#4b5563' }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {!receiptSent && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-sm font-bold mb-2" style={{ color: '#d8b4fe' }}>💰 Как оплатить {success.prepayment_amount} сомони:</p>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Переведите на <strong className="text-white">+992 20 840 00 00</strong><br/>
              через <span style={{ color: '#c084fc' }}>Алиф</span> или <span style={{ color: '#c084fc' }}>Dushanbe City (DC)</span>.<br/>
              Прикрепите скриншот чека.
            </p>
          </div>
        )}

        {success.bonus_balls_used > 0 && (
          <div className="rounded-2xl p-3 mb-4 flex items-center gap-2" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <span>🎁</span>
            <p className="text-sm" style={{ color: '#c084fc' }}>Использовано {success.bonus_balls_used} бонусных шаров</p>
          </div>
        )}

        {!receiptSent ? (
          <label className="flex flex-col items-center justify-center w-full rounded-2xl p-6 cursor-pointer mb-4"
            style={{ border: `2px dashed ${uploading ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)'}`, background: 'rgba(255,255,255,0.02)', WebkitTapHighlightColor: 'transparent' }}>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleReceipt} disabled={uploading}/>
            {uploading ? <><div className="text-3xl mb-2 animate-pulse">⏳</div><p className="text-sm font-medium" style={{ color: '#c084fc' }}>Отправка...</p></>
              : <><div className="text-3xl mb-2">📎</div><p className="text-white text-sm font-bold">Прикрепить чек</p><p className="text-xs mt-1" style={{ color: '#4b5563' }}>Фото или скриншот · до 5MB</p></>}
          </label>
        ) : (
          <div className="rounded-2xl p-4 mb-4 text-center" style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)' }}>
            <div className="text-3xl mb-2">✅</div>
            <p className="font-bold text-sm" style={{ color: '#4ade80' }}>Чек отправлен!</p>
          </div>
        )}
        {error && <p className="text-sm text-center mb-3" style={{ color: '#f87171' }}>{error}</p>}

        <div className="card p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between"><span style={{ color: '#64748b' }}>Шаров:</span><span className="text-white">{totalBalls} шт.</span></div>
          {bonusToUse > 0 && <div className="flex justify-between"><span style={{ color: '#a855f7' }}>Бонусом:</span><span style={{ color: '#a855f7' }}>-{bonusToUse} шт.</span></div>}
          <div className="flex justify-between"><span style={{ color: '#64748b' }}>Итого:</span><span className="font-black text-lg gradient-text">{success.total_price} сом.</span></div>
          <div className="flex justify-between"><span style={{ color: '#64748b' }}>Предоплата:</span><span className="font-bold text-white">{success.prepayment_amount} сом.</span></div>
        </div>

        <a href="tel:+992502131415" className="flex items-center justify-center gap-2 w-full font-bold py-4 rounded-2xl text-base mb-3"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: 'white', WebkitTapHighlightColor: 'transparent' }}>📞 Позвонить администратору</a>
        <Link href="/" className="btn-secondary w-full py-3 block text-center text-sm">← На главную</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#07050f' }}>
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(7,5,15,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" className="p-1 text-xl" style={{ color: '#64748b', WebkitTapHighlightColor: 'transparent' }}>←</Link>
        <div className="flex-1">
          <h1 className="text-base font-black text-white">Бронирование</h1>
          <div className="flex gap-1 mt-1">
            {[1,2,3].map(i => <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i<=step ? PG : 'rgba(255,255,255,0.08)' }}/>)}
          </div>
        </div>
        <span className="text-sm font-medium" style={{ color: '#4b5563' }}>{step}/3</span>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto">

        {/* STEP 1 — Дата и время */}
        {step === 1 && (
          <div className="space-y-6">
            <div><h2 className="text-xl font-black text-white mb-1">Дата и время</h2><p className="text-sm" style={{ color: '#4b5563' }}>Выберите удобное время</p></div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Дата игры *</label>
              <input type="date" min={minDate} max={maxDate} value={form.game_date}
                onChange={e => set('game_date', e.target.value)} className="input-field" style={{ colorScheme: 'dark' }}/>
              {form.game_date && <p className="text-sm mt-2 font-medium gradient-text">📅 {new Date(form.game_date+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</p>}
            </div>
            {form.game_date && (
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Время *</label>
                {slotsLoading
                  ? <div className="grid grid-cols-4 gap-2">{[...Array(8)].map((_,i)=><div key={i} className="h-12 rounded-xl animate-pulse" style={{background:'rgba(255,255,255,0.04)'}}/>)}</div>
                  : <div className="grid grid-cols-4 gap-2">{slots.map(s=>{
                    const t=String(s.slot_time).substring(0,5);
                    const sel=form.game_time===t;
                    const busy=!s.is_available;
                    return <button key={s.id} disabled={busy} onClick={()=>!busy&&set('game_time',t)}
                      style={{padding:'12px 0',borderRadius:12,fontSize:14,fontWeight:'bold',cursor:busy?'not-allowed':'pointer',WebkitTapHighlightColor:'transparent',...(busy?{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',color:'#1f2937',textDecoration:'line-through'}:sel?{background:PG,color:'white',boxShadow:PS,border:'none'}:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8'})}}>
                      {t}</button>;
                  })}</div>
                }
                {form.game_time && <p className="text-sm mt-2 font-medium" style={{color:'#4ade80'}}>✓ Выбрано: {form.game_time}</p>}
              </div>
            )}
            {error && <div className="rounded-xl px-4 py-3 text-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}}>{error}</div>}
            <button onClick={()=>{if(!form.game_date){setError('Выберите дату');return;}if(!form.game_time){setError('Выберите время');return;}setError('');setStep(2);}} className="btn-primary w-full py-4 text-base">Далее →</button>
          </div>
        )}

        {/* STEP 2 — Игроки и шары */}
        {step === 2 && (
          <div className="space-y-5">
            <div><h2 className="text-xl font-black text-white mb-1">Игроки и шары</h2><p className="text-sm" style={{color:'#4b5563'}}>Выберите состав и количество шаров</p></div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold" style={{color:'#94a3b8'}}>👥 Количество игроков</label>
                <span className="text-2xl font-black gradient-text">{form.players_count}</span>
              </div>
              <div className="flex items-center gap-4 rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <button onClick={()=>set('players_count',Math.max(1,form.players_count-1))} style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white',fontSize:22,fontWeight:'bold',cursor:'pointer',WebkitTapHighlightColor:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
                <div className="flex-1 text-center"><div className="text-4xl font-black gradient-text">{form.players_count}</div><div className="text-xs" style={{color:'#4b5563'}}>человек</div></div>
                <button onClick={()=>set('players_count',Math.min(15,form.players_count+1))} style={{width:44,height:44,borderRadius:12,background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc',fontSize:22,fontWeight:'bold',cursor:'pointer',WebkitTapHighlightColor:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
              </div>
              <input type="range" min={1} max={15} value={form.players_count} onChange={e=>set('players_count',+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-3"
                style={{background:`linear-gradient(to right,#a855f7 ${((form.players_count-1)/14)*100}%,rgba(255,255,255,0.1) ${((form.players_count-1)/14)*100}%)`}}/>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3" style={{color:'#94a3b8'}}>🎯 Шаров на каждого игрока</label>
              <div className="grid grid-cols-4 gap-2">
                {BALLS_OPTS.map(n=>(
                  <button key={n} onClick={()=>set('balls_per_player',n)}
                    style={{padding:'12px 0',borderRadius:12,fontSize:14,fontWeight:'bold',cursor:'pointer',WebkitTapHighlightColor:'transparent',...(form.balls_per_player===n?{background:PG,color:'white',boxShadow:PS,border:'none'}:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8'})}}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount badge */}
            {user && (() => { try { const d = JSON.parse(localStorage.getItem('user_data')||'{}'); return d.total_balls >= 20000; } catch { return false; } })() && (
              <div className="rounded-xl p-3 flex items-center gap-2" style={{background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.3)'}}>
                <span>💎</span>
                <p className="text-sm font-bold" style={{color:'#c084fc'}}>Скидка 15% применена — уровень Элита!</p>
              </div>
            )}
            {/* Bonus balls selector */}
            {user && user.bonus_balls > 0 && (
              <div className="rounded-2xl p-4" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(168,85,247,0.06))',border:'1px solid rgba(168,85,247,0.2)'}}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white text-sm font-bold">🎁 Бонусные шары</p>
                    <p className="text-xs" style={{color:'#94a3b8'}}>Доступно: {user.bonus_balls} шаров</p>
                  </div>
                  <span className="text-xl font-black gradient-text">{bonusToUse}</span>
                </div>
                <input type="range" min={0} max={Math.min(user.bonus_balls, totalBalls)} value={bonusToUse}
                  onChange={e=>set('bonus_balls_to_use',+e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{background:`linear-gradient(to right,#a855f7 ${(bonusToUse/Math.min(user.bonus_balls,totalBalls))*100}%,rgba(255,255,255,0.1) ${(bonusToUse/Math.min(user.bonus_balls,totalBalls))*100}%)`}}/>
                <div className="flex justify-between text-xs mt-1" style={{color:'#374151'}}><span>0</span><span>{Math.min(user.bonus_balls,totalBalls)}</span></div>
                {bonusToUse > 0 && <p className="text-xs mt-2" style={{color:'#a855f7'}}>💰 Экономия: {Math.round((bonusToUse/100)*70)} сомони</p>}
              </div>
            )}

            <div className="rounded-2xl p-5" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))',border:'1px solid rgba(168,85,247,0.2)'}}>
              <div className="flex justify-between text-sm mb-2"><span style={{color:'#94a3b8'}}>Всего шаров:</span><span className="text-white font-semibold">{totalBalls} шт.</span></div>
              {bonusToUse > 0 && <div className="flex justify-between text-sm mb-2"><span style={{color:'#a855f7'}}>Бонусных:</span><span style={{color:'#a855f7'}}>−{bonusToUse} шт.</span></div>}
              <div style={{height:1,background:'rgba(255,255,255,0.08)',marginBottom:12}}/>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Итого:</span>
                <div className="text-right">
                  <span className="text-3xl font-black gradient-text">{totalPrice} </span>
                  <span className="text-white font-bold">сом.</span>
                </div>
              </div>
            </div>

            {error && <div className="rounded-xl px-4 py-3 text-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>{setError('');setStep(1);}} className="btn-secondary py-4 text-sm">← Назад</button>
              <button onClick={()=>{setError('');setStep(3);}} className="btn-primary py-4 text-sm">Далее →</button>
            </div>
          </div>
        )}

        {/* STEP 3 — Данные */}
        {step === 3 && (
          <div className="space-y-4">
            <div><h2 className="text-xl font-black text-white mb-1">Ваши данные</h2><p className="text-sm" style={{color:'#4b5563'}}>Контакты для подтверждения</p></div>

            {user && (
              <div className="rounded-xl p-3 flex items-center gap-2" style={{background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.2)'}}>
                <span>{user.level_emoji}</span>
                <p className="text-xs" style={{color:'#c084fc'}}>Вы авторизованы · {user.level_name}</p>
                <Link href="/profile" className="text-xs ml-auto" style={{color:'#7c3aed'}}>Профиль →</Link>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'#94a3b8'}}>Имя *</label>
              <input type="text" placeholder="Али Рахимов" value={form.customer_name}
                onChange={e=>set('customer_name',e.target.value)} className="input-field" autoComplete="name" autoCapitalize="words"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'#94a3b8'}}>Телефон *</label>
              <input type="tel" placeholder="+992 50 213 14 15" value={form.customer_phone}
                onChange={e=>set('customer_phone',e.target.value)} className="input-field" autoComplete="tel" inputMode="tel"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'#94a3b8'}}>Комментарий</label>
              <textarea placeholder="День рождения, пожелания..." value={form.customer_comment}
                onChange={e=>set('customer_comment',e.target.value)} className="input-field resize-none" rows={2}/>
            </div>

            <div className="card p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span style={{color:'#94a3b8'}}>📅 Дата:</span><span className="text-white">{new Date(form.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в {form.game_time}</span></div>
              <div className="flex justify-between"><span style={{color:'#94a3b8'}}>👥 Игроков:</span><span className="text-white">{form.players_count} чел.</span></div>
              <div className="flex justify-between"><span style={{color:'#94a3b8'}}>🎯 Шаров:</span><span className="text-white">{totalBalls} шт.</span></div>
              {bonusToUse > 0 && <div className="flex justify-between"><span style={{color:'#a855f7'}}>🎁 Бонусом:</span><span style={{color:'#a855f7'}}>−{bonusToUse} шт.</span></div>}
              <div style={{height:1,background:'rgba(255,255,255,0.06)'}}/>
              <div className="flex justify-between items-center">
                <span style={{color:'#94a3b8'}}>Итого:</span>
                <span className="font-black text-xl gradient-text">{totalPrice} сом.</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{color:'#94a3b8'}}>Предоплата:</span>
                <span className="font-bold" style={{color:'#c084fc'}}>50 сомони</span>
              </div>
            </div>

            {!user && (
              <div className="rounded-xl p-3 text-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <p className="text-xs" style={{color:'#4b5563'}}>
                  <Link href="/login?redirect=/booking" style={{color:'#c084fc'}}>Войдите</Link> или <Link href="/register" style={{color:'#c084fc'}}>зарегистрируйтесь</Link> чтобы использовать бонусные шары
                </p>
              </div>
            )}

            <label className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer"
              style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',WebkitTapHighlightColor:'transparent'}}>
              <input type="checkbox" checked={form.agree_terms} onChange={e=>set('agree_terms',e.target.checked)}
                className="mt-0.5 w-5 h-5 flex-shrink-0" style={{accentColor:'#a855f7'}}/>
              <span className="text-sm leading-relaxed" style={{color:'#94a3b8'}}>Согласен с условиями и обязуюсь внести предоплату 50 сомони</span>
            </label>

            {error && <div className="rounded-xl px-4 py-3 text-sm" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}}>{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>{setError('');setStep(2);}} className="btn-secondary py-4 text-sm">← Назад</button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary py-4 text-sm">
                {submitting?'⏳ Отправка...':'✅ Отправить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
