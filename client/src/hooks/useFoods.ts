import { useState, useEffect, useCallback } from 'react';
import type { FoodItem, FoodFormData } from '../types';
import * as api from '../api';

export function useFoods() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFoods();
      // Sort by expiration date (nearest first)
      data.sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
      setFoods(data);
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst potraviny');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const add = async (data: FoodFormData) => {
    const created = await api.addFood(data);
    setFoods(prev => [...prev, created].sort((a, b) => a.expirationDate.localeCompare(b.expirationDate)));
    return created;
  };

  const update = async (id: string, data: Partial<FoodFormData>) => {
    const updated = await api.updateFood(id, data);
    setFoods(prev =>
      prev.map(f => (f.id === id ? updated : f)).sort((a, b) => a.expirationDate.localeCompare(b.expirationDate))
    );
    return updated;
  };

  const remove = async (id: string) => {
    await api.deleteFood(id);
    setFoods(prev => prev.filter(f => f.id !== id));
  };

  return { foods, loading, error, add, update, remove, refresh: fetchFoods };
}
