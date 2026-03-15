-- Добавить поле email клиента
-- Выполнить в Supabase SQL Editor если уже создали таблицы ранее

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE games_history ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
