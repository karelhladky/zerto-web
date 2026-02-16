import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);
  const mountedRef = useRef(false);

  const handleScan = useCallback((decodedText: string) => {
    if (!scannedRef.current) {
      scannedRef.current = true;
      const scanner = scannerRef.current;
      if (scanner) {
        const state = scanner.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          scanner.stop().catch(() => {});
        }
      }
      onScan(decodedText);
    }
  }, [onScan]);

  useEffect(() => {
    // Prevent double-init from StrictMode
    if (mountedRef.current) return;
    mountedRef.current = true;

    const containerId = 'barcode-reader';
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
        },
        handleScan,
        () => {
          // ignore scan failures (no barcode in frame yet)
        }
      )
      .catch((err: Error) => {
        console.error('Scanner error:', err);
        setError('Nepodařilo se spustit kameru. Zkontroluj oprávnění.');
      });

    return () => {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        scanner.stop().catch(() => {});
      }
    };
  }, [handleScan]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <span>Naskenuj čárový kód</span>
          <button className="scanner-close" onClick={onClose} aria-label="Zavřít">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div id="barcode-reader" className="scanner-viewport" />

        {error && (
          <div className="scanner-error">
            <p>{error}</p>
            <button className="btn btn-secondary" onClick={onClose}>Zavřít</button>
          </div>
        )}

        <p className="scanner-hint">Namiř kameru na čárový kód produktu</p>
      </div>
    </div>
  );
}
