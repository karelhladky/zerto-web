import { useState } from 'react';
import type { FoodItem } from '../types';
import * as api from '../api';
import BarcodeScanner from './BarcodeScanner';

interface FoodFormProps {
  initialData?: FoodItem;
  onSubmit: (data: { name: string; addedDate: string; expirationDate: string }) => Promise<void>;
  onCancel: () => void;
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

export default function FoodForm({ initialData, onSubmit, onCancel }: FoodFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [addedDate, setAddedDate] = useState(initialData?.addedDate ?? todayString());
  const [expirationDate, setExpirationDate] = useState(initialData?.expirationDate ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Zadej název potraviny');
      return;
    }
    if (!expirationDate) {
      setError('Zadej datum expirace');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ name: name.trim(), addedDate, expirationDate });
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se uložit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBarcodeScan = async (barcode: string) => {
    setScanning(false);
    setLookingUp(true);
    setError(null);

    try {
      const product = await api.lookupBarcode(barcode);
      setName(product.name);
    } catch {
      setError(`Produkt s kódem ${barcode} nebyl nalezen. Zadej název ručně.`);
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <>
      <form className="food-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">Název potraviny</label>
          <div className="input-with-scan">
            <input
              id="name"
              type="text"
              value={lookingUp ? 'Hledám produkt...' : name}
              onChange={e => setName(e.target.value)}
              placeholder="např. Mléko, Jogurt, Šunka..."
              autoFocus
              autoComplete="off"
              disabled={lookingUp}
            />
            <button
              type="button"
              className="scan-btn"
              onClick={() => setScanning(true)}
              disabled={lookingUp || submitting}
              aria-label="Skenovat čárový kód"
              title="Skenovat čárový kód"
            >
              {lookingUp ? (
                <div className="spinner-small" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="16" x2="17" y2="16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="addedDate">Datum vložení</label>
          <input
            id="addedDate"
            type="date"
            value={addedDate}
            onChange={e => setAddedDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="expirationDate">Datum expirace</label>
          <input
            id="expirationDate"
            type="date"
            value={expirationDate}
            onChange={e => setExpirationDate(e.target.value)}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Zrušit
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || lookingUp}>
            {submitting ? 'Ukládám...' : initialData ? 'Uložit změny' : 'Přidat'}
          </button>
        </div>
      </form>

      {scanning && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}
