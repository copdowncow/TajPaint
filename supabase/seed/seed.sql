-- Default settings
INSERT INTO settings (key, value, description) VALUES
  ('price_per_100_balls', '70', 'Цена за 100 шаров в сомони'),
  ('prepayment_amount', '50', 'Обязательная предоплата в сомони'),
  ('min_players', '1', 'Минимальное количество игроков'),
  ('max_players', '50', 'Максимальное количество игроков'),
  ('min_balls', '100', 'Минимальное количество шаров'),
  ('booking_open_days', '30', 'На сколько дней вперед открыто бронирование'),
  ('club_name', 'Taj Paintball', 'Название клуба'),
  ('club_phone', '+992 50 213 14 15', 'Телефон клуба'),
  ('club_address', 'Чордомаи Аэропорт, рядом с клиникой «Нигох»', 'Адрес клуба'),
  ('working_hours', '10:00 - 23:00', 'Часы работы')
ON CONFLICT (key) DO NOTHING;

-- Pricing packages
INSERT INTO pricing (title, balls_count, price, is_active, sort_order) VALUES
  ('Старт', 100, 70, true, 1),
  ('Базовый', 200, 140, true, 2),
  ('Стандарт', 300, 210, true, 3),
  ('Комфорт', 500, 350, true, 4),
  ('Про', 700, 490, true, 5),
  ('Максимум', 1000, 700, true, 6)
ON CONFLICT DO NOTHING;

-- Time slots 10:00 - 23:00
INSERT INTO time_slots (slot_time, is_active, sort_order) VALUES
  ('10:00', true, 1), ('11:00', true, 2), ('12:00', true, 3),
  ('13:00', true, 4), ('14:00', true, 5), ('15:00', true, 6),
  ('16:00', true, 7), ('17:00', true, 8), ('18:00', true, 9),
  ('19:00', true, 10), ('20:00', true, 11), ('21:00', true, 12),
  ('22:00', true, 13), ('23:00', true, 14)
ON CONFLICT DO NOTHING;
