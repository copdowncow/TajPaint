'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e:React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const r = await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login,password})});
      const d = await r.json();
      if(!r.ok){setError(d.error||'Ошибка');return;}
      localStorage.setItem('admin_token',d.token);
      router.push('/admin');
    } catch { setError('Ошибка соединения'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{background:'#07050f'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div style={{width:60,height:60,background:'linear-gradient(135deg,#7c3aed,#a855f7)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,margin:'0 auto 16px'}}>🎯</div>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-2xl font-black text-white">TAJ</span>
            <span className="text-2xl font-black" style={{color:'#60a5fa'}}>PAINTBALL</span>
          </div>
          <p className="text-sm" style={{color:'#4b5563'}}>Панель администратора</p>
        </div>
        <div className="card p-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'#94a3b8'}}>Логин</label>
              <input type="text" value={login} onChange={e=>setLogin(e.target.value)} className="input-field" placeholder="admin" required autoComplete="username"/>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'#94a3b8'}}>Пароль</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="input-field" placeholder="••••••••" required autoComplete="current-password"/>
            </div>
            {error&&<p className="text-sm text-center" style={{color:'#f87171'}}>{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-4">
              {loading?'Вход...':'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
