import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, CheckCircle2, Download, RefreshCw, QrCode } from 'lucide-react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  label?: string;
  sublabel?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 220,
  label,
  sublabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#0f172a', // Deep slate for sharp barcode scanning
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          console.error('Error generating QR Code:', err);
          setError('Impossible de générer le QR code');
        } else {
          setError(null);
        }
      }
    );
  }, [value, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode_appairage_pwa_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
      {/* Canvas container */}
      <div className="relative p-2 bg-white rounded-xl border border-slate-100 shadow-inner flex items-center justify-center">
        {error ? (
          <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-rose-500 font-semibold p-4">
            {error}
          </div>
        ) : (
          <canvas ref={canvasRef} className="rounded-lg max-w-full h-auto" />
        )}
      </div>

      {label && (
        <span className="font-extrabold text-xs text-slate-800 mt-2.5">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[11px] text-slate-500 max-w-xs mt-0.5">
          {sublabel}
        </span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-3 w-full justify-center">
        <button
          onClick={handleCopy}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          title="Copier l'URL d'accès"
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
          <span>{copied ? 'Copié' : 'Copier URL'}</span>
        </button>

        <button
          onClick={handleDownloadImage}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
          title="Télécharger l'image PNG du QR Code"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Image PNG</span>
        </button>
      </div>
    </div>
  );
};
