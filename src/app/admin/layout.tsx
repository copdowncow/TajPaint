'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') { setReady(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin/login'); return; }
    fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.ok) { setAuthed(true); setReady(true); }
        else { localStorage.removeItem('admin_token'); router.push('/admin/login'); }
      })
      .catch(() => router.push('/admin/login'));
  }, [pathname, router]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07050f' }}>
      <div className="text-2xl animate-pulse" style={{ color: '#a855f7' }}>⏳</div>
    </div>
  );
  if (pathname === '/admin/login') return <>{children}</>;
  if (!authed) return null;

  const nav = [
    { href: '/admin', icon: '📊', label: 'Дашборд' },
    { href: '/admin/bookings', icon: '📋', label: 'Брони' },
    { href: '/admin/users', icon: '👥', label: 'Клиенты' },
    { href: '/admin/history', icon: '🏁', label: 'История' },
    { href: '/admin/pricing', icon: '💰', label: 'Тарифы' },
    { href: '/admin/settings', icon: '⚙️', label: 'Настройки' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#07050f' }}>
      <aside className="w-56 hidden md:flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', minHeight: '100vh' }}>
        <div className="p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎯</div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-white">TAJ</span>
              <span className="text-sm font-black gradient-text">PAINTBALL</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: '#374151' }}>Панель управления</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={active
                  ? { background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }
                  : { color: '#4b5563', border: '1px solid transparent' }}>
                <span>{item.icon}</span><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" className="block text-xs mb-2 transition-colors" style={{ color: '#374151' }}>← На сайт</Link>
          <button onClick={() => { localStorage.removeItem('admin_token'); router.push('/admin/login'); }}
            className="text-xs transition-colors w-full text-left" style={{ color: '#374151' }}>
            Выйти
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2"
        style={{ background: 'rgba(7,5,15,0.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center py-1 px-2 rounded-lg transition-colors"
              style={{ color: active ? '#c084fc' : '#374151' }}>
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
    </div>
  );
}
