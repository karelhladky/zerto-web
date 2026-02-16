import { useState } from 'react';
import type { FoodItem as FoodItemType } from '../types';

interface FoodItemProps {
  food: FoodItemType;
  onEdit: (food: FoodItemType) => void;
  onDelete: (id: string) => void;
}

function getDaysUntilExpiration(expirationDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDate);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusClass(days: number): string {
  if (days < 0) return 'expired';
  if (days <= 1) return 'critical';
  if (days <= 3) return 'warning';
  return 'ok';
}

function getStatusLabel(days: number): string {
  if (days < 0) return `Prošlo ${Math.abs(days)} ${Math.abs(days) === 1 ? 'den' : Math.abs(days) < 5 ? 'dny' : 'dní'}`;
  if (days === 0) return 'Dnes vyprší!';
  if (days === 1) return 'Zítra vyprší';
  return `Za ${days} ${days < 5 ? 'dny' : 'dní'}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
}

export default function FoodItem({ food, onEdit, onDelete }: FoodItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const days = getDaysUntilExpiration(food.expirationDate);
  const status = getStatusClass(days);
  const label = getStatusLabel(days);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(food.id);
    } else {
      setConfirmDelete(true);
      // Auto-reset po 3 sekundách
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className={`food-item food-item--${status}`}>
      <div className="food-item-main" onClick={() => onEdit(food)}>
        <div className="food-item-name">{food.name}</div>
        <div className="food-item-meta">
          <span className="food-item-date">Vloženo: {formatDate(food.addedDate)}</span>
          <span className="food-item-separator">·</span>
          <span className="food-item-exp">Expirace: {formatDate(food.expirationDate)}</span>
        </div>
        <div className={`food-item-badge food-item-badge--${status}`}>
          {label}
        </div>
      </div>
      <button
        className={`food-item-delete ${confirmDelete ? 'food-item-delete--confirm' : ''}`}
        onClick={handleDeleteClick}
        aria-label={confirmDelete ? `Potvrdit smazání ${food.name}` : `Smazat ${food.name}`}
      >
        {confirmDelete ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </button>
    </div>
  );
}
