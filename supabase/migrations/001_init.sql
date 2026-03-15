-- =============================================
-- TAJ PAINTBALL — Database Migration v1
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ADMINS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
  full_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRICING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  balls_count INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Customer info
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  
  -- Game info
  game_date DATE NOT NULL,
  game_time TIME NOT NULL,
  players_count INTEGER NOT NULL CHECK (players_count >= 1 AND players_count <= 100),
  balls_count INTEGER NOT NULL CHECK (balls_count >= 100),
  price_per_100_balls DECIMAL(10,2) NOT NULL DEFAULT 70.00,
  total_price DECIMAL(10,2) NOT NULL,
  
  -- Prepayment
  prepayment_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  prepayment_status VARCHAR(50) DEFAULT 'not_paid' 
    CHECK (prepayment_status IN ('not_paid', 'pending', 'confirmed', 'returned', 'held', 'cancelled')),
  
  -- Booking status
  booking_status VARCHAR(50) DEFAULT 'new'
    CHECK (booking_status IN ('new', 'awaiting_prepayment', 'prepayment_review', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Comments
  customer_comment TEXT,
  admin_comment TEXT,
  
  -- Admin who processed
  processed_by UUID REFERENCES admins(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  prepayment_confirmed_at TIMESTAMPTZ,
  prepayment_returned_at TIMESTAMPTZ,
  
  -- Source
  source VARCHAR(50) DEFAULT 'website'
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(game_date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);

-- =============================================
-- BOOKING HISTORY / AUDIT LOG
-- =============================================
CREATE TABLE IF NOT EXISTS booking_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT,
  performed_by VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_booking ON booking_logs(booking_id);

-- =============================================
-- GAMES HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS games_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  booking_number VARCHAR(20),
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(30) NOT NULL,
  game_date DATE NOT NULL,
  game_time TIME NOT NULL,
  players_count INTEGER NOT NULL,
  balls_count INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  prepayment_amount DECIMAL(10,2),
  prepayment_status VARCHAR(50),
  final_status VARCHAR(50) NOT NULL,
  admin_comment TEXT,
  finished_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_date ON games_history(game_date);
CREATE INDEX IF NOT EXISTS idx_history_phone ON games_history(customer_phone);

-- =============================================
-- TELEGRAM LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS telegram_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  event_type VARCHAR(100) NOT NULL,
  message_text TEXT,
  telegram_message_id INTEGER,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'sent'
);

-- =============================================
-- TIME SLOTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- =============================================
-- FUNCTION: auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: generate booking number
-- =============================================
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM bookings;
  new_number := 'TJP-' || LPAD(counter::TEXT, 4, '0');
  WHILE EXISTS (SELECT 1 FROM bookings WHERE booking_number = new_number) LOOP
    counter := counter + 1;
    new_number := 'TJP-' || LPAD(counter::TEXT, 4, '0');
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE games_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Public can read pricing and time_slots
CREATE POLICY "Public read pricing" ON pricing FOR SELECT USING (true);
CREATE POLICY "Public read time_slots" ON time_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Public read settings" ON settings FOR SELECT USING (true);

-- Public can insert bookings
CREATE POLICY "Public insert bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Service role has full access (used by backend)
CREATE POLICY "Service role all bookings" ON bookings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all admins" ON admins FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all pricing" ON pricing FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all settings" ON settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all history" ON games_history FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all logs" ON telegram_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all booking_logs" ON booking_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role all slots" ON time_slots FOR ALL USING (auth.role() = 'service_role');

