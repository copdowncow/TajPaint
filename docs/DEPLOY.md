# Деплой Taj Paintball

## 1. Supabase
1. supabase.com → New project
2. SQL Editor → выполнить: supabase/migrations/001_init.sql
3. SQL Editor → выполнить: supabase/seed/seed.sql
4. SQL Editor → выполнить: supabase/migrations/002_disable_rls.sql

## 2. Railway
1. Новый проект → загрузить ZIP
2. Settings → Variables → добавить из .env.example:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - TELEGRAM_BOT_TOKEN
   - TELEGRAM_ADMIN_CHAT_ID
   - JWT_SECRET
   - ADMIN_LOGIN=admin
   - ADMIN_PASSWORD=TajPaintball2024!
   - APP_URL=https://твой-домен.railway.app
   - NODE_ENV=production
3. Deploy

## 3. Создать администратора
В Railway → Service → New Command:
  node scripts/createAdmin.js

## 4. Telegram webhook
Автоматически регистрируется при старте если задан APP_URL.
Проверить: GET https://твой-домен.railway.app/api/telegram

## Telegram 409 — больше не будет
Убрали node-telegram-bot-api. Бот работает через чистый fetch без polling.
