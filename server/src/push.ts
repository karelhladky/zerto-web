import webpush from 'web-push';
import { readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSubscriptions, removeSubscription } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VAPID_FILE = path.join(__dirname, '..', 'data', 'vapid.json');

interface VapidKeys {
  publicKey: string;
  privateKey: string;
  subject: string;
}

let vapidKeys: VapidKeys | null = null;

export function getVapidPublicKey(): string | null {
  return vapidKeys?.publicKey ?? null;
}

export function initializePush(): void {
  if (!existsSync(VAPID_FILE)) {
    console.warn('⚠️  VAPID keys not found. Push notifications disabled.');
    console.warn('   Run: npm run generate-vapid');
    return;
  }

  try {
    const raw = readFileSync(VAPID_FILE, 'utf-8');
    vapidKeys = JSON.parse(raw) as VapidKeys;

    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    console.log('✅ Push notifications configured');
  } catch (error) {
    console.error('❌ Failed to initialize push:', error);
  }
}

export async function sendPushNotification(title: string, body: string): Promise<void> {
  if (!vapidKeys) {
    console.warn('Push notifications not configured, skipping...');
    return;
  }

  const subscriptions = await getSubscriptions();
  const payload = JSON.stringify({ title, body });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload
        );
      } catch (error: any) {
        if (error?.statusCode === 410 || error?.statusCode === 404) {
          // Subscription expired or invalid, remove it
          await removeSubscription(sub.endpoint);
          console.log('Removed expired subscription');
        } else {
          throw error;
        }
      }
    })
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`${failed.length} push notification(s) failed`);
  }
}
