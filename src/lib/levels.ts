export interface Level {
  key: string;
  name: string;
  emoji: string;
  minXP: number;       // порог XP (не шары!)
  color: string;
  discount: number;
  bonusBallsPerMonth: number;
  perks: string[];
}

// Уровни теперь по XP (опыт), не по шарам
// XP начисляется: 1 шар = 1 XP, реферал сыграл = +200 XP
export const LEVELS: Level[] = [
  { key: 'rookie', name: 'Новичок', emoji: '🥉', minXP: 0,     color: '#9ca3af', discount: 0,  bonusBallsPerMonth: 0,   perks: ['50 шаров при регистрации', 'Онлайн-бронирование'] },
  { key: 'player', name: 'Игрок',   emoji: '🥈', minXP: 500,   color: '#60a5fa', discount: 0,  bonusBallsPerMonth: 0,   perks: ['Приоритет бронирования', 'Достижения открыты'] },
  { key: 'pro',    name: 'Про',     emoji: '🥇', minXP: 2000,  color: '#fbbf24', discount: 0,  bonusBallsPerMonth: 100, perks: ['+100 бонусных шаров в месяц', 'Реферальные бонусы x2'] },
  { key: 'elite',  name: 'Элита',   emoji: '💎', minXP: 20000, color: '#a855f7', discount: 15, bonusBallsPerMonth: 200, perks: ['Скидка 15% на все заказы', '+200 шаров в месяц', 'VIP-обслуживание', 'Персональный инструктор'] },
];

export function getLevel(xp: number): Level {
  return [...LEVELS].reverse().find(l => xp >= l.minXP) || LEVELS[0];
}
export function getNextLevel(xp: number): Level | null {
  const curr = getLevel(xp);
  const idx = LEVELS.findIndex(l => l.key === curr.key);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}
export function getLevelProgress(xp: number): number {
  const curr = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  return Math.min(100, Math.round(((xp - curr.minXP) / (next.minXP - curr.minXP)) * 100));
}
export function getDiscount(xp: number): number {
  return getLevel(xp).discount;
}
