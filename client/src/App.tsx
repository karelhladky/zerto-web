import { useState } from 'react';
import { useFoods } from './hooks/useFoods';
import Header from './components/Header';
import FoodList from './components/FoodList';
import FoodForm from './components/FoodForm';
import Settings from './components/Settings';
import type { FoodItem } from './types';

type View = 'list' | 'add' | 'edit' | 'settings';

export default function App() {
  const { foods, loading, error, add, update, remove } = useFoods();
  const [view, setView] = useState<View>('list');
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  const handleAdd = async (data: { name: string; addedDate: string; expirationDate: string }) => {
    await add(data);
    setView('list');
  };

  const handleEdit = (food: FoodItem) => {
    setEditingFood(food);
    setView('edit');
  };

  const handleUpdate = async (data: { name: string; addedDate: string; expirationDate: string }) => {
    if (editingFood) {
      await update(editingFood.id, data);
      setEditingFood(null);
      setView('list');
    }
  };

  const handleDelete = async (id: string) => {
    await remove(id);
  };

  return (
    <div className="app">
      <Header
        title={
          view === 'add' ? 'Přidat potravinu' :
          view === 'edit' ? 'Upravit potravinu' :
          view === 'settings' ? 'Nastavení' :
          'Moje lednice'
        }
        showBack={view !== 'list'}
        onBack={() => { setView('list'); setEditingFood(null); }}
        showSettings={view === 'list'}
        onSettings={() => setView('settings')}
        showAdd={view === 'list'}
        onAdd={() => setView('add')}
      />

      <main className="main">
        {view === 'list' && (
          <FoodList
            foods={foods}
            loading={loading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {view === 'add' && (
          <FoodForm
            onSubmit={handleAdd}
            onCancel={() => setView('list')}
          />
        )}

        {view === 'edit' && editingFood && (
          <FoodForm
            initialData={editingFood}
            onSubmit={handleUpdate}
            onCancel={() => { setView('list'); setEditingFood(null); }}
          />
        )}

        {view === 'settings' && (
          <Settings onBack={() => setView('list')} />
        )}
      </main>
    </div>
  );
}
