import React from 'react';
import { AppView } from '../services/navigationService';
import { LabelTemplate } from '../types';
import { PWAInstallButton } from '../pwa/components/PWAInstallButton';
import { useOnlineStatus } from '../pwa/hooks/useOnlineStatus';
import {
  LayoutDashboard,
  Layers,
  Printer,
  Database,
  Smartphone,
  ChevronRight,
  Wifi,
  WifiOff,
  Cloud,
  Settings2,
  BookOpen,
  Type,
  History,
  HelpCircle,
  HardDrive,
} from 'lucide-react';

interface AppTopNavigationBarProps {
  currentView: AppView;
  activeTemplate: LabelTemplate | null;
  templates: LabelTemplate[];
  totalProductsCount: number;
  pendingLotsCount: number;
  isTursoConfigured?: boolean;
  onNavigate: (view: AppView) => void;
  onOpenMobileSync: () => void;
  onOpenMasterDatabase: () => void;
  onOpenRulesModal: () => void;
  onOpenFontManager: () => void;
  onOpenAuditLogs: () => void;
  onOpenMappingDictionary: () => void;
  onOpenPreferences: () => void;
}

export const AppTopNavigationBar: React.FC<AppTopNavigationBarProps> = ({
  currentView,
  activeTemplate,
  templates,
  totalProductsCount,
  pendingLotsCount,
  isTursoConfigured = false,
  onNavigate,
  onOpenMobileSync,
  onOpenMasterDatabase,
  onOpenRulesModal,
  onOpenFontManager,
  onOpenAuditLogs,
  onOpenMappingDictionary,
  onOpenPreferences,
}) => {
  const isOnline = useOnlineStatus();
  const [toolsDropdownOpen, setToolsDropdownOpen] = React.useState(false);

  // Global hotkeys Alt+1 .. Alt+5
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          onNavigate('home');
        } else if (e.key === '2') {
          e.preventDefault();
          onNavigate('editor');
        } else if (e.key === '3') {
          e.preventDefault();
          onNavigate('generation');
        } else if (e.key === '4') {
          e.preventDefault();
          onNavigate('database');
        } else if (e.key === '5') {
          e.preventDefault();
          onNavigate('mobile');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 shrink-0 select-none z-40 relative shadow-md">
      <div className="h-12 px-3 sm:px-4 flex items-center justify-between gap-3">
        {/* Left Side: Brand Logo & Breadcrumb Navigation */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-left group hover:opacity-90 transition shrink-0 focus:outline-none"
            title="Retour au Tableau de bord (Alt+1)"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm tracking-tight text-white">E-STUDIO</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest">
                  PRO
                </span>
              </div>
            </div>
          </button>

          {/* Breadcrumb Separator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {currentView === 'home' && (
              <span className="font-semibold text-slate-200">Tableau de Bord</span>
            )}

            {currentView === 'editor' && (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-blue-400 transition truncate"
                >
                  Gabarits
                </button>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="font-semibold text-blue-400 truncate max-w-[140px] sm:max-w-[200px]">
                  {activeTemplate ? activeTemplate.name : 'Éditeur Studio'}
                </span>
              </>
            )}

            {currentView === 'generation' && (
              <>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-blue-400 transition truncate"
                >
                  Production
                </button>
                <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                <span className="font-semibold text-blue-400 truncate max-w-[140px] sm:max-w-[200px]">
                  {activeTemplate ? activeTemplate.name : 'Planche & Impression'}
                </span>
              </>
            )}

            {currentView === 'database' && (
              <span className="font-semibold text-emerald-400">Base Articles Master</span>
            )}

            {currentView === 'mobile' && (
              <span className="font-semibold text-amber-400">Terminal Compagnon Mobile</span>
            )}
          </div>
        </div>

        {/* Center: Module View Switcher (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentView === 'home'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Accueil & Gabarits (Alt+1)"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => onNavigate('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentView === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Concepteur Visuel de Gabarit (Alt+2)"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Éditeur Gabarit</span>
          </button>

          <button
            onClick={() => onNavigate('generation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentView === 'generation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Impression & Planches (Alt+3)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Production & Planche</span>
          </button>

          <button
            onClick={() => onNavigate('database')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentView === 'database'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Base de Données Articles (Alt+4)"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Base Master</span>
            {totalProductsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full">
                {totalProductsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              currentView === 'mobile'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Terminal Mobile PWA (Alt+5)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Terminal Mobile</span>
          </button>
        </div>

        {/* Right Side: Status Badges, Mobile Hub & Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Gateway Quick Action */}
          <button
            onClick={onOpenMobileSync}
            className="relative px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            title="Passerelle de synchronisation sans fil avec terminaux mobiles"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Passerelle Mobile</span>
            {pendingLotsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full animate-pulse">
                {pendingLotsCount} lot{pendingLotsCount > 1 ? 's' : ''}
              </span>
            )}
          </button>

          {/* Database / Turso Quick Status */}
          <button
            onClick={onOpenMasterDatabase}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/70 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/80 transition"
            title="Ouvrir la base articles master ou configurer la synchronisation Turso"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px] font-semibold text-emerald-300">
              {totalProductsCount} art.
            </span>
            {isTursoConfigured && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Turso DB connecté" />
            )}
          </button>

          {/* Online / Offline Status Badge */}
          <div
            className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border ${
              isOnline
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/40'
            }`}
            title={isOnline ? 'Connecté au réseau local / Internet' : 'Mode Hors-Ligne actif (IndexedDB / PWA)'}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="text-[10px]">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Tools & Utilities Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen((prev) => !prev)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition focus:outline-none"
              title="Outils & Paramètres système"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {toolsDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setToolsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs divide-y divide-slate-800 animate-in fade-in-50 duration-100">
                  <div className="pb-1.5">
                    <span className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Modules & Données
                    </span>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenMappingDictionary();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span>Dictionnaire de mapping & alias</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenRulesModal();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Moteur de règles omnicanal</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenFontManager();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
                    >
                      <Type className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gestionnaire de polices typographiques</span>
                    </button>
                  </div>

                  <div className="pt-1.5">
                    <span className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Sécurité & Audit
                    </span>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenAuditLogs();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Journal d'audit & traçabilité</span>
                    </button>
                    <button
                      onClick={() => {
                        setToolsDropdownOpen(false);
                        onOpenPreferences();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2 transition"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Préférences & Accessibilité</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
