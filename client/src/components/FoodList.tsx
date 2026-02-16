import type { FoodItem as FoodItemType } from '../types';
import FoodItem from './FoodItem';

interface FoodListProps {
  foods: FoodItemType[];
  loading: boolean;
  error: string | null;
  onEdit: (food: FoodItemType) => void;
  onDelete: (id: string) => void;
}

export default function FoodList({ foods, loading, error, onEdit, onDelete }: FoodListProps) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" />
        <p>Načítám...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (foods.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🧊</div>
        <p>Lednice je prázdná</p>
        <p className="empty-state-hint">Klikni na + pro přidání potraviny</p>
      </div>
    );
  }

  return (
    <div className="food-list">
      {foods.map(food => (
        <FoodItem
          key={food.id}
          food={food}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
