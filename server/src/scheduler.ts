import cron from 'node-cron';
import { getFoods, getSettings } from './storage.js';
import { sendPushNotification } from './push.js';

function getDaysUntilExpiration(expirationDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expDate = new Date(expirationDate);
  expDate.setHours(0, 0, 0, 0);
  const diffMs = expDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function checkExpirations(): Promise<void> {
  try {
    const [foods, settings] = await Promise.all([getFoods(), getSettings()]);
    const threshold = settings.notifyDaysBefore;

    const expiringItems = foods.filter(food => {
      const days = getDaysUntilExpiration(food.expirationDate);
      return days >= 0 && days <= threshold;
    });

    const expiredItems = foods.filter(food => {
      const days = getDaysUntilExpiration(food.expirationDate);
      return days < 0;
    });

    if (expiredItems.length > 0) {
      const names = expiredItems.map(f => f.name).join(', ');
      await sendPushNotification(
        '🚨 Prošlé potraviny!',
        `Tyto potraviny už expirovali: ${names}`
      );
    }

    if (expiringItems.length > 0) {
      const lines = expiringItems.map(f => {
        const days = getDaysUntilExpiration(f.expirationDate);
        return days === 0
          ? `${f.name} — dnes!`
          : `${f.name} — za ${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'}`;
      });

      await sendPushNotification(
        '⏰ Blížící se expirace',
        lines.join('\n')
      );
    }

    if (expiringItems.length === 0 && expiredItems.length === 0) {
      console.log(`[Scheduler] No expiring items found (threshold: ${threshold} days)`);
    }
  } catch (error) {
    console.error('[Scheduler] Error checking expirations:', error);
  }
}

export function startScheduler(): void {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('[Scheduler] Running daily expiration check...');
    checkExpirations();
  });

  console.log('📅 Scheduler started (daily at 9:00 AM)');
}
