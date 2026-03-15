-- Реферальная система
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- кто пригласил
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- кого пригласили
  status VARCHAR(20) DEFAULT 'pending',  -- pending | activated (первая игра сыграна)
  bonus_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ
);

-- Добавить поля в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;  -- очки опыта (не шары)
ALTER TABLE users ADD COLUMN IF NOT EXISTS birthday_game_bonus_year INTEGER DEFAULT 0; -- год когда уже дали бонус за игру в ДР
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0; -- серия дней с игрой
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_game_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0; -- потрачено сомони

-- Уведомления пользователя
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id);

ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications DISABLE ROW LEVEL SECURITY;
