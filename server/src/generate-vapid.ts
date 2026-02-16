import webpush from 'web-push';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vapidKeys = webpush.generateVAPIDKeys();

const config = {
  publicKey: vapidKeys.publicKey,
  privateKey: vapidKeys.privateKey,
  subject: 'mailto:hladky.karel@gmail.com',
};

const filePath = path.join(__dirname, '..', 'data', 'vapid.json');

writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');

console.log('✅ VAPID keys generated and saved to data/vapid.json');
console.log(`   Public key: ${config.publicKey}`);
