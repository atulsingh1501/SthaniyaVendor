import { useEffect, useRef, useState } from 'react';
import Quagga from '@ericblade/quagga2';
import { X, Scan } from 'lucide-react';
import './BarcodeScanner.css';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const detected = useRef(false);

  useEffect(() => {
    if (!scannerRef.current) return;
    detected.current = false;
    setScanning(true);

    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: { facingMode: 'environment', width: 640, height: 480 },
        },
        decoder: {
          readers: [
            'ean_reader', 'ean_8_reader', 'code_128_reader',
            'code_39_reader', 'upc_reader', 'upc_e_reader',
          ],
        },
        locate: true,
      },
      (err: any) => {
        if (err) {
          setError('Camera access denied or not available.');
          setScanning(false);
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((result: any) => {
      if (detected.current) return;
      const code = result?.codeResult?.code;
      if (code) {
        detected.current = true;
        Quagga.stop();
        onDetected(code);
      }
    });

    return () => {
      Quagga.offDetected();
      try { Quagga.stop(); } catch {}
    };
  }, [onDetected]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-top">
          <div className="scanner-title"><Scan size={18} /> Scan Barcode</div>
          <button className="scanner-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error ? (
          <div className="scanner-error">
            <p>{error}</p>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="scanner-viewport" ref={scannerRef} />
            <div className="scanner-hint">
              {scanning ? 'Point camera at a barcode…' : 'Starting camera…'}
            </div>
            <div className="scanner-line" />
          </>
        )}
      </div>
    </div>
  );
}
