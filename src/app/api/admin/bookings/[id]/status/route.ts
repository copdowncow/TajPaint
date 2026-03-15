import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { notifyStatusChange } from '@/bot/telegram';
import { getLevel, getDiscount } from '@/lib/levels';

async function notify(userId: string, type: string, title: string, body: string) {
  await supabase.from('user_notifications').insert({ user_id: userId, type, title, body });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = getAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const { status, admin_comment } = await req.json();
  const valid = ['new','awaiting_prepayment','prepayment_review','confirmed','cancelled','completed','no_show'];
  if (!valid.includes(status)) return NextResponse.json({ error: 'Неверный статус' }, { status: 400 });

  const upd: Record<string, unknown> = { booking_status: status, processed_by: admin.id };
  if (admin_comment) upd.admin_comment = admin_comment;
  if (status === 'confirmed') upd.confirmed_at = new Date().toISOString();
  if (status === 'cancelled') upd.cancelled_at = new Date().toISOString();
  if (['completed','no_show'].includes(status)) upd.completed_at = new Date().toISOString();

  const { data: bk } = await supabase.from('bookings').update(upd).eq('id', params.id).select().single();
  if (!bk) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

  if (['completed','no_show'].includes(status)) {
    await supabase.from('games_history').insert({
      booking_id: bk.id, booking_number: bk.booking_number,
      customer_name: bk.customer_name, customer_phone: bk.customer_phone,
      game_date: bk.game_date, game_time: bk.game_time,
      players_count: bk.players_count, balls_count: bk.balls_count,
      total_price: bk.total_price, prepayment_amount: bk.prepayment_amount,
      prepayment_status: bk.prepayment_status, final_status: status,
      finished_at: new Date().toISOString(),
    });
  }

  // Обновить профиль пользователя если игра завершена
  if (status === 'completed' && bk.user_id) {
    const { data: user } = await supabase.from('users').select('*').eq('id', bk.user_id).single();
    if (user) {
      const ballsPlayed = bk.balls_count || 0;
      const newTotalBalls = (user.total_balls || 0) + ballsPlayed;
      const newTotalGames = (user.total_games || 0) + 1;
      const newXP = (user.xp || 0) + ballsPlayed; // 1 шар = 1 XP
      const newSpent = (user.total_spent || 0) + (bk.total_price || 0);
      const newLevel = getLevel(newXP);
      const oldLevel = getLevel(user.xp || 0);

      // Стрик
      const today = new Date().toISOString().split('T')[0];
      const lastGame = user.last_game_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = lastGame === yesterday ? (user.streak_days || 0) + 1 : 1;

      let bonusGain = 0;
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59);

      // Бонус за 1000+ шаров в одном заказе
      if (ballsPlayed >= 1000) {
        bonusGain += 200;
        await supabase.from('bonus_transactions').insert({
          user_id: bk.user_id, amount: 200, type: 'purchase_bonus',
          description: `🛒 +200 шаров за заказ ${ballsPlayed} шаров (до ${endOfMonth.toLocaleDateString('ru-RU')})`,
          expires_at: endOfMonth.toISOString(), booking_id: bk.id,
        });
        await notify(bk.user_id, 'bonus', '🎁 Бонус за большой заказ!', `Вы получили +200 бонусных шаров за заказ ${ballsPlayed} шаров. Используйте до конца месяца!`);
      }

      // Бонус за день рождения (только если играет в ДР)
      if (user.birth_date) {
        const bd = new Date(user.birth_date);
        const gameDate = new Date(bk.game_date + 'T12:00:00');
        const isBirthday = bd.getMonth() === gameDate.getMonth() && bd.getDate() === gameDate.getDate();
        const currentYear = new Date().getFullYear();
        if (isBirthday && (user.birthday_game_bonus_year || 0) < currentYear) {
          bonusGain += 100;
          await supabase.from('bonus_transactions').insert({
            user_id: bk.user_id, amount: 100, type: 'birthday_game',
            description: `🎂 +100 шаров за игру в день рождения!`,
            booking_id: bk.id,
          });
          await notify(bk.user_id, 'birthday', '🎂 С Днём Рождения!', 'Вам начислено +100 бонусных шаров за игру в день рождения! 🎉');
          upd.birthday_game_bonus_year = currentYear;
          await supabase.from('users').update({ birthday_game_bonus_year: currentYear }).eq('id', bk.user_id);
        }
      }

      // Стрик бонус (3+ дней подряд)
      if (newStreak >= 3 && newStreak % 3 === 0) {
        bonusGain += 30;
        await supabase.from('bonus_transactions').insert({
          user_id: bk.user_id, amount: 30, type: 'streak',
          description: `🔥 Серия ${newStreak} дней! +30 бонусных шаров`,
        });
        await notify(bk.user_id, 'streak', `🔥 Серия ${newStreak} дней!`, `Вы играете ${newStreak} дней подряд! +30 бонусных шаров в награду.`);
      }

      await supabase.from('users').update({
        total_balls: newTotalBalls,
        total_games: newTotalGames,
        bonus_balls: (user.bonus_balls || 0) + bonusGain,
        xp: newXP,
        level: newLevel.key,
        total_spent: newSpent,
        last_game_date: today,
        streak_days: newStreak,
      }).eq('id', bk.user_id);

      // Уведомление о повышении уровня
      if (newLevel.key !== oldLevel.key) {
        await notify(bk.user_id, 'level_up', `🎉 Новый уровень — ${newLevel.name}!`,
          `Поздравляем! Вы достигли уровня ${newLevel.emoji} ${newLevel.name}. ${newLevel.perks.join(', ')}.`);
      }

      // Реферальный бонус: если это первая игра приглашённого → дать XP рефереру
      const { data: referral } = await supabase.from('referrals')
        .select('*').eq('referred_id', bk.user_id).eq('status', 'pending').single();
      if (referral && newTotalGames === 1) {
        const { data: referrer } = await supabase.from('users').select('*').eq('id', referral.referrer_id).single();
        if (referrer) {
          const refXPBonus = 200; // XP рефереру за друга
          const refBallBonus = getLevel(referrer.xp || 0).key === 'pro' ? 100 : 50; // шары рефереру
          const newRefXP = (referrer.xp || 0) + refXPBonus;
          const newRefLevel = getLevel(newRefXP);
          const oldRefLevel = getLevel(referrer.xp || 0);

          await supabase.from('users').update({
            xp: newRefXP,
            level: newRefLevel.key,
            bonus_balls: (referrer.bonus_balls || 0) + refBallBonus,
          }).eq('id', referral.referrer_id);

          await supabase.from('bonus_transactions').insert({
            user_id: referral.referrer_id, amount: refBallBonus, type: 'referral_bonus',
            description: `👥 +${refBallBonus} шаров — ваш друг сыграл первую игру!`,
          });
          await supabase.from('referrals').update({ status: 'activated', bonus_given: true, activated_at: new Date().toISOString() }).eq('id', referral.id);

          await notify(referral.referrer_id, 'referral_played', '👥 Ваш друг сыграл!',
            `Ваш приглашённый друг сыграл первую игру. Вы получили +${refBallBonus} бонусных шаров и +${refXPBonus} XP!`);

          if (newRefLevel.key !== oldRefLevel.key) {
            await notify(referral.referrer_id, 'level_up', `🎉 Новый уровень — ${newRefLevel.name}!`,
              `Благодаря рефералу вы достигли уровня ${newRefLevel.emoji} ${newRefLevel.name}!`);
          }
        }
      }
    }
  }

  // Уведомление пользователю об изменении статуса
  if (bk.user_id) {
    const msgs: Record<string, [string, string]> = {
      confirmed: ['✅ Бронь подтверждена!', `Ваша бронь #${bk.booking_number} подтверждена. Ждём вас!`],
      cancelled: ['❌ Бронь отменена', `Бронь #${bk.booking_number} отменена. Свяжитесь с нами по вопросам.`],
      completed: ['🏁 Игра завершена!', `Спасибо за игру! Ваши шары и XP начислены в профиль.`],
    };
    if (msgs[status]) {
      await notify(bk.user_id, `booking_${status}`, msgs[status][0], msgs[status][1]);
    }
  }

  await supabase.from('booking_logs').insert({
    booking_id: params.id, event_type: 'status_changed',
    new_value: status, description: admin_comment || status, performed_by: admin.login,
  });

  notifyStatusChange(bk, status).catch(console.error);
  return NextResponse.json(bk);
}
