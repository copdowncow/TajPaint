'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка'); return; }
      localStorage.setItem('user_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      const redirect = new URLSearchParams(window.location.search).get('redirect') || '/profile';
      router.push(redirect);
    } catch { setError('Ошибка соединения'); }
    finally { setLoading(false); }
  };

  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 16 };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#07050f' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>🎯</div>
          <h1 className="text-2xl font-black text-white mb-1">Войти</h1>
          <p className="text-sm" style={{ color: '#4b5563' }}>Личный кабинет Taj Paintball</p>
        </div>
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required autoComplete="email" inputMode="email"
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#94a3b8' }}>Пароль</label>
              <input type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} required
                className="w-full rounded-xl px-4 py-4 focus:outline-none transition-all" style={inp}/>
            </div>
            {error && <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className="text-center text-sm mt-4" style={{ color: '#4b5563' }}>
            Нет аккаунта?{' '}
            <Link href="/register" className="font-semibold" style={{ color: '#c084fc' }}>Зарегистрироваться</Link>
          </p>
        </div>
        <p className="text-center text-xs mt-4">
          <Link href="/" style={{ color: '#374151' }}>← На главную</Link>
        </p>
      </div>
    </div>
  );
}
