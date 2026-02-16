import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FOODS_FILE = path.join(DATA_DIR, 'foods.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

export interface FoodItem {
  id: string;
  name: string;
  addedDate: string;
  expirationDate: string;
}

export interface Settings {
  notifyDaysBefore: number;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const DEFAULT_SETTINGS: Settings = {
  notifyDaysBefore: 3,
};

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  try {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Foods CRUD
export async function getFoods(): Promise<FoodItem[]> {
  return readJsonFile<FoodItem[]>(FOODS_FILE, []);
}

export async function addFood(food: FoodItem): Promise<FoodItem> {
  const foods = await getFoods();
  foods.push(food);
  await writeJsonFile(FOODS_FILE, foods);
  return food;
}

export async function updateFood(id: string, updates: Partial<Omit<FoodItem, 'id'>>): Promise<FoodItem | null> {
  const foods = await getFoods();
  const index = foods.findIndex(f => f.id === id);
  if (index === -1) return null;

  foods[index] = { ...foods[index], ...updates };
  await writeJsonFile(FOODS_FILE, foods);
  return foods[index];
}

export async function deleteFood(id: string): Promise<boolean> {
  const foods = await getFoods();
  const filtered = foods.filter(f => f.id !== id);
  if (filtered.length === foods.length) return false;

  await writeJsonFile(FOODS_FILE, filtered);
  return true;
}

// Settings
export async function getSettings(): Promise<Settings> {
  return readJsonFile<Settings>(SETTINGS_FILE, DEFAULT_SETTINGS);
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await writeJsonFile(SETTINGS_FILE, updated);
  return updated;
}

// Push subscriptions
export async function getSubscriptions(): Promise<PushSubscriptionData[]> {
  return readJsonFile<PushSubscriptionData[]>(SUBSCRIPTIONS_FILE, []);
}

export async function addSubscription(sub: PushSubscriptionData): Promise<void> {
  const subs = await getSubscriptions();
  const exists = subs.some(s => s.endpoint === sub.endpoint);
  if (!exists) {
    subs.push(sub);
    await writeJsonFile(SUBSCRIPTIONS_FILE, subs);
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const subs = await getSubscriptions();
  const filtered = subs.filter(s => s.endpoint !== endpoint);
  await writeJsonFile(SUBSCRIPTIONS_FILE, filtered);
}
