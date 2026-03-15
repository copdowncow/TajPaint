'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PricingItem { id: string; title: string; balls_count: number; price: number; is_active: boolean; sort_order: number; }

export default function AdminPricingPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', balls_count: 100, price: 70, is_active: true });
  const [msg, setMsg] = useState('');

  const load = () => {
    api.getAllPricing().then(setItems).catch(console.error);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setLoading(true); setMsg('');
    try {
      await api.createPricing(form);
      setMsg('✅ Тариф создан');
      setForm({ title: '', balls_count: 100, price: 70, is_active: true });
      load();
    } catch (e: unknown) { setMsg('❌ ' + (e instanceof Error ? e.message : 'Ошибка')); }
    finally { setLoading(false); }
  };

  const toggleActive = async (item: PricingItem) => {
    await api.updatePricing(item.id, { is_active: !item.is_active });
    load();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Удалить тариф?')) return;
    await api.deletePricing(id);
    load();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Тарифы и цены</h1>
        <p className="text-neutral-400 text-sm mt-1">Управление пакетами и стоимостью</p>
      </div>

      {/* Create new */}
      <div className="card p-6 mb-6">
        <h2 className="text-white font-bold mb-4">Добавить тариф</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <input type="text" placeholder="Название" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field text-sm" />
          <input type="number" placeholder="Шаров" value={form.balls_count}
            onChange={e => setForm(f => ({ ...f, balls_count: parseInt(e.target.value) || 100 }))} className="input-field text-sm" />
          <input type="number" placeholder="Цена (сомони)" value={form.price}
            onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} className="input-field text-sm" />
          <button onClick={create} disabled={loading || !form.title}
            className="btn-primary text-sm disabled:opacity-50">+ Добавить</button>
        </div>
        {msg && <p className="text-sm" style={{ color: msg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{msg}</p>}
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-white font-bold">Текущие тарифы</h2>
        </div>
        <div className="divide-y divide-neutral-800">
          {items.map(item => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.is_active ? 'bg-green-500' : 'bg-neutral-600'}`} />
                <div>
                  <div className="text-white font-medium text-sm">{item.title}</div>
                  <div className="text-neutral-500 text-xs">{item.balls_count} шаров</div>
                </div>
              </div>
              <div className="text-orange-400 font-bold">{item.price} сомони</div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(item)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${item.is_active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'}`}>
                  {item.is_active ? 'Активен' : 'Отключён'}
                </button>
                <button onClick={() => deleteItem(item.id)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1">✕</button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-neutral-500">Тарифов нет</div>}
        </div>
      </div>
    </div>
  );
}
