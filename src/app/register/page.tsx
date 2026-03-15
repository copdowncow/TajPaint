'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const EMOJIS = ['🎯','🔥','⚡','💪','🦁','🐯','🦅','🎮','🏆','👊'];
const PG = 'linear-gradient(135deg,#7c3aed,#a855f7)';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', confirm_password: '',
    full_name: '', birth_date: '', phone: '', avatar_emoji: '🎯',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка'); return; }
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      router.push('/profile?welcome=1');
    } catch { setError('Ошибка соединения'); }
    finally { setLoading(false); }
  };

  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 16 };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: '#07050f' }}>
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" style={{ color: '#64748b', WebkitTapHighlightColor: 'transparent' }} className="text-xl p-1">←</Link>
          <div>
            <h1 className="text-xl font-black text-white">Регистрация</h1>
            <p className="text-xs" style={{ color: '#4b5563' }}>Создайте аккаунт в Taj Paintball</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6">
          {[1,2].map(i => <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{ background: i<=step ? PG : 'rgba(255,255,255,0.08)' }}/>)}
        </div>

        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(168,85,247,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}>
          <div className="text-3xl">🎁</div>
          <div>
            <p className="text-white font-bold text-sm">50 шаров в подарок!</p>
            <p className="text-xs" style={{ color: '#94a3b8' }}>Каждому новому участнику при регистрации</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Email *</label>
              <input type="email" placeholder="your@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" inputMode="email"
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Пароль *</label>
              <input type="password" placeholder="Минимум 6 символов" value={form.password}
                onChange={e => set('password', e.target.value)}
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Повторите пароль *</label>
              <input type="password" placeholder="Повторите пароль" value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)}
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
            <button onClick={() => {
              if (!form.email.includes('@')) { setError('Введите корректный email'); return; }
              if (form.password.length < 6) { setError('Пароль минимум 6 символов'); return; }
              if (form.password !== form.confirm_password) { setError('Пароли не совпадают'); return; }
              setError(''); setStep(2);
            }} className="btn-primary w-full py-4 text-base">Далее →</button>
            <p className="text-center text-sm" style={{ color: '#4b5563' }}>
              Уже есть аккаунт?{' '}
              <Link href="/login" className="font-semibold" style={{ color: '#c084fc' }}>Войти</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Имя <span style={{ color: '#374151', fontWeight: 400 }}>(необязательно)</span></label>
              <input type="text" placeholder="Как вас зовут?" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} autoCapitalize="words"
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Телефон <span style={{ color: '#374151', fontWeight: 400 }}>(необязательно)</span></label>
              <input type="tel" placeholder="+992 XX XXX XXXX" value={form.phone}
                onChange={e => set('phone', e.target.value)} inputMode="tel"
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Дата рождения <span style={{ color: '#374151', fontWeight: 400 }}>(необязательно)</span></label>
              <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)}
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={{ ...inp, colorScheme: 'dark' }}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Аватар</label>
              <div className="grid grid-cols-5 gap-2">
                {EMOJIS.map(emoji => (
                  <button key={emoji} onClick={() => set('avatar_emoji', emoji)}
                    style={{
                      padding: '12px 0', borderRadius: 12, fontSize: 22, cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      ...(form.avatar_emoji === emoji
                        ? { background: PG, boxShadow: '0 4px 12px rgba(168,85,247,0.4)', border: 'none' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' })
                    }}>{emoji}</button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setError(''); setStep(1); }} className="btn-secondary py-4 text-sm">← Назад</button>
              <button onClick={submit} disabled={loading} className="btn-primary py-4 text-sm">
                {loading ? '⏳...' : '✅ Создать'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
