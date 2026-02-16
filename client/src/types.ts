export interface FoodItem {
  id: string;
  name: string;
  addedDate: string;
  expirationDate: string;
}

export interface Settings {
  notifyDaysBefore: number;
}

export type FoodFormData = Omit<FoodItem, 'id'>;
