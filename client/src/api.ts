import type { FoodItem, FoodFormData, Settings } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Foods
export const getFoods = () => request<FoodItem[]>('/foods');

export const addFood = (data: FoodFormData) =>
  request<FoodItem>('/foods', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateFood = (id: string, data: Partial<FoodFormData>) =>
  request<FoodItem>(`/foods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteFood = (id: string) =>
  request<void>(`/foods/${id}`, { method: 'DELETE' });

// Settings
export const getSettings = () => request<Settings>('/settings');

export const updateSettings = (data: Partial<Settings>) =>
  request<Settings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

// Barcode lookup
export const lookupBarcode = (code: string) =>
  request<{ name: string; barcode: string }>(`/barcode/${encodeURIComponent(code)}`);

// Push
export const getVapidPublicKey = () =>
  request<{ publicKey: string }>('/push/vapid-public-key');

export const subscribePush = (subscription: PushSubscriptionJSON) =>
  request<void>('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
