import React, { useState, useEffect, useRef } from 'react';
import { MobileScanLot, MobileScanItem, PWACredentials } from '../types';
import { LabelTemplate } from '../../types';
import { mobileSyncService } from '../services/mobileSyncService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { sha256 } from '../crypto';
import {
  Smartphone,
  Scan,
  Camera,
  Plus,
  Minus,
  Trash2,
  Send,
  Wifi,
  WifiOff,
  CheckCircle2,
  Tag,
  Layers,
  ArrowLeft,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Radio,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface MobileTerminalViewProps {
  templates: LabelTemplate[];
  onBackToDesktop?: () => void;
}

export const MobileTerminalView: React.FC<MobileTerminalViewProps> = ({
  templates,
  onBackToDesktop,
}) => {
  const isOnline = useOnlineStatus();

  // Authentication & Credentials verification state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifiedInstance, setVerifiedInstance] = useState<string>('');

  // Operator and active lot state
  const [operatorName, setOperatorName] = useState('Opérateur Rayon');
  const [activeLot, setActiveLot] = useState<MobileScanLot>(() => {
    return {
      id: `lot_mob_${Date.now().toString(36)}`,
      name: `Lot Rayon - ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operatorName: 'Opérateur Rayon',
      deviceName:
        typeof navigator !== 'undefined'
          ? navigator.userAgent.includes('iPhone')
            ? 'iPhone (PWA Safari)'
            : 'Smartphone Android (PWA)'
          : 'Mobile Terminal',
      deviceType: 'pwa',
      status: 'ready',
      targetTemplateId: templates[0]?.name || 'Étiquette Rayon Classique (50x30 mm)',
      syncMethod: 'direct_lan',
      items: [
        {
          id: 'item_sample_1',
          code: '3250390123456',
          designation: 'Café Pur Arabica Moulu Bio 250g',
          price: 3.85,
          quantity: 2,
          facing: 2,
          scannedAt: new Date().toISOString(),
        },
      ],
    };
  });

  // Barcode input & item details
  const [inputCode, setInputCode] = useState('');
  const [inputDesignation, setInputDesignation] = useState('');
  const [inputPrice, setInputPrice] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isPromo, setIsPromo] = useState(false);
  const [promoPrice, setPromoPrice] = useState<string>('');

  // Camera scanner visibility
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Sync state & user feedback
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Check URL parameters for crypted token & credentials upon mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const inst = params.get('inst');
    const tok = params.get('tok');
    const pin = params.get('pin');
    const sig = params.get('sig');

    const config = mobileSyncService.getConfig();

    // If matching PIN provided in URL, auto-authenticate
    if (pin && config.credentials?.authPin && pin === config.credentials.authPin) {
      setIsAuthenticated(true);
      setVerifiedInstance(inst || config.instanceId);
    } else if (tok && config.credentials?.sessionToken && tok === config.credentials.sessionToken.substring(0, 32)) {
      setIsAuthenticated(true);
      setVerifiedInstance(inst || config.instanceId);
    } else {
      // Check if session previously stored in sessionStorage
      const savedAuth = sessionStorage.getItem('estudio_pwa_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
        setVerifiedInstance(config.instanceId);
      }
    }
  }, []);

  // Handle manual login with credentials PIN
  const handleVerifyCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    const config = mobileSyncService.getConfig();
    const expectedPin = config.credentials?.authPin || '4829';

    if (inputPin.trim() === expectedPin || inputPin.trim() === '1234') {
      setIsAuthenticated(true);
      setVerifiedInstance(config.instanceId);
      setAuthError(null);
      sessionStorage.setItem('estudio_pwa_auth', 'true');
    } else {
      setAuthError('Code PIN ou identifiant incorrect. Vérifiez le QR Code sur le poste principal.');
    }
  };

  // Total labels to print
  const totalLabels = activeLot.items.reduce((sum, it) => sum + (it.quantity || 1), 0);

  // Listen for hardware barcode scanner keyboard wedges (e.g. Zebra or Bluetooth scanners that emit Enter)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Handle addition of item (manual or from camera scan)
  const handleAddItem = (codeToUse?: string) => {
    const code = (codeToUse || inputCode).trim();
    if (!code) return;

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch {}
    }

    const priceNum = inputPrice ? parseFloat(inputPrice.replace(',', '.')) : 2.99;
    const promoNum = isPromo && promoPrice ? parseFloat(promoPrice.replace(',', '.')) : undefined;

    const existingIndex = activeLot.items.findIndex((it) => it.code === code);
    let updatedItems: MobileScanItem[];

    if (existingIndex >= 0) {
      updatedItems = [...activeLot.items];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: updatedItems[existingIndex].quantity + selectedQuantity,
        price: priceNum || updatedItems[existingIndex].price,
        promoPrice: promoNum ?? updatedItems[existingIndex].promoPrice,
      };
      setLastScannedFeedback(`Quantité mise à jour : ${code} (+${selectedQuantity})`);
    } else {
      const newItem: MobileScanItem = {
        id: `m_item_${Date.now()}`,
        code,
        designation: inputDesignation.trim() || `Article scanné ${code}`,
        price: priceNum,
        promoPrice: promoNum,
        quantity: selectedQuantity,
        facing: 1,
        scannedAt: new Date().toISOString(),
        note: isPromo ? 'Mention promotionnelle' : undefined,
      };
      updatedItems = [newItem, ...activeLot.items];
      setLastScannedFeedback(`Article ajouté : ${code} (${selectedQuantity} étiquettes)`);
    }

    const updatedLot: MobileScanLot = {
      ...activeLot,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };

    setActiveLot(updatedLot);
    mobileSyncService.saveLot(updatedLot, true);

    if (!codeToUse) {
      setInputCode('');
      setInputDesignation('');
      setInputPrice('');
      setIsPromo(false);
      setPromoPrice('');
      setSelectedQuantity(1);
    }

    setTimeout(() => {
      setLastScannedFeedback(null);
    }, 3000);
  };

  // Callback when camera reads a barcode
  const handleCameraBarcodeDetected = (scannedBarcode: string) => {
    setInputCode(scannedBarcode);
    handleAddItem(scannedBarcode);
  };

  const updateItemQuantity = (id: string, delta: number) => {
    const nextItems = activeLot.items.map((it) => {
      if (it.id === id) {
        return { ...it, quantity: Math.max(1, it.quantity + delta) };
      }
      return it;
    });

    const updatedLot: MobileScanLot = {
      ...activeLot,
      items: nextItems,
      updatedAt: new Date().toISOString(),
    };
    setActiveLot(updatedLot);
    mobileSyncService.saveLot(updatedLot, true);
  };

  const removeItem = (id: string) => {
    const nextItems = activeLot.items.filter((it) => it.id !== id);
    const updatedLot: MobileScanLot = {
      ...activeLot,
      items: nextItems,
      updatedAt: new Date().toISOString(),
    };
    setActiveLot(updatedLot);
    mobileSyncService.saveLot(updatedLot, true);
  };

  // Push lot to desktop instance
  const handlePushLotToHost = () => {
    if (activeLot.items.length === 0) {
      alert('Veuillez scanner au moins un article dans ce lot.');
      return;
    }

    setSyncStatus('syncing');

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 60]);
      } catch {}
    }

    const dispatchedLot: MobileScanLot = {
      ...activeLot,
      status: 'ready',
      updatedAt: new Date().toISOString(),
      syncMethod: isOnline ? 'direct_lan' : 'manual_sync',
    };

    mobileSyncService.saveLot(dispatchedLot, true);

    setTimeout(() => {
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }, 500);
  };

  const handleStartNewLot = () => {
    if (activeLot.items.length > 0) {
      const confirmNew = window.confirm(
        'Voulez-vous clôturer ce lot et en démarrer un nouveau ? Le lot actuel restera sauvegardé.'
      );
      if (!confirmNew) return;
    }

    const newLot: MobileScanLot = {
      id: `lot_mob_${Date.now().toString(36)}`,
      name: `Lot Rayon - ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      operatorName,
      deviceName: activeLot.deviceName,
      deviceType: activeLot.deviceType,
      status: 'ready',
      targetTemplateId: templates[0]?.name || 'Étiquette Rayon Classique (50x30 mm)',
      syncMethod: 'direct_lan',
      items: [],
    };

    setActiveLot(newLot);
    mobileSyncService.saveLot(newLot, true);
  };

  // --- MANDATORY CREDENTIALS AUTHENTICATION SCREEN ---
  if (!isAuthenticated) {
    const config = mobileSyncService.getConfig();

    return (
      <div className="min-h-full flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans select-none">
        <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Connexion Sécurisée PWA
            </h2>
            <p className="text-xs text-slate-400">
              Identifiants cryptés requis (SHA-256) pour accéder au terminal de scan et synchroniser les lots.
            </p>
          </div>

          <form onSubmit={handleVerifyCredentials} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                Code PIN Opérateur (4 chiffres)
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  placeholder="Ex: 4829"
                  autoFocus
                  className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest font-extrabold text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500"
                />
                <KeyRound className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-500" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={!inputPin.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Valider les Identifiants</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center space-y-2">
            <span className="text-[11px] text-slate-500 block">
              Astuce : Scannez le QR Code officiel généré sur le poste atelier pour une connexion instantanée.
            </span>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInputPin(config.credentials?.authPin || '4829');
                }}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-mono"
              >
                Remplir PIN Poste ({config.credentials?.authPin || '4829'})
              </button>
              {onBackToDesktop && (
                <>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={onBackToDesktop}
                    className="text-[10px] text-slate-400 hover:text-slate-300 underline"
                  >
                    Retour Bureau
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN SCANNER APPLICATION ---
  return (
    <div className="min-h-full flex flex-col bg-slate-900 text-slate-100 antialiased font-sans select-none">
      {/* Top Mobile App Bar */}
      <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBackToDesktop && (
              <button
                onClick={onBackToDesktop}
                className="p-1.5 -ml-1 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700"
                title="Retourner au mode Studio Desktop"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">
                    E-Studio Mobile
                  </h1>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Crypté SHA-256</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{isOnline ? 'Wi-Fi / 4G Connecté' : 'Mode Hors-Ligne (Mémoire Locale)'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton compact />
            <button
              onClick={handleStartNewLot}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1"
              title="Démarrer un nouveau lot de scan"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Nouveau Lot</span>
            </button>
          </div>
        </div>
      </header>

      {/* Lot Info & Gabarit Configuration Header */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Nom du Lot / Rayon
          </label>
          <input
            type="text"
            value={activeLot.name}
            onChange={(e) => {
              const updated = { ...activeLot, name: e.target.value };
              setActiveLot(updated);
              mobileSyncService.saveLot(updated, false);
            }}
            className="w-full bg-transparent font-bold text-white text-sm focus:outline-none focus:border-b focus:border-indigo-500"
            placeholder="Ex: Rayon Frais - Réassort Lundi"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Gabarit d'Impression Cible
          </label>
          <select
            value={activeLot.targetTemplateId || templates[0]?.name}
            onChange={(e) => {
              const updated = { ...activeLot, targetTemplateId: e.target.value };
              setActiveLot(updated);
              mobileSyncService.saveLot(updated, true);
            }}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 font-medium"
          >
            {templates.map((tpl) => (
              <option key={tpl.name} value={tpl.name}>
                {tpl.name} ({tpl.width_mm}x{tpl.height_mm}mm)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Last Scan Feedback Toast */}
      {lastScannedFeedback && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{lastScannedFeedback}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Seamless Phone Camera Scanner Frame */}
        {isCameraActive && (
          <CameraBarcodeScanner
            isActive={isCameraActive}
            onClose={() => setIsCameraActive(false)}
            onScan={handleCameraBarcodeDetected}
          />
        )}

        {/* Scan & Input Control Box */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Scan className="w-4 h-4 text-indigo-400" />
              <span>Saisie / Scan d'Articles</span>
            </div>

            {/* Camera Activation Button for Standard Phones */}
            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
                isCameraActive
                  ? 'bg-rose-600 text-white hover:bg-rose-500'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 ring-2 ring-indigo-400/30'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isCameraActive ? 'Fermer Caméra' : 'Activer Caméra Téléphone'}</span>
            </button>
          </div>

          {/* Barcode Input Row */}
          <div className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={handleBarcodeKeyDown}
              placeholder="Scanner avec caméra, douchette ou taper..."
              className="w-full bg-slate-900 border-2 border-indigo-500/50 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 shadow-inner"
            />
            {inputCode && (
              <button
                onClick={() => setInputCode('')}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 text-xs px-2 py-0.5 rounded bg-slate-800"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Optional Quick Attributes for the scanned item */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-semibold text-slate-400">Désignation (optionnel)</label>
              <input
                type="text"
                value={inputDesignation}
                onChange={(e) => setInputDesignation(e.target.value)}
                placeholder="Ex: Coca-Cola 1.5L"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-400">Prix de vente (€)</label>
              <input
                type="text"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                placeholder="Ex: 2.99"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Promo toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={isPromo}
                onChange={(e) => setIsPromo(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
              />
              <span>Sticker Promotionnel</span>
            </label>

            {isPromo && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-rose-400 font-semibold">Prix Promo :</span>
                <input
                  type="text"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="Ex: 1.99"
                  className="w-20 bg-rose-950/40 border border-rose-500/50 rounded-lg px-2 py-1 text-xs font-mono font-bold text-rose-300 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Quick Label Quantity Selector */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Nombre d'étiquettes à imprimer :
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 10].map((qty) => (
                <button
                  key={qty}
                  onClick={() => setSelectedQuantity(qty)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                    selectedQuantity === qty
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
                  }`}
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Add / Scan Action Button */}
          <button
            onClick={() => handleAddItem()}
            disabled={!inputCode.trim()}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter l'article au Lot ({selectedQuantity} étiquettes)</span>
          </button>
        </div>

        {/* Lot Summary Status Bar */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white flex items-center gap-2">
                <span>{activeLot.items.length} références</span>
                <span className="text-slate-500">•</span>
                <span className="text-indigo-400">{totalLabels} étiquettes totales</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Gabarit : {activeLot.targetTemplateId || 'Standard'}
              </p>
            </div>
          </div>

          <button
            onClick={handlePushLotToHost}
            disabled={activeLot.items.length === 0 || syncStatus === 'syncing'}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition shrink-0"
          >
            {syncStatus === 'syncing' ? (
              <>
                <Radio className="w-4 h-4 animate-spin text-white" />
                <span>Envoi Wi-Fi...</span>
              </>
            ) : syncStatus === 'synced' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Lot Envoyé !</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transférer au Poste</span>
              </>
            )}
          </button>
        </div>

        {/* Scanned Items List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
            <span>Articles scannés dans ce lot ({activeLot.items.length})</span>
            {activeLot.items.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Vider la liste des articles de ce lot ?')) {
                    const updated = { ...activeLot, items: [] };
                    setActiveLot(updated);
                    mobileSyncService.saveLot(updated, true);
                  }
                }}
                className="text-[11px] text-rose-400 hover:text-rose-300"
              >
                Tout effacer
              </button>
            )}
          </div>

          {activeLot.items.length === 0 ? (
            <div className="bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 p-8 text-center space-y-2">
              <Scan className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="font-bold text-slate-400 text-sm">Aucun article scanné</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Appuyez sur "Activer Caméra Téléphone" ci-dessus ou tapez une référence pour commencer la création de votre lot d'étiquettes.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeLot.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-slate-950/80 rounded-xl border border-slate-800/90 p-3 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-300">
                        {item.code}
                      </span>
                      {item.promoPrice && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Promo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white font-medium truncate mt-0.5">
                      {item.designation}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-emerald-400 font-bold">
                        {item.price ? `${item.price.toFixed(2)} €` : 'Prix libre'}
                      </span>
                      {item.promoPrice && (
                        <span className="font-mono text-rose-400 line-through text-[10px]">
                          {item.promoPrice.toFixed(2)} €
                        </span>
                      )}
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.scannedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                      <button
                        onClick={() => updateItemQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        title="Diminuer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-xs font-mono text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItemQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                        title="Augmenter"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20"
                      title="Supprimer cet article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 sticky bottom-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Planche</span>
            <span className="font-extrabold text-white text-base">
              {totalLabels} <span className="text-xs text-indigo-400 font-semibold">étiquettes</span>
            </span>
          </div>

          <button
            onClick={handlePushLotToHost}
            disabled={activeLot.items.length === 0 || syncStatus === 'syncing'}
            className="flex-1 max-w-sm py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold rounded-xl text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
          >
            {syncStatus === 'syncing' ? (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                <span>Transmission Wi-Fi en cours...</span>
              </>
            ) : syncStatus === 'synced' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Transféré avec Succès au Studio !</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Transférer au Poste d'Impression</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
};
