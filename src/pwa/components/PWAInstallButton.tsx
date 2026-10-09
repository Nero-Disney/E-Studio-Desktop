import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition shadow-xs ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
        }`}
        title="Installer l'application sur cet appareil (PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{compact ? 'Installer' : 'Installer l\'App PWA'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition shadow-2xs ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'
          }`}
          title="Installer sur iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-slate-500" />
          <span>{compact ? 'Installer iOS' : 'Installer sur iPhone/iPad'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-slate-900 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900">Installation sur iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <p>Dans la barre d'outils inférieure de Safari, touchez l'icône <strong>Partager</strong> (rectangle avec flèche vers le haut).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <p>Faites défiler la liste vers le bas et appuyez sur <strong>Sur l'écran d'accueil</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <p>Touchez <strong>Ajouter</strong> en haut à droite. L'application apparaîtra comme une app native sans barre de navigation.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
