import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import {
  getFoods,
  addFood,
  updateFood,
  deleteFood,
  getSettings,
  updateSettings,
  addSubscription,
  type FoodItem,
} from './storage.js';
import { getVapidPublicKey, initializePush } from './push.js';
import { startScheduler } from './scheduler.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Foods API ---

app.get('/api/foods', async (_req, res) => {
  try {
    const foods = await getFoods();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
});

app.post('/api/foods', async (req, res) => {
  try {
    const { name, addedDate, expirationDate } = req.body;

    if (!name || !expirationDate) {
      res.status(400).json({ error: 'Name and expirationDate are required' });
      return;
    }

    const food: FoodItem = {
      id: nanoid(),
      name,
      addedDate: addedDate || new Date().toISOString().split('T')[0],
      expirationDate,
    };

    const created = await addFood(food);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add food' });
  }
});

app.put('/api/foods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, addedDate, expirationDate } = req.body;

    const updated = await updateFood(id, { name, addedDate, expirationDate });
    if (!updated) {
      res.status(404).json({ error: 'Food not found' });
      return;
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update food' });
  }
});

app.delete('/api/foods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteFood(id);

    if (!deleted) {
      res.status(404).json({ error: 'Food not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete food' });
  }
});

// --- Settings API ---

app.get('/api/settings', async (_req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { notifyDaysBefore } = req.body;

    if (notifyDaysBefore !== undefined && (typeof notifyDaysBefore !== 'number' || notifyDaysBefore < 1)) {
      res.status(400).json({ error: 'notifyDaysBefore must be a positive number' });
      return;
    }

    const updated = await updateSettings({ notifyDaysBefore });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// --- Push API ---

app.get('/api/push/vapid-public-key', (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    res.status(503).json({ error: 'Push notifications not configured. Run: npm run generate-vapid' });
    return;
  }
  res.json({ publicKey: key });
});

app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription data' });
      return;
    }

    await addSubscription({ endpoint, keys });
    res.status(201).json({ message: 'Subscribed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// --- Barcode Lookup API (Open Food Facts) ---

app.get('/api/barcode/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_cs,product_name_en,brands`
    );

    if (!response.ok) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const product = data.product;
    // Prefer Czech name, then generic name, then English
    const name = product.product_name_cs || product.product_name || product.product_name_en || '';
    const brand = product.brands || '';

    const fullName = brand && name ? `${name} (${brand})` : name || brand || '';

    if (!fullName) {
      res.status(404).json({ error: 'Product name not available' });
      return;
    }

    res.json({ name: fullName, barcode: code });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
});

// --- Start server ---

async function start() {
  initializePush();
  startScheduler();

  app.listen(PORT, () => {
    console.log(`🧊 ZerTo server running on http://localhost:${PORT}`);
  });
}

start();
