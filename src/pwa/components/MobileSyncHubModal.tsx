import React, { useState, useEffect } from 'react';
import {
  MobileScanLot,
  SyncConnectionConfig,
  NetworkConnectionMode,
  EstudioPairV2Payload,
} from '../types';
import { LabelTemplate } from '../../types';
import { mobileSyncService } from '../services/mobileSyncService';
import { QRCodeDisplay } from './QRCodeDisplay';
import {
  Smartphone,
  QrCode,
  Wifi,
  Radio,
  Printer,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  FileSpreadsheet,
  Clock,
  Send,
  X,
  Share2,
  Tag,
  Shield,
  ShieldCheck,
  Eye,
  Sliders,
  Globe,
  Lock,
  KeyRound,
  Camera,
  Server,
  Zap,
  Activity,
  Check,
  Terminal,
  BookOpen,
  Database,
} from 'lucide-react';

interface MobileSyncHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: LabelTemplate[];
  onGenerateLot: (lot: MobileScanLot) => void;
  onOpenInEditor?: (templateName: string) => void;
  onOpenMobileSimulator: () => void;
}

export const MobileSyncHubModal: React.FC<MobileSyncHubModalProps> = ({
  isOpen,
  onClose,
  templates,
  onGenerateLot,
  onOpenInEditor,
  onOpenMobileSimulator,
}) => {
  const [lots, setLots] = useState<MobileScanLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<MobileScanLot | null>(null);
  const [config, setConfig] = useState<SyncConnectionConfig>(mobileSyncService.getConfig());
  const [activeTab, setActiveTab] = useState<'pairing' | 'lots' | 'network' | 'endpoints' | 'guide'>('pairing');
  const [qrFormat, setQrFormat] = useState<'json_v2' | 'uri_scheme' | 'web_pwa'>('json_v2');

  const [pairingPayloadV2, setPairingPayloadV2] = useState<EstudioPairV2Payload | null>(null);
  const [pairingUriV2, setPairingUriV2] = useState<string>('');
  const [pairingWebUrl, setPairingWebUrl] = useState<string>('');
  const [pairingWebSignature, setPairingWebSignature] = useState<string>('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [testSimulating, setTestSimulating] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Editable station parameters
  const [editableStationId, setEditableStationId] = useState(config.instanceId || 'PC-CAISSE-01');
  const [editableStationName, setEditableStationName] = useState(config.instanceName || 'Poste Caisse Centrale');
  const [editableHostIp, setEditableHostIp] = useState(config.hostAddress || '192.168.1.45');
  const [editablePort, setEditablePort] = useState(config.port || 8080);
  const [editablePin, setEditablePin] = useState(config.credentials?.authPin || '1234');

  // Subscribe to lots updates
  useEffect(() => {
    const unsubscribe = mobileSyncService.subscribe((updatedLots) => {
      setLots(updatedLots);
      if (selectedLot) {
        const fresh = updatedLots.find((l) => l.id === selectedLot.id);
        setSelectedLot(fresh || null);
      }
    });
    return () => unsubscribe();
  }, [selectedLot]);

  // Compute pairing payloads whenever configuration changes
  useEffect(() => {
    let isMounted = true;

    // 1. JSON V2 Payload
    mobileSyncService.getPairingV2Payload().then((payload) => {
      if (isMounted) setPairingPayloadV2(payload);
    });

    // 2. URI Scheme
    mobileSyncService.getPairingV2Uri().then((uri) => {
      if (isMounted) setPairingUriV2(uri);
    });

    // 3. Web URL
    mobileSyncService.getCryptedPairingUrl(config.connectionMode).then(({ url, signature }) => {
      if (isMounted) {
        setPairingWebUrl(url);
        setPairingWebSignature(signature);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [config.connectionMode, config.credentials, config.publicHostUrl, config.hostAddress, config.port, config.instanceId]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleSaveStationSettings = () => {
    const updatedCreds = {
      ...config.credentials,
      instanceId: editableStationId,
      instanceName: editableStationName,
      authPin: editablePin,
    };
    const updated: Partial<SyncConnectionConfig> = {
      instanceId: editableStationId,
      instanceName: editableStationName,
      hostAddress: editableHostIp,
      port: Number(editablePort) || 8080,
      credentials: updatedCreds,
    };
    setConfig((prev) => ({ ...prev, ...updated }));
    mobileSyncService.saveConfig(updated);
  };

  const handleRegenerateCredentials = async () => {
    setIsRegenerating(true);
    try {
      await mobileSyncService.regenerateCredentials();
      const freshConfig = mobileSyncService.getConfig();
      setConfig(freshConfig);
      setEditablePin(freshConfig.credentials.authPin);
    } finally {
      setTimeout(() => setIsRegenerating(false), 400);
    }
  };

  const handleTestSimulateImport = async () => {
    setTestSimulating(true);
    setTestResult(null);
    try {
      const res = await mobileSyncService.simulateMobileTableImport();
      if (res.success) {
        setTestResult(`✓ Table TB-849201 reçue et intégrée avec succès (17 étiquettes)`);
        setActiveTab('lots');
      } else {
        setTestResult(`Erreur : ${res.error || 'Échec de transmission'}`);
      }
    } finally {
      setTestSimulating(false);
    }
  };

  const handleExportLots = () => {
    const bundle = mobileSyncService.exportLotsBundle();
    const blob = new Blob([bundle], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tables_scans_estudio_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const count = mobileSyncService.importLotsBundle(text);
        setImportedCount(count);
        setTimeout(() => setImportedCount(null), 4000);
      } catch (err) {
        alert("Erreur lors de l'import : " + String(err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Determine current active QR text to encode
  let currentQrCodeValue = '';
  if (qrFormat === 'json_v2' && pairingPayloadV2) {
    currentQrCodeValue = JSON.stringify(pairingPayloadV2, null, 2);
  } else if (qrFormat === 'uri_scheme') {
    currentQrCodeValue = pairingUriV2;
  } else {
    currentQrCodeValue = pairingWebUrl;
  }

  const pendingLots = lots.filter((l) => l.status === 'ready' || l.status === 'received' || l.status === 'draft');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col overflow-hidden my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Interopérabilité Desktop ⇄ Mobile</h2>
                <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Protocole v2.0
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Serveur Actif :8080
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Appairage QR Code, Découverte mDNS, Serveur REST (/handshake, /tables/import) et Live Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('pairing')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'pairing'
                ? 'bg-white text-blue-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>1. Appairage QR Code (v2.0)</span>
          </button>

          <button
            onClick={() => setActiveTab('lots')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x relative ${
              activeTab === 'lots'
                ? 'bg-white text-blue-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Tables & Lots Scannés</span>
            {pendingLots.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-blue-600 text-white font-bold">
                {pendingLots.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('endpoints')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'endpoints'
                ? 'bg-white text-blue-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. Endpoints REST & Tests</span>
          </button>

          <button
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'network'
                ? 'bg-white text-blue-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>4. Découverte mDNS & Réseau</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'guide'
                ? 'bg-white text-blue-600 border-slate-200 shadow-sm -mb-px'
                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>5. Guide App Mobile & Benchmark</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: QR CODE PAIRING */}
          {activeTab === 'pairing' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left QR Code Visual Card */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-1 bg-slate-200/70 p-1 rounded-xl mb-4 w-full text-xs">
                  <button
                    onClick={() => setQrFormat('json_v2')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all ${
                      qrFormat === 'json_v2' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    JSON v2.0
                  </button>
                  <button
                    onClick={() => setQrFormat('uri_scheme')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all ${
                      qrFormat === 'uri_scheme' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    URI Scheme
                  </button>
                  <button
                    onClick={() => setQrFormat('web_pwa')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all ${
                      qrFormat === 'web_pwa' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    PWA Web
                  </button>
                </div>

                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-3">
                  <QRCodeDisplay value={currentQrCodeValue} size={210} />
                </div>

                <p className="text-xs font-semibold text-slate-800 mb-1">
                  Pointez l'application Android vers ce QR Code
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  L'application extrait automatiquement l'adresse IP, le port, le poste cible et le token SHA-256.
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleCopy(currentQrCodeValue, 'qr_raw')}
                    className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg shadow-xs"
                  >
                    {copiedKey === 'qr_raw' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copier Payload</span>
                  </button>
                  <button
                    onClick={onOpenMobileSimulator}
                    className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Tester PWA</span>
                  </button>
                </div>
              </div>

              {/* Right Station Parameters & JSON Viewer */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Identifiants du Poste Desktop</h3>
                    </div>
                    <button
                      onClick={handleRegenerateCredentials}
                      disabled={isRegenerating}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                      <span>Renouveler Token</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">ID du Poste (stationId)</label>
                      <input
                        type="text"
                        value={editableStationId}
                        onChange={(e) => setEditableStationId(e.target.value)}
                        className="w-full px-2.5 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nom du Poste</label>
                      <input
                        type="text"
                        value={editableStationName}
                        onChange={(e) => setEditableStationName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Adresse IP Locale (Wi-Fi)</label>
                      <input
                        type="text"
                        value={editableHostIp}
                        onChange={(e) => setEditableHostIp(e.target.value)}
                        className="w-full px-2.5 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Port Serveur</label>
                      <input
                        type="number"
                        value={editablePort}
                        onChange={(e) => setEditablePort(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Code PIN Opérateur</label>
                      <input
                        type="text"
                        value={editablePin}
                        onChange={(e) => setEditablePin(e.target.value)}
                        maxLength={6}
                        className="w-full px-2.5 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold tracking-widest text-center focus:bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSaveStationSettings}
                        className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                      >
                        Appliquer Modifications
                      </button>
                    </div>
                  </div>
                </div>

                {/* Raw JSON Preview according to spec */}
                <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto relative">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      Payload JSON généré par le Desktop
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(pairingPayloadV2, null, 2), 'json_spec')}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedKey === 'json_spec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copier</span>
                    </button>
                  </div>
                  <pre>{JSON.stringify(pairingPayloadV2, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TABLES & SCAN LOTS RECEIVED */}
          {activeTab === 'lots' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tables Scannées Reçues du Mobile</h3>
                  <p className="text-xs text-slate-500">
                    Ces tables sont reçues via <code className="text-blue-600 font-mono">POST /api/v2/tables/import</code> ou le simulateur de test.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestSimulateImport}
                    disabled={testSimulating}
                    className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg shadow-xs"
                  >
                    <Zap className={`w-3.5 h-3.5 ${testSimulating ? 'animate-bounce' : ''}`} />
                    <span>Simuler Réception Table</span>
                  </button>
                  <label className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg shadow-xs cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importer JSON</span>
                    <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                  </label>
                  <button
                    onClick={handleExportLots}
                    className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{testResult}</span>
                </div>
              )}

              {lots.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                  <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Aucune table scannée reçue</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Scannez des articles sur votre terminal Android ou cliquez sur "Simuler Réception Table".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Lots List */}
                  <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {lots.map((lot) => {
                      const totalQty = lot.items.reduce((s, it) => s + (it.quantity || 1), 0);
                      const isSelected = selectedLot?.id === lot.id || (!selectedLot && lots[0].id === lot.id);

                      return (
                        <div
                          key={lot.id}
                          onClick={() => setSelectedLot(lot)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                              {lot.tableId || lot.id}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(lot.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-semibold text-xs text-slate-900 truncate">{lot.name}</div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                            <span>{lot.operatorName}</span>
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                              {totalQty} étiquettes ({lot.items.length} réf.)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Lot Details & Action */}
                  <div className="md:col-span-7 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between max-h-[420px] overflow-y-auto">
                    {(() => {
                      const current = selectedLot || lots[0];
                      if (!current) return null;
                      const totalLabels = current.items.reduce((sum, it) => sum + (it.quantity || 1), 0);

                      return (
                        <>
                          <div>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900">{current.name}</h4>
                                <p className="text-[11px] text-slate-500">
                                  Table : <span className="font-mono font-bold text-slate-700">{current.tableId || current.id}</span> | Opérateur : {current.operatorName} ({current.deviceName})
                                </p>
                              </div>
                              <button
                                onClick={() => mobileSyncService.deleteLot(current.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="Supprimer la table"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Items List */}
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {current.items.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                                >
                                  <div>
                                    <div className="font-semibold text-slate-800">{item.designation || 'Article scanné'}</div>
                                    <div className="font-mono text-[10px] text-slate-400">{item.code}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-slate-900">
                                      {item.price ? `${item.price.toFixed(2)} €` : 'Prix standard'}
                                      {item.promoPrice && (
                                        <span className="ml-1 text-red-600 font-bold">({item.promoPrice.toFixed(2)} €)</span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                                      x{item.quantity} étiquettes
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Big Generate Action Button */}
                          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs text-slate-500">Total à imprimer :</div>
                              <div className="text-base font-extrabold text-slate-900">
                                {totalLabels} étiquettes sur planche
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                onGenerateLot(current);
                                onClose();
                              }}
                              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                            >
                              <Printer className="w-4 h-4" />
                              <span>Générer la Planche d'Impression</span>
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REST ENDPOINTS & TESTS */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Serveur HTTP REST Intégré (Port :8080)</h3>
                  <p className="text-xs text-slate-500">
                    Ces routes sont prêtes à être appelées par l'application mobile Android pour l'échange bidirectionnel.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  REST API v2.0 Prête
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Route 1: Handshake */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">POST</span>
                      <span className="font-mono font-bold text-slate-900">/api/v2/handshake</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Validation d'appairage & Attribution de session</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Appelé lors du scan initial du QR code pour échanger les métadonnées et récupérer le catalogue.
                  </p>
                  <pre className="bg-slate-900 text-slate-300 p-2.5 rounded-lg text-[10px] overflow-x-auto">
{`// Requête Mobile : { deviceId, deviceName, operatorName, token, clientTimestamp }
// Réponse Desktop (200 OK) : { status: "PAIRED", stationId: "${config.instanceId}", storeName: "${config.storeName}", sessionToken: "...", availableTemplates: [...] }`}
                  </pre>
                </div>

                {/* Route 2: Tables Import */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">POST</span>
                      <span className="font-mono font-bold text-slate-900">/api/v2/tables/import</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Réception principale des tables de scans</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-2">
                    Appelé lorsque l'opérateur appuie sur "EXPORTER / SYNCHRONISER" sur le mobile.
                  </p>
                  <pre className="bg-slate-900 text-slate-300 p-2.5 rounded-lg text-[10px] overflow-x-auto">
{`// Requête Mobile : { tableId: "TB-849201", tableName: "...", items: [{ barcode, designation, quantity, regularPrice }] }
// Réponse Desktop (200 OK) : { success: true, importedTableId: "TB-849201", printJobStatus: "QUEUED" }`}
                  </pre>
                </div>

                {/* Route 3: Catalog Sync */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded text-[11px]">GET</span>
                      <span className="font-mono font-bold text-slate-900">/api/v2/catalog/sync</span>
                    </div>
                    <span className="text-[11px] text-slate-500">Téléchargement du catalogue hors-ligne</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Permet au terminal mobile de stocker les articles pour afficher instantanément libellé et prix au scan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: mDNS & NETWORK ZERO-CONF */}
          {activeTab === 'network' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Radio className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Annonceur de Découverte Réseau (mDNS & ZeroConf)</h3>
                </div>

                <p className="text-slate-600 leading-relaxed">
                  Pour que l'application Android liste automatiquement les PC allumés en magasin sans scanner de QR Code :
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="font-bold text-blue-700 mb-1">Service mDNS (Bonjour / Zeroconf)</div>
                    <div className="text-slate-600">Type : <span className="font-bold text-slate-900">_estudio-desktop._tcp.local.</span></div>
                    <div className="text-slate-600">Port : <span className="font-bold text-slate-900">8080</span></div>
                    <div className="text-slate-600">TXT : name=E-Studio Desktop, version=2.4.0</div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="font-bold text-indigo-700 mb-1">Alternative UDP Broadcast</div>
                    <div className="text-slate-600">Port UDP : <span className="font-bold text-slate-900">8081</span></div>
                    <div className="text-slate-600">Commande : <span className="font-bold text-slate-900">&#123;"cmd": "DISCOVER_ESTUDIO"&#125;</span></div>
                    <div className="text-slate-600">Réponse : IP, nom du poste et port HTTP</div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Configuration Pare-feu Windows / macOS requise :</span>
                    <p className="mt-0.5 text-amber-800">
                      Autoriser les connexions entrantes sur le port <strong>TCP 8080</strong> (HTTP REST) et <strong>UDP 8081</strong> pour le profil réseau Privé (Wi-Fi Magasin).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPANION APP IMPLEMENTATION GUIDE & BENCHMARK */}
          {activeTab === 'guide' && (
            <div className="space-y-6 text-xs text-slate-700">
              {/* Architecture Blueprint Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Guide d'Implémentation de l'Application Mobile Compagnon
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                    Spécification Protocole v2.4
                  </span>
                </div>

                <p className="leading-relaxed">
                  L'application compagnon mobile E-Studio permet aux employés de rayon et gestionnaires de stock d'effectuer des relevés de prix, des audits d'étiquetage et des réimpressions directement en rayon sans jamais bloquer le poste caisse ou le bureau administratif.
                </p>

                {/* 4-Step Technical Workflow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        1
                      </span>
                      <span>Appairage Instantané par QR Code</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      L'application mobile utilise la caméra pour scanner le QR Code affiché sur l'onglet <strong>1. Appairage Station</strong>.
                      Le payload JSON contient le token SHA-256 éphémère, l'IP locale du PC et le port. L'application enregistre ces paramètres dans son stockage sécurisé (EncryptedSharedPreferences sur Android ou Keychain sur iOS) et effectue un handshake POST sur <code>/api/v2/handshake</code>.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        2
                      </span>
                      <span>Mise en Cache Hors-Ligne (Offline-First)</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      L'application télécharge le catalogue complet (EAN, SKU, libellé, prix régulier, prix promo) via <code>GET /api/v2/catalog/sync</code> et le persiste dans une base SQLite/Room locale.
                      L'employé peut travailler dans des zones sans réseau Wi-Fi (chambres froides, réserves aveugles) avec un affichage instantané (&lt; 1 ms) des fiches articles au scan.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        3
                      </span>
                      <span>Capture Matérielle & Lots de Scans</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      L'application capture les codes-barres soit via l'optique caméra (Google ML Kit Barcode), soit via les scanners laser matériels durcis (Zebra DataWedge via Intent API, Honeywell CT40 ou Datalogic).
                      L'opérateur ajuste le nombre d'étiquettes à réimprimer (ex: 2 par facing) et groupe les articles dans un lot nommé (ex: "Changement Prix Épicerie").
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                        4
                      </span>
                      <span>Transfert Automatique & File d'Impression</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Dès que la connexion Wi-Fi ou réseau local est détectée, le terminal pousse la table vers le PC de bureau via <code>POST /api/v2/tables/import</code>.
                      Le poste Desktop E-Studio reçoit l'alerte en temps réel (Server-Sent Events) et intègre directement les articles dans le gabarit d'étiquettes correspondant, prêt pour l'impression thermique ou laser.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benchmark vs Industry Leading Softwares Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Revue Comparative du Workflow face aux Leaders Industriels
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Solution Logicielle</th>
                        <th className="p-3">Mécanisme Mobile / Desktop</th>
                        <th className="p-3">Fonctionnement Hors-Ligne</th>
                        <th className="p-3">Temps de Mise en Œuvre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-blue-50/60 font-semibold text-blue-950">
                        <td className="p-3 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-blue-600" />
                          <span>E-Studio Pro (Notre Solution)</span>
                        </td>
                        <td className="p-3">
                          Appairage QR Code dynamique, API REST locale LAN/HTTP, SSE temps réel + PWA zéro installation
                        </td>
                        <td className="p-3 text-emerald-700">
                          100% Autonome (Cache SQLite/IndexedDB embarqué)
                        </td>
                        <td className="p-3 text-emerald-700">&lt; 1 minute (Scan QR direct)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">Zebra DataWedge & Enterprise Browser</td>
                        <td className="p-3 text-slate-600">
                          Intents Android propriétaires, nécessite configuration de profils XML et licences Zebra
                        </td>
                        <td className="p-3 text-emerald-700">Oui (sur terminaux Zebra uniquement)</td>
                        <td className="p-3 text-slate-600">Complexe (déploiement MDM)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">BarTender Print Portal</td>
                        <td className="p-3 text-slate-600">
                          Portail web IIS client-serveur lourd avec pilote d'impression serveur Windows
                        </td>
                        <td className="p-3 text-rose-700">Non (connexion continue requise)</td>
                        <td className="p-3 text-slate-600">Moyen (infrastructure serveur)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">Scandit Enterprise Barcode</td>
                        <td className="p-3 text-slate-600">
                          SDK scanner MatrixScan puissant pour smartphones grand public, coût de licence par scan élevé
                        </td>
                        <td className="p-3 text-emerald-700">Oui</td>
                        <td className="p-3 text-slate-600">Développement SDK natif</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-slate-900">Honeywell Operational Intelligence</td>
                        <td className="p-3 text-slate-600">
                          Plateforme Cloud télémétrique propriétaire avec agent résident sur terminaux Honeywell
                        </td>
                        <td className="p-3 text-amber-700">Partiel (téléchargement différé)</td>
                        <td className="p-3 text-slate-600">Complexe (Cloud enterprise)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ready-to-Use Kotlin Code Snippet Card */}
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      Extrait de Code Android Kotlin (Client HTTP Retrofit Prêt à l'Emploi)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Kotlin / OkHttp / Retrofit</span>
                </div>

                <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono overflow-x-auto text-emerald-300 leading-relaxed border border-slate-800">
{`// 1. Interface Retrofit de communication avec E-Studio Desktop
interface EStudioApi {
    @POST("/api/v2/handshake")
    suspend fun handshake(@Body req: HandshakeRequest): HandshakeResponse

    @GET("/api/v2/catalog/sync")
    suspend fun syncCatalog(@Query("version") sinceVersion: String?): CatalogResponse

    @POST("/api/v2/tables/import")
    suspend fun importTable(@Body payload: MobileTablePayload): ImportResponse
}

// 2. Exemple d'envoi d'un lot de scans scannés en rayon
suspend fun sendScannedLotToDesktop(hostIp: String, port: Int, lot: MobileTablePayload) {
    val retrofit = Retrofit.Builder()
        .baseUrl("http://$hostIp:$port")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val api = retrofit.create(EStudioApi::class.java)
    val response = api.importTable(lot)
    if (response.success) {
        Log.i("EStudio", "Lot \${lot.tableId} transmis avec succès au PC caisse !")
    }
}`}
                </pre>
              </div>

              {/* Local-First Two-Database Architecture Card (Turso / libSQL) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Architecture "Local-First" à Double Base (System DB + Dataset DB)
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                    Sécurité & Performance Multi-plateforme
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Cette architecture sépare la logique applicative du jeu de données utilisateur. Au lieu de figer une base maître massive ou de coder en dur des jetons API sensibles dans le binaire d'installation, deux bases SQLite locales distinctes sont gérées dans le dossier applicatif (AppData / Application Support) :
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>1. System DB (system.db)</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Stocke la configuration globale, les profils utilisateurs, les thèmes et les chemins des bases actives. Livrée vierge et initialisée au 1er boot.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>2. Dataset DB (dataset_xyz.db)</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Héberge le catalogue articles et les lots scannés. Créée dynamiquement à la volée avec <code>@libsql/client</code> lors de la création d'espace ou d'import.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Synchronisation Cloud Turso Découplée (Optionnelle)</span>
                  </div>
                  <p className="text-indigo-800">
                    Pour répliquer les données vers le mobile ou le cloud, le fichier SQLite local est transformé en réplica Turso (<code>syncUrl: "libsql://dataset.turso.io"</code>) avec un jeton éphémère limité à ce seul dataset, sans exposer les clés d'administration.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Station ID: <strong className="text-slate-700">{config.instanceId}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Fermer la Fenêtre
          </button>
        </div>
      </div>
    </div>
  );
};
