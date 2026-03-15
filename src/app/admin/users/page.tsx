'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface User {
  id: string; phone: string; full_name?: string; avatar_emoji: string;
  total_balls: number; total_games: number; bonus_balls: number;
  level: string; is_active: boolean; created_at: string;
}

const LEVEL_INFO: Record<string, { name: string; emoji: string; color: string }> = {
  rookie: { name: 'Новичок', emoji: '🥉', color: '#9ca3af' },
  player: { name: 'Игрок', emoji: '🥈', color: '#60a5fa' },
  pro: { name: 'Про', emoji: '🥇', color: '#fbbf24' },
  elite: { name: 'Элита', emoji: '💎', color: '#a855f7' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ phone: '', level: '' });
  const [selected, setSelected] = useState<User | null>(null);
  const [bonusInput, setBonusInput] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('admin_token');
    const p = new URLSearchParams();
    if (filters.phone) p.set('phone', filters.phone);
    if (filters.level) p.set('level', filters.level);
    const r = await fetch(`/api/admin/users?${p}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await r.json();
    setUsers(d.users || []); setTotal(d.total || 0);
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateUser = async (id: string, data: Record<string, unknown>) => {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (r.ok) { await fetchUsers(); setSelected(null); }
    setSaving(false);
  };

  return (
    <div className="p-5 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Пользователи</h1>
          <p className="text-sm mt-1" style={{ color: '#4b5563' }}>Всего: {total}</p>
        </div>
      </div>

      <div className="card p-4 mb-6 flex gap-2 flex-wrap">
        <input type="text" placeholder="Телефон..." value={filters.phone}
          onChange={e => setFilters(f => ({ ...f, phone: e.target.value }))}
          className="input-field text-sm py-2.5 flex-1" style={{ minWidth: 150 }}/>
        <select value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}
          className="input-field text-sm py-2.5" style={{ minWidth: 120 }}>
          <option value="">Все уровни</option>
          {Object.entries(LEVEL_INFO).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="card p-4 h-28 animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {users.map(u => {
            const lvl = LEVEL_INFO[u.level] || LEVEL_INFO.rookie;
            return (
              <button key={u.id} onClick={() => setSelected(u)}
                className="card p-4 text-left hover:border-purple-500/30 transition-all"
                style={{ WebkitTapHighlightColor: 'transparent', cursor: 'pointer', width: '100%' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 40, height: 40, background: 'rgba(168,85,247,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {u.avatar_emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{u.full_name || 'Игрок'}</p>
                    <p className="text-xs" style={{ color: '#4b5563' }}>{u.phone}</p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: lvl.color }}>{lvl.emoji}</span>
                </div>
                <div className="flex gap-3 text-xs" style={{ color: '#64748b' }}>
                  <span>🎯 {u.total_balls}</span>
                  <span>🎮 {u.total_games}</span>
                  <span style={{ color: '#a855f7' }}>🎁 {u.bonus_balls}</span>
                  {!u.is_active && <span style={{ color: '#ef4444' }}>🚫 Заблокирован</span>}
                </div>
              </button>
            );
          })}
          {users.length === 0 && <div className="card p-12 text-center col-span-3" style={{ color: '#374151' }}>Нет пользователей</div>}
        </div>
      )}

      {/* User modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm card p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div style={{ width: 44, height: 44, background: 'rgba(168,85,247,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{selected.avatar_emoji}</div>
              <div>
                <p className="text-white font-bold">{selected.full_name || 'Игрок'}</p>
                <p className="text-xs" style={{ color: '#4b5563' }}>{selected.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {[['🎯', selected.total_balls, 'шаров'],['🎮', selected.total_games, 'игр'],['🎁', selected.bonus_balls, 'бонусов']].map(([i,v,l]) => (
                <div key={String(l)} className="rounded-xl py-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-lg font-black gradient-text">{v}</div>
                  <div className="text-xs" style={{ color: '#4b5563' }}>{i} {l}</div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>Уровень</p>
              <select value={selected.level} onChange={e => setSelected(s => s ? { ...s, level: e.target.value } : s)}
                className="input-field text-sm py-2.5 w-full">
                {Object.entries(LEVEL_INFO).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.name}</option>)}
              </select>
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>Начислить/списать бонусные шары</p>
              <div className="flex gap-2">
                <input type="number" placeholder="+100 или -50" value={bonusInput}
                  onChange={e => setBonusInput(e.target.value)}
                  className="input-field text-sm py-2.5 flex-1"/>
              </div>
              <input type="text" placeholder="Причина (обязательно)" value={bonusReason}
                onChange={e => setBonusReason(e.target.value)}
                className="input-field text-sm py-2.5 w-full mt-2"/>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSelected(null)} className="btn-secondary py-3 text-sm">Отмена</button>
              <button disabled={saving} onClick={() => {
                const newBonus = bonusInput
                  ? Math.max(0, selected.bonus_balls + parseInt(bonusInput))
                  : selected.bonus_balls;
                updateUser(selected.id, {
                  level: selected.level,
                  is_active: selected.is_active,
                  bonus_balls: newBonus,
                  bonus_balls_reason: bonusReason || 'Изменение администратором',
                });
              }} className="btn-primary py-3 text-sm">
                {saving ? '...' : 'Сохранить'}
              </button>
            </div>

            <button onClick={() => updateUser(selected.id, { is_active: !selected.is_active })}
              className="w-full py-2 rounded-xl text-xs font-bold"
              style={{ background: selected.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(22,163,74,0.1)', color: selected.is_active ? '#f87171' : '#4ade80', border: `1px solid ${selected.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}` }}>
              {selected.is_active ? '🚫 Заблокировать' : '✅ Разблокировать'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
