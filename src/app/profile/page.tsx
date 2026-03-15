'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Level { key:string; name:string; emoji:string; minXP:number; color:string; discount:number; perks:string[]; progress?:number; nextLevel?:{name:string;minXP:number;emoji:string}|null; }
interface Achievement { id:string; emoji:string; title:string; desc:string; unlocked:boolean; }
interface Transaction { id:string; amount:number; type:string; description:string; created_at:string; expires_at?:string; }
interface MonthStat { month:string; balls:number; }
interface Notification { id:string; type:string; title:string; body?:string; is_read:boolean; created_at:string; }
interface Referral { id:string; status:string; created_at:string; referred?:{full_name?:string;email:string}; }
interface Booking { id:string; booking_number:string; game_date:string; game_time:string; players_count:number; balls_count:number; total_price:number; booking_status:string; bonus_balls_used:number; }

interface Profile {
  id:string; email:string; phone?:string; full_name?:string; birth_date?:string; avatar_emoji:string;
  bonus_balls:number; total_balls:number; total_games:number; total_spent:number; xp:number; streak_days:number;
  level:Level; all_levels:Level[]; achievements:Achievement[]; monthly_stats:MonthStat[];
  favorite_hour:number; avg_balls:number; referral_code:string; referrals:Referral[];
  activated_referrals:number; birthday_in:number|null; notifications:Notification[];
  unread_notifications:number; transactions:Transaction[]; created_at:string;
}

const STATUS_LABEL:Record<string,string> = { new:'🆕 Новая', awaiting_prepayment:'💰 Ждёт оплату', prepayment_review:'🔍 Проверка', confirmed:'✅ Подтверждена', cancelled:'❌ Отменена', completed:'🏁 Завершена', no_show:'🚫 Не пришёл' };
const STATUS_COLOR:Record<string,string> = { new:'#3b82f6', awaiting_prepayment:'#f59e0b', prepayment_review:'#8b5cf6', confirmed:'#10b981', cancelled:'#ef4444', completed:'#6b7280', no_show:'#dc2626' };
const EMOJIS = ['🎯','🔥','⚡','💪','🦁','🐯','🦅','🎮','🏆','👊'];
const PG = 'linear-gradient(135deg,#7c3aed,#a855f7)';
const MO = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile|null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<'overview'|'bookings'|'bonus'|'stats'|'referral'|'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({full_name:'',birth_date:'',phone:'',avatar_emoji:'🎯'});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [welcome, setWelcome] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const getToken = () => typeof window!=='undefined' ? localStorage.getItem('user_token')||'' : '';

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login?redirect=/profile'); return; }
    try {
      const h = {Authorization:`Bearer ${token}`};
      const [pr,br] = await Promise.all([fetch('/api/user/profile',{headers:h}), fetch('/api/user/bookings',{headers:h})]);
      if (!pr.ok) { router.push('/login?redirect=/profile'); return; }
      const [p,b] = await Promise.all([pr.json(), br.json()]);
      setProfile(p); setBookings(Array.isArray(b)?b:[]);
      setEditForm({full_name:p.full_name||'',birth_date:p.birth_date||'',phone:p.phone||'',avatar_emoji:p.avatar_emoji||'🎯'});
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome')==='1') setWelcome(true);
    load();
  }, [load]);

  const save = async () => {
    setSaving(true); setSaveMsg('');
    const res = await fetch('/api/user/profile',{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:`Bearer ${getToken()}`},body:JSON.stringify(editForm)});
    if (res.ok) { setSaveMsg('✅ Сохранено!'); load(); setTimeout(()=>setSaveMsg(''),2000); }
    setSaving(false);
  };

  const markRead = async () => {
    await fetch('/api/user/notifications',{method:'PATCH',headers:{Authorization:`Bearer ${getToken()}`}});
    load();
  };

  const logout = () => { localStorage.removeItem('user_token'); localStorage.removeItem('user_data'); router.push('/'); };

  const copyRef = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`Присоединяйся к Taj Paintball! Реферальный код: ${profile.referral_code}`).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{background:'#07050f'}}><div className="text-5xl animate-pulse">🎯</div></div>;
  if (!profile) return null;

  const { level } = profile;
  const activeBk = bookings.filter(b=>['new','awaiting_prepayment','prepayment_review','confirmed'].includes(b.booking_status));
  const maxB = Math.max(...profile.monthly_stats.map(s=>s.balls),1);
  const unlocked = profile.achievements.filter(a=>a.unlocked).length;

  const TABS = [['overview','📊'],['bookings','📋'],['bonus','🎁'],['stats','📈'],['referral','👥'],['settings','⚙️']] as const;

  return (
    <div className="min-h-screen pb-28" style={{background:'#07050f'}}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between" style={{background:'rgba(7,5,15,0.95)',backdropFilter:'blur(16px)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <Link href="/" style={{color:'#64748b'}}>←</Link>
        <span className="text-base font-black text-white">Мой профиль</span>
        <div className="flex items-center gap-3">
          {/* Notifications bell */}
          <button onClick={()=>{setShowNotifs(!showNotifs);if(!showNotifs&&profile.unread_notifications>0)markRead();}} style={{position:'relative',WebkitTapHighlightColor:'transparent'}}>
            <span style={{fontSize:20}}>🔔</span>
            {profile.unread_notifications>0 && <span style={{position:'absolute',top:-4,right:-4,background:'#ef4444',color:'white',borderRadius:'50%',width:16,height:16,fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold'}}>{profile.unread_notifications}</span>}
          </button>
          <button onClick={logout} style={{color:'#4b5563',fontSize:12,WebkitTapHighlightColor:'transparent'}}>Выйти</button>
        </div>
      </div>

      {/* Notifications dropdown */}
      {showNotifs && (
        <div className="mx-4 mt-2 card p-3 space-y-2 max-h-64 overflow-y-auto" style={{zIndex:30,position:'relative'}}>
          {profile.notifications.length===0 ? <p className="text-xs text-center py-2" style={{color:'#374151'}}>Нет уведомлений</p>
            : profile.notifications.map(n=>(
            <div key={n.id} className="flex gap-2 py-1.5" style={{borderBottom:'1px solid rgba(255,255,255,0.04)',opacity:n.is_read?0.5:1}}>
              <div className="flex-1">
                <p className="text-xs font-bold text-white">{n.title}</p>
                {n.body&&<p className="text-xs" style={{color:'#4b5563'}}>{n.body}</p>}
              </div>
              {!n.is_read&&<div style={{width:6,height:6,background:'#a855f7',borderRadius:'50%',flexShrink:0,marginTop:4}}/>}
            </div>
          ))}
        </div>
      )}

      <div className="px-4 max-w-lg mx-auto">
        {welcome&&(
          <div className="mt-4 rounded-2xl p-4 flex items-center gap-3" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(168,85,247,0.15))',border:'1px solid rgba(168,85,247,0.3)'}}>
            <div className="text-3xl">🎁</div>
            <div className="flex-1"><p className="text-white font-bold text-sm">Добро пожаловать!</p><p className="text-sm" style={{color:'#c084fc'}}>+50 бонусных шаров зачислено на счёт</p></div>
            <button onClick={()=>setWelcome(false)} style={{color:'#4b5563'}}>✕</button>
          </div>
        )}

        {/* Birthday */}
        {profile.birthday_in!==null&&profile.birthday_in<=3&&(
          <div className="mt-4 rounded-2xl p-4 flex items-center gap-3" style={{background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.3)'}}>
            <div className="text-3xl">🎂</div>
            <div><p className="text-white font-bold text-sm">{profile.birthday_in===0?'Сегодня ваш ДР! 🎉':`ДР через ${profile.birthday_in} дн.!`}</p><p className="text-xs" style={{color:'#fbbf24'}}>Сыграйте в ДР — получите +100 бонусных шаров!</p></div>
          </div>
        )}

        {/* Profile card */}
        <div className="mt-4 rounded-2xl p-5" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))',border:'1px solid rgba(168,85,247,0.25)'}}>
          <div className="flex items-start gap-4 mb-4">
            <div style={{width:64,height:64,background:'rgba(168,85,247,0.2)',borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,border:'2px solid rgba(168,85,247,0.35)',flexShrink:0}}>{profile.avatar_emoji}</div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-black text-lg truncate">{profile.full_name||'Игрок'}</h2>
              <p className="text-xs truncate" style={{color:'#94a3b8'}}>{profile.email}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-black" style={{color:level.color}}>{level.emoji} {level.name}</span>
                {level.discount>0&&<span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(168,85,247,0.2)',color:'#c084fc'}}>−{level.discount}%</span>}
                {profile.streak_days>=3&&<span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{background:'rgba(239,68,68,0.15)',color:'#f87171'}}>🔥 {profile.streak_days} дней</span>}
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:'rgba(168,85,247,0.15)',color:'#c084fc'}}>{unlocked}/{profile.achievements.length} 🏅</span>
          </div>

          {/* XP Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1" style={{color:'#94a3b8'}}>
              <span>XP: {profile.xp.toLocaleString()}</span>
              {level.nextLevel?<span>до {level.nextLevel.emoji} {level.nextLevel.name}: {(level.nextLevel.minXP-profile.xp).toLocaleString()} XP</span>:<span>🏆 MAX</span>}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.08)'}}>
              <div className="h-full rounded-full transition-all duration-500" style={{width:`${level.progress||0}%`,background:PG}}/>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[['🎯','Шаров',profile.total_balls.toLocaleString()],['🎮','Игр',profile.total_games],['🎁','Бонусов',profile.bonus_balls],['💰','Потрачено',`${profile.total_spent}`]].map(([i,l,v])=>(
              <div key={String(l)} className="text-center py-2 rounded-xl" style={{background:'rgba(255,255,255,0.05)'}}>
                <div className="text-sm font-black gradient-text">{v}</div>
                <div className="text-xs mt-0.5" style={{color:'#4b5563'}}>{i}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 rounded-xl overflow-x-auto" style={{background:'rgba(255,255,255,0.04)'}}>
          {TABS.map(([t,icon])=>(
            <button key={t} onClick={()=>setTab(t)} className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all"
              style={{background:tab===t?PG:'transparent',color:tab===t?'white':'#4b5563',WebkitTapHighlightColor:'transparent'}}>
              {icon}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div className="mt-4 space-y-3">
            {/* Level road */}
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-4">🗺️ Путь игрока</p>
              <div className="flex items-center">
                {profile.all_levels.map((lvl,i)=>{
                  const done=profile.xp>=lvl.minXP; const curr=profile.level.key===lvl.key;
                  return(
                    <div key={lvl.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all"
                          style={{background:done?PG:'rgba(255,255,255,0.05)',borderColor:curr?'#a855f7':done?'#7c3aed':'rgba(255,255,255,0.1)',boxShadow:curr?'0 0 16px rgba(168,85,247,0.5)':'none'}}>
                          {lvl.emoji}
                        </div>
                        <p className="text-xs mt-1 text-center" style={{color:done?'#c084fc':'#374151'}}>{lvl.name}</p>
                        <p className="text-xs" style={{color:'#374151'}}>{lvl.minXP>=1000?`${lvl.minXP/1000}к`:lvl.minXP}</p>
                      </div>
                      {i<profile.all_levels.length-1&&<div className="h-0.5 flex-1 mx-1 rounded" style={{background:profile.xp>=profile.all_levels[i+1].minXP?PG:'rgba(255,255,255,0.08)'}}/>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Achievements preview */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3"><p className="text-sm font-bold text-white">🏅 Достижения</p><span className="text-xs" style={{color:'#c084fc'}}>{unlocked}/{profile.achievements.length}</span></div>
              <div className="grid grid-cols-5 gap-2">
                {profile.achievements.map(a=>(
                  <div key={a.id} className="flex flex-col items-center p-2 rounded-xl" style={{background:a.unlocked?'rgba(168,85,247,0.1)':'rgba(255,255,255,0.03)',border:`1px solid ${a.unlocked?'rgba(168,85,247,0.3)':'rgba(255,255,255,0.06)'}`,opacity:a.unlocked?1:0.35}}>
                    <div className="text-xl">{a.emoji}</div>
                    <p className="text-xs text-center mt-0.5 leading-tight" style={{color:a.unlocked?'#c084fc':'#374151',fontSize:9}}>{a.title}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-3 text-center"><div className="text-xl mb-1">⏰</div><p className="text-white font-black">{profile.favorite_hour}:00</p><p className="text-xs" style={{color:'#4b5563'}}>Любимое время</p></div>
              <div className="card p-3 text-center"><div className="text-xl mb-1">📊</div><p className="text-white font-black">{profile.avg_balls}</p><p className="text-xs" style={{color:'#4b5563'}}>Ср. шаров/игра</p></div>
              <div className="card p-3 text-center"><div className="text-xl mb-1">🔥</div><p className="text-white font-black">{profile.streak_days}</p><p className="text-xs" style={{color:'#4b5563'}}>Серия дней</p></div>
            </div>

            {activeBk.length>0&&(
              <div className="card p-4">
                <p className="text-sm font-bold text-white mb-3">📋 Активные брони</p>
                {activeBk.slice(0,2).map(b=>(
                  <div key={b.id} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <div><p className="text-white text-sm font-semibold">{b.booking_number}</p><p className="text-xs" style={{color:'#4b5563'}}>{new Date(b.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в {String(b.game_time).substring(0,5)}</p></div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:`${STATUS_COLOR[b.booking_status]}18`,color:STATUS_COLOR[b.booking_status]}}>{STATUS_LABEL[b.booking_status]}</span>
                  </div>
                ))}
                <button onClick={()=>setTab('bookings')} className="text-xs font-semibold mt-2" style={{color:'#c084fc'}}>Все брони →</button>
              </div>
            )}
            <Link href="/booking" className="btn-primary w-full py-4 block text-center text-base">🎯 Забронировать игру</Link>
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {tab==='bookings'&&(
          <div className="mt-4 space-y-3">
            {bookings.length===0?(
              <div className="card p-10 text-center"><div className="text-5xl mb-3">🎮</div><p className="text-white font-bold mb-1">Ещё нет броней</p><Link href="/booking" className="btn-primary py-3 px-6 text-sm mt-3 inline-block">Забронировать →</Link></div>
            ):bookings.map(b=>(
              <div key={b.id} className="card p-4">
                <div className="flex justify-between items-start mb-2">
                  <div><p className="text-white font-bold text-sm">{b.booking_number}</p><p className="text-xs" style={{color:'#4b5563'}}>{new Date(b.game_date+'T12:00:00').toLocaleDateString('ru-RU')} в {String(b.game_time).substring(0,5)}</p></div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{background:`${STATUS_COLOR[b.booking_status]}18`,color:STATUS_COLOR[b.booking_status]}}>{STATUS_LABEL[b.booking_status]}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs" style={{color:'#64748b'}}>
                  <span>👥 {b.players_count}</span><span>🎯 {b.balls_count} шт.</span>
                  {b.bonus_balls_used>0&&<span style={{color:'#a855f7'}}>🎁 -{b.bonus_balls_used}</span>}
                  <span className="ml-auto font-black text-white">{b.total_price} сом.</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── BONUS ── */}
        {tab==='bonus'&&(
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl p-6 text-center" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))',border:'1px solid rgba(168,85,247,0.3)'}}>
              <div className="text-6xl font-black gradient-text mb-1">{profile.bonus_balls}</div>
              <p className="text-white font-bold text-lg">бонусных шаров</p>
              {level.discount>0&&<p className="text-sm mt-1" style={{color:'#c084fc'}}>+ скидка {level.discount}% на все заказы</p>}
            </div>
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-3">💡 Как получить бонусы</p>
              {[['🎁','Регистрация','+50 шаров'],['🛒','Заказ 1000+ шаров','+200 шаров до конца месяца'],['🎂','Игра в день рождения','+100 шаров'],['👥','Реферал сыграл первую игру','+50-100 шаров + XP'],['🔥','Серия 3+ дней','+30 шаров каждые 3 дня'],['💎','Уровень Элита (20000 XP)','Скидка 15% + 200 шаров/мес']].map(([i,l,v])=>(
                <div key={l} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <div className="flex items-center gap-2"><span>{i}</span><span className="text-sm" style={{color:'#94a3b8'}}>{l}</span></div>
                  <span className="text-xs font-bold" style={{color:'#c084fc'}}>{v}</span>
                </div>
              ))}
            </div>
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-3">📜 История</p>
              {profile.transactions.length===0?<p className="text-xs text-center py-2" style={{color:'#374151'}}>Нет транзакций</p>
                :profile.transactions.map(t=>(
                <div key={t.id} className="flex items-start justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div className="flex-1 min-w-0 mr-3"><p className="text-xs text-white truncate">{t.description}</p><p className="text-xs" style={{color:'#374151'}}>{new Date(t.created_at).toLocaleDateString('ru-RU')}{t.expires_at&&` · до ${new Date(t.expires_at).toLocaleDateString('ru-RU')}`}</p></div>
                  <span className="text-sm font-black flex-shrink-0" style={{color:t.amount>0?'#4ade80':'#f87171'}}>{t.amount>0?`+${t.amount}`:t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        {tab==='stats'&&(
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['🎯','Шаров всего',profile.total_balls.toLocaleString()],['🎮','Игр',profile.total_games],['📊','Ср. шаров/игра',profile.avg_balls],['💰','Потрачено',`${profile.total_spent} сом.`],['⏰','Любимое время',`${profile.favorite_hour}:00`],['🔥','Серия',`${profile.streak_days} дн.`]].map(([i,l,v])=>(
                <div key={String(l)} className="card p-4"><div className="text-2xl mb-1">{i}</div><div className="text-xl font-black gradient-text">{v}</div><div className="text-xs mt-0.5" style={{color:'#4b5563'}}>{l}</div></div>
              ))}
            </div>
            {/* Chart */}
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-4">📈 Активность (шары по месяцам)</p>
              <div className="flex items-end gap-2 h-28">
                {profile.monthly_stats.map(s=>{
                  const pct=maxB>0?(s.balls/maxB)*100:0;
                  return(
                    <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-xs" style={{color:'#4b5563',fontSize:9}}>{s.balls>0?s.balls:''}</p>
                      <div className="w-full rounded-t-lg" style={{height:`${Math.max(pct,s.balls>0?8:2)}%`,background:s.balls>0?PG:'rgba(255,255,255,0.06)',minHeight:4}}/>
                      <span className="text-xs" style={{color:'#374151'}}>{MO[parseInt(s.month.split('-')[1])-1]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Achievements */}
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-3">🏅 Достижения ({unlocked}/{profile.achievements.length})</p>
              {profile.achievements.map(a=>(
                <div key={a.id} className="flex items-center gap-3 py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.04)',opacity:a.unlocked?1:0.35}}>
                  <div className="text-2xl flex-shrink-0">{a.emoji}</div>
                  <div className="flex-1"><p className="text-sm font-bold" style={{color:a.unlocked?'white':'#374151'}}>{a.title}</p><p className="text-xs" style={{color:'#4b5563'}}>{a.desc}</p></div>
                  <span>{a.unlocked?'✅':'🔒'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REFERRAL ── */}
        {tab==='referral'&&(
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl p-5 text-center" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))',border:'1px solid rgba(168,85,247,0.3)'}}>
              <div className="text-4xl mb-2">👥</div>
              <h2 className="text-white font-black text-xl mb-1">Реферальная программа</h2>
              <p className="text-sm" style={{color:'#94a3b8'}}>Приглашай друзей — получай бонусы когда они сыграют!</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-2">Ваш реферальный код</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 rounded-xl px-4 py-3 font-mono text-lg font-black text-center" style={{background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc'}}>{profile.referral_code}</div>
                <button onClick={copyRef} className="btn-primary py-3 px-4 text-sm">{copied?'✓ Скопировано':'📋 Копировать'}</button>
              </div>
              <p className="text-xs" style={{color:'#4b5563'}}>Другу нужно зарегистрироваться по вашему коду. Бонус придёт <strong className="text-white">после его первой игры</strong>.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['👥','Приглашено',profile.referrals.length],['🎮','Сыграли',profile.activated_referrals],['🎁','Бонусов',`${profile.activated_referrals*50}+`]].map(([i,l,v])=>(
                <div key={String(l)} className="card p-3"><div className="text-xl mb-1">{i}</div><div className="text-lg font-black gradient-text">{v}</div><div className="text-xs" style={{color:'#4b5563'}}>{l}</div></div>
              ))}
            </div>
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-2">Что получает реферер:</p>
              {[['Уровень Новичок/Игрок','Реферал сыграл','+ 50 шаров + 200 XP'],['Уровень Про','Реферал сыграл','+ 100 шаров + 200 XP']].map(([lvl,ev,val])=>(
                <div key={lvl} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <div><p className="text-xs text-white">{lvl}</p><p className="text-xs" style={{color:'#4b5563'}}>{ev}</p></div>
                  <span className="text-xs font-bold" style={{color:'#c084fc'}}>{val}</span>
                </div>
              ))}
            </div>
            {profile.referrals.length>0&&(
              <div className="card p-4">
                <p className="text-sm font-bold text-white mb-3">Список приглашённых</p>
                {profile.referrals.map(r=>(
                  <div key={r.id} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <div><p className="text-white text-sm">{r.referred?.full_name||r.referred?.email||'—'}</p><p className="text-xs" style={{color:'#4b5563'}}>{new Date(r.created_at).toLocaleDateString('ru-RU')}</p></div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{background:r.status==='activated'?'rgba(22,163,74,0.15)':'rgba(245,158,11,0.15)',color:r.status==='activated'?'#4ade80':'#fbbf24'}}>
                      {r.status==='activated'?'✅ Сыграл':'⏳ Ждём игры'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab==='settings'&&(
          <div className="mt-4 space-y-3">
            <div className="card p-5">
              <p className="text-sm font-bold text-white mb-4">✏️ Редактировать профиль</p>
              <div className="space-y-3">
                {[['Имя','text','full_name','Ваше имя','name'],['Телефон','tel','phone','+992 XX XXX XXXX','tel']].map(([l,t,k,ph,ac])=>(
                  <div key={k}><label className="block text-xs font-semibold mb-1.5" style={{color:'#94a3b8'}}>{l}</label>
                  <input type={t} value={editForm[k as keyof typeof editForm]} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))} placeholder={ph} autoComplete={ac} inputMode={t==='tel'?'tel':undefined}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none text-sm" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'white'}}/></div>
                ))}
                <div><label className="block text-xs font-semibold mb-1.5" style={{color:'#94a3b8'}}>Дата рождения</label>
                <input type="date" value={editForm.birth_date} onChange={e=>setEditForm(f=>({...f,birth_date:e.target.value}))}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none text-sm" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'white',colorScheme:'dark'}}/></div>
                <div><label className="block text-xs font-semibold mb-2" style={{color:'#94a3b8'}}>Аватар</label>
                <div className="grid grid-cols-5 gap-2">
                  {EMOJIS.map(emoji=>(
                    <button key={emoji} onClick={()=>setEditForm(f=>({...f,avatar_emoji:emoji}))} style={{padding:'10px 0',borderRadius:10,fontSize:20,cursor:'pointer',WebkitTapHighlightColor:'transparent',...(editForm.avatar_emoji===emoji?{background:PG,border:'none'}:{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)'})}}>{emoji}</button>
                  ))}
                </div></div>
                {saveMsg&&<p className="text-sm text-center font-medium" style={{color:'#4ade80'}}>{saveMsg}</p>}
                <button onClick={save} disabled={saving} className="btn-primary w-full py-3 text-sm">{saving?'Сохранение...':'💾 Сохранить'}</button>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-sm font-bold text-white mb-3">ℹ️ Аккаунт</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span style={{color:'#4b5563'}}>Email:</span><span className="text-white truncate ml-2">{profile.email}</span></div>
                <div className="flex justify-between"><span style={{color:'#4b5563'}}>XP:</span><span className="gradient-text font-black">{profile.xp.toLocaleString()}</span></div>
                <div className="flex justify-between"><span style={{color:'#4b5563'}}>Участник с:</span><span className="text-white">{new Date(profile.created_at).toLocaleDateString('ru-RU')}</span></div>
              </div>
            </div>
            <button onClick={logout} className="w-full py-3 rounded-2xl text-sm font-bold" style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',WebkitTapHighlightColor:'transparent'}}>🚪 Выйти из аккаунта</button>
          </div>
        )}
      </div>
    </div>
  );
}
