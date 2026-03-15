-- Профили пользователей (регистрация через Email)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(100),
  birth_date DATE,
  phone VARCHAR(20),
  avatar_emoji VARCHAR(10) DEFAULT '🎯',
  total_balls INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  bonus_balls INTEGER DEFAULT 0,
  level VARCHAR(20) DEFAULT 'rookie',
  registration_bonus_given BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bonus_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  booking_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS bonus_balls_used INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_bonus_tx_user ON bonus_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE bonus_transactions DISABLE ROW LEVEL SECURITY;
