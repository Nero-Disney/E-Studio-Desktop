import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Zap, ZapOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CameraBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isActive: boolean;
}

// Audio beep synthesizer using Web Audio API for zero-dependency instant feedback
function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch crisp retail beep (A6)
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {}
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  onScan,
  onClose,
  isActive,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [isBarcodeDetectorSupported, setIsBarcodeDetectorSupported] = useState(false);

  // Check BarcodeDetector API support
  useEffect(() => {
    setIsBarcodeDetectorSupported('BarcodeDetector' in window);
  }, []);

  // Initialize and stop camera stream
  useEffect(() => {
    if (!isActive) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isActive, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasPermission(true);

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
        setTorchAvailable(!!capabilities.torch);
      }

      // Start detection loop
      startScanningLoop();
    } catch (err: unknown) {
      console.warn('Camera access error:', err);
      setHasPermission(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        setErrorMessage('Accès caméra refusé. Veuillez autoriser la caméra dans les paramètres de votre navigateur.');
      } else {
        setErrorMessage('Impossible d\'activer la caméra. Vérifiez qu\'aucune autre application ne l\'utilise.');
      }
    }
  };

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && torchAvailable) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch toggle error:', e);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Continuous scanning loop using native BarcodeDetector if available
  const startScanningLoop = () => {
    if (typeof window === 'undefined') return;

    let detector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        // Support all retail barcode standards
        detector = new (window as any).BarcodeDetector({
          formats: [
            'ean_13',
            'ean_8',
            'code_128',
            'code_39',
            'qr_code',
            'upc_a',
            'upc_e',
            'data_matrix',
            'itf',
          ],
        });
      } catch (e) {
        detector = null;
      }
    }

    let lastScannedValue = '';
    let lastScannedTime = 0;

    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      if (detector) {
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawValue = barcodes[0].rawValue?.trim();
            const now = Date.now();

            // Prevent rapid-fire duplicate scans of the exact same barcode within 1.5s
            if (rawValue && (rawValue !== lastScannedValue || now - lastScannedTime > 1500)) {
              lastScannedValue = rawValue;
              lastScannedTime = now;

              setLastDetected(rawValue);
              playScanBeep();
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate(80);
                } catch {}
              }

              onScan(rawValue);
              setTimeout(() => setLastDetected(null), 1200);
            }
          }
        } catch (e) {
          // ignore detection frame errors
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  };

  if (!isActive) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500 shadow-2xl animate-in zoom-in-95">
      {/* Top Scanner Header */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-bold text-white tracking-wide uppercase drop-shadow-md">
            Caméra Scanner Active
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {torchAvailable && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-xl backdrop-blur-md transition ${
                torchOn ? 'bg-amber-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              title="Allumer le flash / torche"
            >
              {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={toggleCameraFacing}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition"
            title="Changer de caméra (avant/arrière)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition"
            title="Fermer le scanner caméra"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video sm:aspect-[4/3] w-full max-h-[260px] bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="w-full h-full object-cover"
        />

        {/* Viewfinder Target Overlay Frame */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
          <div className="relative w-4/5 h-3/5 border-2 border-indigo-400/70 rounded-xl shadow-lg overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400" />

            {/* Red Laser scan line animation */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-bounce" />
          </div>
        </div>

        {/* Success toast when code is read */}
        {lastDetected && (
          <div className="absolute bottom-3 inset-x-4 z-30 bg-emerald-600/95 text-white font-mono font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Code Scanné : {lastDetected}</span>
          </div>
        )}

        {/* Error overlay if camera is denied */}
        {errorMessage && (
          <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center z-30 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <div className="text-sm font-bold text-white">Problème de caméra</div>
            <p className="text-xs text-slate-300 max-w-xs">{errorMessage}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-500 transition"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>

      {/* Footer Helper */}
      <div className="p-2.5 bg-slate-950 text-center border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Placez le code-barres (EAN, Code128, QR) dans le cadre</span>
        <span className="font-mono text-indigo-400 font-bold">Autofocus actif</span>
      </div>
    </div>
  );
};
