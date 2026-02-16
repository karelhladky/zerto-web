import { useState, useEffect } from 'react';
import * as api from '../api';

interface SettingsProps {
  onBack: () => void;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as any).standalone === true);
}

export default function Settings({ onBack: _onBack }: SettingsProps) {
  const [notifyDays, setNotifyDays] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported] = useState('serviceWorker' in navigator && 'PushManager' in window);
  const [swReady, setSwReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const settings = await api.getSettings();
        setNotifyDays(settings.notifyDaysBefore);

        if (pushSupported) {
          // Check if SW is registered (with timeout)
          const reg = await Promise.race([
            navigator.serviceWorker.getRegistration(),
            new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 3000)),
          ]);

          if (reg) {
            setSwReady(true);
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

  const showMessage = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveDays = async () => {
    try {
      setSaving(true);
      await api.updateSettings({ notifyDaysBefore: notifyDays });
      showMessage('Uloženo!');
    } catch {
      showMessage('Nepodařilo se uložit', true);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePush = async () => {
    setSubscribing(true);
    try {
      if (pushEnabled) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) await sub.unsubscribe();
        }
        setPushEnabled(false);
        showMessage('Notifikace vypnuty');
      } else {
        // Wait for SW to be ready (with timeout)
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Service Worker se nepodařilo načíst. Zkus obnovit stránku.')), 5000)
          ),
        ]);

        if (!reg) throw new Error('Service Worker není dostupný');

        const { publicKey } = await api.getVapidPublicKey();

        const sub = await (reg as ServiceWorkerRegistration).pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await api.subscribePush(sub.toJSON());
        setPushEnabled(true);
        showMessage('Notifikace zapnuty!');
      }
    } catch (err: any) {
      const msg = err?.message || String(err);

      if (msg.includes('permission') || msg.includes('denied')) {
        showMessage('Notifikace jsou v prohlížeči zablokované. Povol je v nastavení.', true);
      } else {
        showMessage('Chyba: ' + msg, true);
      }
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return <div className="empty-state"><div className="spinner" /><p>Načítám...</p></div>;
  }

  const showIosHint = isIos() && !isStandalone();

  return (
    <div className="settings">
      {message && (
        <div className={isError ? 'form-error' : 'form-success'}>{message}</div>
      )}

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

        {showIosHint && (
          <div className="settings-ios-hint">
            Pro push notifikace na iPhonu je potřeba přidat aplikaci na plochu:
            klikni na <strong>Sdílet</strong> (ikona se šipkou) a pak <strong>Přidat na plochu</strong>.
          </div>
        )}

        {pushSupported && swReady ? (
          <div className="settings-row">
            <span>{pushEnabled ? 'Zapnuto' : 'Vypnuto'}</span>
            <button
              className={`btn ${pushEnabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleTogglePush}
              disabled={subscribing}
            >
              {subscribing ? 'Zpracovávám...' : pushEnabled ? 'Vypnout' : 'Zapnout'}
            </button>
          </div>
        ) : pushSupported && !swReady ? (
          <p className="settings-note">
            Service Worker se zatím nenačetl. Zkus obnovit stránku.
          </p>
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
