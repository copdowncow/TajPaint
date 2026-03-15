'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Setting { id: string; key: string; value: string; description?: string; }

const SETTING_LABELS: Record<string, string> = {
  price_per_100_balls: '💰 Цена за 100 шаров (сомони)',
  prepayment_amount: '💳 Размер предоплаты (сомони)',
  min_players: '👥 Минимум игроков',
  max_players: '👥 Максимум игроков',
  min_balls: '🎯 Минимум шаров',
  booking_open_days: '📅 Дней для бронирования вперёд',
  club_name: '🏢 Название клуба',
  club_phone: '📞 Телефон клуба',
  club_address: '📍 Адрес клуба',
  working_hours: '🕐 Часы работы',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getSettings().then(data => {
      setSettings(data);
      const v: Record<string, string> = {};
      data.forEach((s: Setting) => { v[s.key] = s.value; });
      setValues(v);
    });
  }, []);

  const save = async (key: string) => {
    setSaving(key);
    try {
      await api.updateSetting(key, values[key]);
      setMsgs(m => ({ ...m, [key]: '✅' }));
      setTimeout(() => setMsgs(m => ({ ...m, [key]: '' })), 2000);
    } catch { setMsgs(m => ({ ...m, [key]: '❌' })); }
    finally { setSaving(null); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Настройки</h1>
        <p className="text-neutral-400 text-sm mt-1">Параметры системы</p>
      </div>

      <div className="space-y-3">
        {settings.map(s => (
          <div key={s.key} className="card p-4">
            <label className="block text-sm text-neutral-300 font-medium mb-2">
              {SETTING_LABELS[s.key] || s.key}
            </label>
            <div className="flex gap-2">
              <input type="text" value={values[s.key] || ''} onChange={e => setValues(v => ({ ...v, [s.key]: e.target.value }))}
                className="input-field text-sm flex-1" />
              <button onClick={() => save(s.key)} disabled={saving === s.key}
                className="btn-primary text-sm py-2 px-4 whitespace-nowrap">
                {saving === s.key ? '...' : msgs[s.key] || 'Сохранить'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
