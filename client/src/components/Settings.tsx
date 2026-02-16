import { useState, useEffect } from 'react';
import * as api from '../api';

interface SettingsProps {
  onBack: () => void;
}

export default function Settings({ onBack: _onBack }: SettingsProps) {
  const [notifyDays, setNotifyDays] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported] = useState('serviceWorker' in navigator && 'PushManager' in window);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const settings = await api.getSettings();
        setNotifyDays(settings.notifyDaysBefore);

        // Check push subscription status
        if (pushSupported) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            const sub = await reg.pushManager.getSubscription();
            setPushEnabled(!!sub);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [pushSupported]);

  const handleSaveDays = async () => {
    try {
      setSaving(true);
      await api.updateSettings({ notifyDaysBefore: notifyDays });
      setMessage('Uloženo!');
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage('Nepodařilo se uložit');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePush = async () => {
    try {
      if (pushEnabled) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        }
        setPushEnabled(false);
        setMessage('Notifikace vypnuty');
      } else {
        // Subscribe
        const reg = await navigator.serviceWorker.ready;
        const { publicKey } = await api.getVapidPublicKey();

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await api.subscribePush(sub.toJSON());
        setPushEnabled(true);
        setMessage('Notifikace zapnuty!');
      }
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      setMessage('Nepodařilo se nastavit notifikace: ' + (err.message || ''));
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner" /><p>Načítám...</p></div>;
  }

  return (
    <div className="settings">
      {message && <div className="form-success">{message}</div>}

      <div className="settings-section">
        <h2>Upozornění na expiraci</h2>
        <div className="form-group">
          <label htmlFor="notifyDays">Upozornit kolik dní dopředu?</label>
          <div className="settings-row">
            <input
              id="notifyDays"
              type="number"
              min="1"
              max="30"
              value={notifyDays}
              onChange={e => setNotifyDays(parseInt(e.target.value) || 1)}
            />
            <span className="settings-unit">
              {notifyDays === 1 ? 'den' : notifyDays < 5 ? 'dny' : 'dní'}
            </span>
            <button className="btn btn-primary" onClick={handleSaveDays} disabled={saving}>
              {saving ? '...' : 'Uložit'}
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>Push notifikace</h2>
        {pushSupported ? (
          <div className="settings-row">
            <span>{pushEnabled ? 'Zapnuto' : 'Vypnuto'}</span>
            <button
              className={`btn ${pushEnabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleTogglePush}
            >
              {pushEnabled ? 'Vypnout' : 'Zapnout'}
            </button>
          </div>
        ) : (
          <p className="settings-note">Push notifikace nejsou v tomto prohlížeči podporovány.</p>
        )}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
