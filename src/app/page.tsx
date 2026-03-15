use client';
import Link from 'next/link';
import { useState } from 'react';

const REVIEWS = [
  { name: 'Алишер Р.', text: 'Отличное место! Отмечали день рождения — все в восторге. Персонал профессиональный.', stars: 5 },
  { name: 'Диана М.', text: 'Были с командой. Организовали корпоратив — незабываемо! Рекомендую всем.', stars: 5 },
  { name: 'Фарход Н.', text: 'Бронировали онлайн — очень удобно. Всё было готово. Обязательно вернёмся.', stars: 5 },
];
const ADVANTAGES = [
  { icon: '🎯', title: 'Проф. оборудование', desc: 'Маркеры и маски международного класса' },
  { icon: '🌿', title: 'Большая игровая зона', desc: 'Поля с природным ландшафтом' },
  { icon: '👨‍🏫', title: 'Опытные инструкторы', desc: 'Проведут инструктаж и организуют игру' },
  { icon: '🎉', title: 'Мероприятия под ключ', desc: 'Дни рождения, корпоративы, турниры' },
  { icon: '🛡️', title: 'Безопасность', desc: 'Строгие правила и качественная защита' },
  { icon: '💎', title: 'Честные цены', desc: 'Без скрытых платежей' },
];
const STEPS = [
  { n: '01', title: 'Бронируйте онлайн', desc: 'Выберите дату, время, игроков и шары.' },
  { n: '02', title: 'Внесите предоплату', desc: 'Всего 50 сомони — бронь подтверждена.' },
  { n: '03', title: 'Получите снаряжение', desc: 'Маркер, маска, жилет — всё включено.' },
  { n: '04', title: 'В бой!', desc: 'Инструктаж, команды — незабываемая битва!' },
];
const NAV: [string, string][] = [['#about','О нас'],['#how','Как это работает'],['#reviews','Отзывы'],['#contacts','Контакты']];
const PG = 'linear-gradient(135deg,#7c3aed,#a855f7)';
const PS = '0 4px 16px rgba(168,85,247,0.35)';


function NavAuthButtons() {
  const [user, setUser] = useState<{full_name?:string;avatar_emoji?:string}|null>(null);
  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const data = localStorage.getItem('user_data');
    if (token && data) { try { setUser(JSON.parse(data)); } catch {} }
  }, []);
  if (user) return (
    <Link href="/profile" className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors" style={{background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.2)',color:'#c084fc'}}>
      <span>{user.avatar_emoji||'🎯'}</span>
      <span>{user.full_name||'Профиль'}</span>
    </Link>
  );
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="text-sm font-medium transition-colors" style={{color:'#94a3b8'}} onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#fff';}} onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='#94a3b8';}}>Войти</Link>
      <Link href="/register" className="text-sm font-bold px-3 py-1.5 rounded-xl transition-all" style={{background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc'}}>Регистрация</Link>
    </div>
  );
}

function MobileAuthLinks({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<{full_name?:string;avatar_emoji?:string}|null>(null);
  useEffect(() => {
    const token = localStorage.getItem('user_token');
    const data = localStorage.getItem('user_data');
    if (token && data) { try { setUser(JSON.parse(data)); } catch {} }
  }, []);
  if (user) return (
    <Link href="/profile" onClick={onClose} className="flex items-center gap-2 py-3 px-3 rounded-xl font-semibold" style={{background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.2)',color:'#c084fc'}}>
      <span>{user.avatar_emoji||'🎯'}</span><span>{user.full_name||'Мой профиль'}</span>
    </Link>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link href="/login" onClick={onClose} className="py-3 text-center rounded-xl text-sm font-bold" style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#94a3b8'}}>Войти</Link>
      <Link href="/register" onClick={onClose} className="py-3 text-center rounded-xl text-sm font-bold" style={{background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc'}}>🎁 Регистрация</Link>
    </div>
  );
}

function BallsCalc() {
  const [players, setPlayers] = useState(4);
  const [perPlayer, setPerPlayer] = useState(200);
  const total = players * perPlayer;
  const MAX = 15;
  return (
    <div className="card p-6 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-white">👥 Количество игроков</span>
          <span className="text-2xl font-black gradient-text">{players}</span>
        </div>
        <div className="flex items-center gap-4 rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <button onClick={()=>setPlayers(p=>Math.max(1,p-1))} style={{width:44,height:44,borderRadius:12,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'white',fontSize:22,fontWeight:'bold',cursor:'pointer',WebkitTapHighlightColor:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>−</button>
          <div className="flex-1 text-center">
            <div className="text-4xl font-black gradient-text">{players}</div>
            <div className="text-xs" style={{color:'#4b5563'}}>человек</div>
          </div>
          <button onClick={()=>setPlayers(p=>Math.min(MAX,p+1))} style={{width:44,height:44,borderRadius:12,background:'rgba(168,85,247,0.15)',border:'1px solid rgba(168,85,247,0.3)',color:'#c084fc',fontSize:22,fontWeight:'bold',cursor:'pointer',WebkitTapHighlightColor:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
        </div>
        <input type="range" min={1} max={MAX} value={players} onChange={e=>setPlayers(+e.target.value)}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-3"
          style={{background:`linear-gradient(to right,#a855f7 ${((players-1)/(MAX-1))*100}%,rgba(255,255,255,0.1) ${((players-1)/(MAX-1))*100}%)`}}/>
        <div className="flex justify-between text-xs mt-1" style={{color:'#374151'}}><span>1</span><span>5</span><span>15</span></div>
      </div>
      <div>
        <span className="block text-sm font-semibold text-white mb-3">🎯 Шаров на каждого игрока</span>
        <div className="grid grid-cols-4 gap-2">
          {[100,200,300,500].map(n=>(
            <button key={n} onClick={()=>setPerPlayer(n)}
              style={{padding:'12px 0',borderRadius:12,fontSize:14,fontWeight:'bold',cursor:'pointer',WebkitTapHighlightColor:'transparent',...(perPlayer===n?{background:PG,color:'white',boxShadow:PS,border:'none'}:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#94a3b8'})}}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl p-5" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(168,85,247,0.08))',border:'1px solid rgba(168,85,247,0.2)'}}>
        <div className="flex justify-between text-sm mb-2"><span style={{color:'#94a3b8'}}>Игроков:</span><span className="text-white font-semibold">{players} чел.</span></div>
        <div className="flex justify-between text-sm mb-3"><span style={{color:'#94a3b8'}}>Шаров на каждого:</span><span className="text-white font-semibold">{perPlayer} шт.</span></div>
        <div style={{height:1,background:'rgba(255,255,255,0.08)',marginBottom:12}}/>
        <div className="flex justify-between items-center">
          <span className="font-bold text-white">Всего шаров:</span>
          <span className="text-3xl font-black gradient-text">{total.toLocaleString()}</span>
        </div>
      </div>
      <Link href="/booking" className="btn-primary py-4 text-base w-full block text-center">Забронировать →</Link>
    </div>
  );
}

export default function HomePage() {
  const [menu, setMenu] = useState(false);
  return (
    <div className="min-h-screen text-white" style={{background:'#07050f'}}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{background:'rgba(7,5,15,0.88)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <div className="px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div style={{width:34,height:34,background:PG,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🎯</div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black tracking-tight text-white">TAJ</span>
              <span className="text-lg font-black tracking-tight gradient-text">PAINTBALL</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            {NAV.map(([h,l])=>(
              <a key={h} href={h} className="text-sm font-medium" style={{color:'#94a3b8',transition:'color 0.15s'}}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color='#fff';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color='#94a3b8';}}>{l}</a>
            ))}
            <NavAuthButtons />
            <Link href="/booking" className="btn-primary py-2.5 px-5 text-sm">Забронировать</Link>
          </div>
          <button className="md:hidden p-2" onClick={()=>setMenu(!menu)} style={{WebkitTapHighlightColor:'transparent'}}>
            <div style={{width:22,height:14,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
              {[0,1,2].map(i=><span key={i} style={{display:'block',height:2,background:'white',borderRadius:2,transition:'all 0.2s',opacity:menu&&i===1?0:1,transform:menu?(i===0?'rotate(45deg) translateY(6px)':i===2?'rotate(-45deg) translateY(-6px)':''):'none'}}/>)}
            </div>
          </button>
        </div>
        {menu&&(
          <div className="md:hidden px-4 pb-5 pt-2 flex flex-col gap-1" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
            {NAV.map(([h,l])=><a key={h} href={h} className="py-3 px-3 text-base font-medium rounded-xl" style={{color:'#94a3b8'}} onClick={()=>setMenu(false)}>{l}</a>)}
            <MobileAuthLinks onClose={()=>setMenu(false)} />
            <Link href="/booking" className="btn-primary py-4 text-center mt-2" onClick={()=>setMenu(false)}>🎯 Забронировать игру</Link>
          </div>
        )}
      </nav>

      {/* HERO — фото пейнтбола из public/hero.jpg */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Фото — всегда работает, лежит в проекте */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'url(/hero.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 35%',
          backgroundRepeat: 'no-repeat',
          filter: 'brightness(0.28) saturate(0.75)',
        }}/>
        {/* Тёмный градиент снизу */}
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(7,5,15,0.1) 0%,rgba(7,5,15,0) 25%,rgba(7,5,15,0.6) 70%,#07050f 100%)'}}/>
        {/* Фиолетовый оверлей */}
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse at 50% 40%,rgba(124,58,237,0.18) 0%,transparent 65%)'}}/>

        <div className="relative z-10 text-center px-4 w-full max-w-2xl mx-auto py-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8" style={{background:'rgba(168,85,247,0.12)',border:'1px solid rgba(168,85,247,0.3)',color:'#d8b4fe'}}>
            <span style={{width:6,height:6,background:'#a855f7',borderRadius:'50%',display:'inline-block'}}/>
            Лучший пейнтбол в Таджикистане
          </div>
          <h1 className="font-black mb-5 leading-none">
            <span className="block text-6xl sm:text-7xl lg:text-8xl text-white mb-1">TAJ</span>
            <span className="block text-5xl sm:text-6xl lg:text-7xl gradient-text">PAINTBALL</span>
          </h1>
          <p className="text-lg sm:text-xl mb-3 font-medium" style={{color:'#cbd5e1'}}>Адреналин, командный дух и незабываемые эмоции</p>
          <p className="text-sm mb-10" style={{color:'#6b7280'}}>Душанбе · Чордомаи Аэропорт · Рядом с клиникой «Нигох»</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
            <Link href="/booking" className="btn-primary py-5 px-10 text-lg w-full sm:w-auto">🎯 Забронировать игру</Link>
            <a href="#how" className="btn-secondary py-5 px-10 text-lg w-full sm:w-auto">Как это работает</a>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-3">
            {[['500+','Игр проведено'],['98%','Довольных гостей'],['5★','Рейтинг']].map(([n,l])=>(
              <div key={l} className="py-4 px-2 rounded-2xl text-center" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                <div className="text-2xl font-black gradient-text">{n}</div>
                <div className="text-xs mt-1" style={{color:'#4b5563'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="section-title mb-3">Почему <span className="gradient-text">Taj Paintball</span></h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADVANTAGES.map(a=>(
              <div key={a.title} className="card p-5">
                <div className="text-3xl mb-3">{a.icon}</div>
                <h3 className="text-base font-bold text-white mb-1">{a.title}</h3>
                <p className="text-sm leading-relaxed" style={{color:'#4b5563'}}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="py-20 px-4" style={{background:'rgba(255,255,255,0.02)'}}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Выбери <span className="gradient-text">шары</span></h2>
            <p className="text-sm" style={{color:'#4b5563'}}>Команда и количество шаров на каждого игрока</p>
          </div>
          <BallsCalc />
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12"><h2 className="section-title mb-3">Как проходит <span className="gradient-text">игра</span></h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map(s=>(
              <div key={s.n} className="card p-6 flex gap-4 items-start">
                <div className="text-4xl font-black leading-none flex-shrink-0" style={{color:'rgba(168,85,247,0.25)'}}>{s.n}</div>
                <div><h3 className="text-base font-bold text-white mb-1">{s.title}</h3><p className="text-sm leading-relaxed" style={{color:'#4b5563'}}>{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="py-20 px-4" style={{background:'rgba(255,255,255,0.02)'}}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12"><h2 className="section-title mb-3">Отзывы <span className="gradient-text">гостей</span></h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {REVIEWS.map(r=>(
              <div key={r.name} className="card p-5">
                <div className="flex gap-0.5 mb-3">{[...Array(r.stars)].map((_,i)=><span key={i} style={{color:'#fbbf24',fontSize:14}}>★</span>)}</div>
                <p className="text-sm leading-relaxed mb-4" style={{color:'#94a3b8'}}>{r.text}</p>
                <div className="text-sm font-semibold gradient-text">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto">
          <div className="rounded-3xl p-10 text-center" style={{background:'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(168,85,247,0.12))',border:'1px solid rgba(168,85,247,0.25)'}}>
            <h2 className="section-title mb-3">Готов к <span className="gradient-text">битве?</span></h2>
            <p className="text-sm mb-8" style={{color:'#4b5563'}}>Забронируй прямо сейчас — быстро и удобно</p>
            <Link href="/booking" className="btn-primary py-5 px-12 text-lg w-full block text-center">🎯 Забронировать игру</Link>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-20 px-4" style={{background:'rgba(255,255,255,0.02)'}}>
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title mb-8 text-center">Контакты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              {icon:'📍',title:'Адрес',val:'Чордомаи Аэропорт, рядом с клиникой «Нигох»'},
              {icon:'📞',title:'Телефон',val:'+992 20 840 00 00',href:'tel:+992208400000'},
              {icon:'🕐',title:'Режим работы',val:'Ежедневно 10:00 – 23:00'},
            ].map(c=>(
              <div key={c.title} className="card p-5 text-center">
                <div className="text-3xl mb-3">{c.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{c.title}</div>
                {c.href?<a href={c.href} className="text-sm font-semibold gradient-text">{c.val}</a>:<p className="text-sm" style={{color:'#4b5563'}}>{c.val}</p>}
              </div>
            ))}
          </div>
          <a href="tel:+992208400000" className="flex items-center justify-center gap-2 w-full text-white font-bold py-4 rounded-2xl text-base" style={{background:'linear-gradient(135deg,#16a34a,#15803d)',WebkitTapHighlightColor:'transparent'}}>
            📞 Позвонить нам
          </a>
        </div>
      </section>

      <footer className="py-8 px-4" style={{borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-1"><span className="text-lg font-black text-white">TAJ</span><span className="text-lg font-black gradient-text">PAINTBALL</span></div>
          <p className="text-xs" style={{color:'#1f2937'}}>© 2024 Taj Paintball. Все права защищены.</p>
          <Link href="/admin" className="text-xs" style={{color:'#1f2937'}}>Панель управления</Link>
        </div>
      </footer>
    </div>
  );
}
