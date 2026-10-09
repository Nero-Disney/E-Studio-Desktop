import React, { useState } from 'react';
import { useTooltip } from '../context/TooltipContext';
import {
  Sliders,
  Eye,
  Sun,
  Moon,
  ShieldAlert,
  X,
  MousePointer,
  Layers,
  Ruler,
  Lock,
  Unlock,
  RotateCw,
  Compass,
  Disc,
  CircleDot,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  ArrowDownRight,
  Crosshair,
  Maximize2,
  Box,
  Layers2,
} from 'lucide-react';
import { RotationHandleType, ElementPlacementStrategy } from '../types';

interface AccessibilityPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityPreferencesModal: React.FC<AccessibilityPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tooltipSettings,
    updateTooltipSettings,
    gridSnapSensitivityMm,
    setGridSnapSensitivityMm,
    themeMode,
    setThemeMode,
    uiPreferences,
    updateUIPreferences,
    rulerSettings,
    updateRulerSettings,
  } = useTooltip();

  const [previewAngle, setPreviewAngle] = useState(0);

  if (!isOpen) return null;

  const currentHandleType: RotationHandleType = uiPreferences?.rotationHandleType || 'top_stem';
  const rotationSnapEnabled = uiPreferences?.rotationSnapEnabled !== false;
  const rotationSnapAngle = uiPreferences?.rotationSnapAngle || 15;
  const currentPlacementStrategy: ElementPlacementStrategy =
    uiPreferences?.elementPlacementStrategy || 'ergonomic_smart';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Accessibilité & Préférences Studio</h2>
              <p className="text-[11px] text-slate-500">Personnalisez l'ergonomie, les poignées de rotation, les bulles d'aide et la sensibilité</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
          {/* 1. Tooltips Configuration */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Infobulles & Assistances Contextuelles</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-semibold text-slate-800 block">Activer les infobulles contextuelles</span>
                <span className="text-[11px] text-slate-500">Affiche des explications au survol des éléments</span>
              </div>
              <button
                onClick={() => updateTooltipSettings({ enabled: !tooltipSettings.enabled })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  tooltipSettings.enabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                    tooltipSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {tooltipSettings.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                {/* Pointer Hover Latency */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3 text-indigo-600" />
                      Délai de Survol (Hover Latency)
                    </span>
                    <span className="font-mono text-indigo-700">{tooltipSettings.hoverDelayMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={tooltipSettings.hoverDelayMs}
                    onChange={(e) => updateTooltipSettings({ hoverDelayMs: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>100ms (Rapide)</span>
                    <span>2000ms (Lent)</span>
                  </div>
                </div>

                {/* Opacity Percent */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Opacité des Infobulles</span>
                    <span className="font-mono text-indigo-700">{tooltipSettings.opacityPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={tooltipSettings.opacityPercent}
                    onChange={(e) => updateTooltipSettings({ opacityPercent: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>50% (Semi-Transparent)</span>
                    <span>100% (Opaque)</span>
                  </div>
                </div>

                {/* Auto Dismiss Timer */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 sm:col-span-2">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Minuterie Masquage Automatique (Auto-Dismiss)</span>
                    <span className="font-mono text-indigo-700">
                      {tooltipSettings.autoDismissSec === 0 ? 'Infinie (Permanent)' : `${tooltipSettings.autoDismissSec} s`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={tooltipSettings.autoDismissSec}
                    onChange={(e) => updateTooltipSettings({ autoDismissSec: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>0s (Permanent)</span>
                    <span>5s (Standard)</span>
                    <span>15s (Long)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Grid Snap Sensitivity */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Sensibilité du Magnétisme / Grille</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>Pas de Magnétisme (Grid Snap Sensitivity) :</span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-mono font-bold">
                  {gridSnapSensitivityMm} mm
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10.0"
                step="0.1"
                value={gridSnapSensitivityMm}
                onChange={(e) => setGridSnapSensitivityMm(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.1 mm (Ultra-Précis)</span>
                <span>1.0 mm (Standard)</span>
                <span>5.0 mm (Saut Grossier)</span>
              </div>
            </div>
          </div>

          {/* 3. Theme Properties */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Sun className="w-3.5 h-3.5 text-indigo-600" />
              <span>3. Thème & Mode d'Affichage</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setThemeMode('light')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  themeMode === 'light'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400/30 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs">Clair (Standard)</span>
              </button>

              <button
                onClick={() => setThemeMode('dark')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-400/30 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs">Sombre (Dark)</span>
              </button>

              <button
                onClick={() => setThemeMode('eink_high_contrast')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                  themeMode === 'eink_high_contrast'
                    ? 'bg-black border-white text-white ring-2 ring-white/50 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-black'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span className="text-xs">Haut Contraste E-Ink</span>
              </button>
            </div>
          </div>

          {/* 4. Workspace Rulers Decoupled Configuration */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Ruler className="w-3.5 h-3.5 text-indigo-600" />
              <span>4. Règles Millimétriques & HUD Flottant (Workspace Rulers)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => updateUIPreferences({ rulerMode: 'window_frame' })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  uiPreferences?.rulerMode === 'window_frame'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold block">Cadre Viewport Fenêtre</span>
                <span className="text-[9px] text-slate-500 font-normal">Ancrées sous le ruban haut et au bord gauche de l'écran</span>
              </button>

              <button
                onClick={() => updateUIPreferences({ rulerMode: 'sheet_margins' })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  uiPreferences?.rulerMode === 'sheet_margins'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold block">Marges Feuille</span>
                <span className="text-[9px] text-slate-500 font-normal">Ancrées autour du gabarit avec dégagement configurable</span>
              </button>

              <button
                onClick={() => updateUIPreferences({ rulerMode: 'hidden' })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  uiPreferences?.rulerMode === 'hidden'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold ring-2 ring-indigo-400/30'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-[11px] font-semibold block">Masquer Règles</span>
                <span className="text-[9px] text-slate-500 font-normal">Masquer les règles de bordure principales</span>
              </button>
            </div>

            {/* Toggle Ruler Instance Controls */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1">
                Activation Individuelle des Règles (Toggle Ruler Instances)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => updateRulerSettings({ showHorizontal: !rulerSettings.showHorizontal })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showHorizontal
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Règle Haut</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showHorizontal ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => updateRulerSettings({ showVertical: !rulerSettings.showVertical })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showVertical
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Règle Gauche</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showVertical ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => updateRulerSettings({ showSheet: !rulerSettings.showSheet })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showSheet
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Règles Feuille</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showSheet ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => updateRulerSettings({ showHud: !rulerSettings.showHud })}
                  className={`p-2 rounded-lg border text-xs font-semibold transition flex items-center justify-between ${
                    rulerSettings.showHud
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>HUD Flottant</span>
                  <span className="text-[10px] opacity-80">{rulerSettings.showHud ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Independent Floating Ruler HUD Section */}
            <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-100">HUD Règle Flottant Indépendant</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRulerSettings({ showHud: !rulerSettings.showHud })}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      rulerSettings.showHud
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {rulerSettings.showHud ? 'Activé (Visible)' : 'Désactivé (Masqué)'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                <span>Position actuelle du HUD:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-indigo-300">
                    {uiPreferences?.hudPosition
                      ? `X: ${uiPreferences.hudPosition.x}px, Y: ${uiPreferences.hudPosition.y}px (Ancré)`
                      : 'Sous le Ruban d\'outils haut (Par défaut)'}
                  </span>
                  {uiPreferences?.hudPosition && (
                    <button
                      onClick={() => updateUIPreferences({ hudPosition: null })}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white rounded text-[10px] transition border border-slate-700"
                    >
                      Réinitialiser la Position
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed">
                Le HUD Flottant est indépendant des règles de cadre/feuille. Vous pouvez le déplacer librement par glisser-déposer et l'ancrer à n'importe quel emplacement sur l'écran. Il affiche la taille du gabarit et les coordonnées exactes du pointeur en temps réel.
              </p>
            </div>

            {/* Ruler Clearance Offset Slider Parameter */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Dégagement & Écart des Règles Feuille (Clearance Offset)
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                  <span>{uiPreferences?.rulerOffsetPx || 40} px</span>
                  <span className="text-[10px] text-slate-500">
                    (~{Math.round(((uiPreferences?.rulerOffsetPx || 40) / 3.78) * 10) / 10} mm)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="2"
                  value={uiPreferences?.rulerOffsetPx || 40}
                  onChange={(e) =>
                    updateUIPreferences({
                      rulerOffsetPx: Number(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                Ajuste l'espacement de dégagement entre les règles millimétriques et les bordures du gabarit en mode Marges Feuille.
              </p>
            </div>
          </div>

          {/* 5. Individual Panel Lock Parameters (Anti-Collapsing) */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2 border-b border-slate-100 pb-1">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>5. Verrouillage des Panneaux (Panel Lock Controls)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Property Inspector Lock */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {uiPreferences?.lockPropertyInspector ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>Inspecteur de Propriétés</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Empêche l'inspecteur de se fermer lors d'un clic sur la zone de travail.
                  </p>
                </div>

                <button
                  onClick={() =>
                    updateUIPreferences({
                      lockPropertyInspector: !uiPreferences?.lockPropertyInspector,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    uiPreferences?.lockPropertyInspector
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {uiPreferences?.lockPropertyInspector ? 'Verrouillé' : 'Libre'}
                </button>
              </div>

              {/* Left Sidebar Lock */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    {uiPreferences?.lockLeftSidebar ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>Palette d'Outils Latérale</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Maintient la barre d'outils et de calques ouverte en permanence.
                  </p>
                </div>

                <button
                  onClick={() =>
                    updateUIPreferences({
                      lockLeftSidebar: !uiPreferences?.lockLeftSidebar,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                    uiPreferences?.lockLeftSidebar
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {uiPreferences?.lockLeftSidebar ? 'Verrouillé' : 'Libre'}
                </button>
              </div>
            </div>
          </div>

          {/* 6. Rotation Handles & Bounding Box Controls */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-slate-100 pb-1">
              <div className="flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>6. Poignées de Rotation & Boîte d'Éléments (Rotation Handles)</span>
              </div>
              <span className="text-[10px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Choix ergonomique
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Choisissez le style d'interaction de rotation qui correspond à vos préférences et habitudes de travail :
            </p>

            {/* Handle Type Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Top Stem */}
              <div
                onClick={() => updateUIPreferences({ rotationHandleType: 'top_stem' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentHandleType === 'top_stem'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <RotateCw className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Tige Supérieure ("Lollipop")</span>
                      </div>
                      <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                        Figma / Illustrator
                      </span>
                    </div>
                  </div>
                  {currentHandleType === 'top_stem' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Tige verticale centrée au-dessus de l'élément avec poignée ronde. S'inverse automatiquement vers le bas si l'élément touche le bord supérieur. Double-clic : +90°.
                </p>
              </div>

              {/* 2. Corner Hover Orbit */}
              <div
                onClick={() => updateUIPreferences({ rotationHandleType: 'corner_hover_orbit' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentHandleType === 'corner_hover_orbit'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Orbite aux 4 Coins (Invisible Radius)</span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Photoshop / InDesign
                      </span>
                    </div>
                  </div>
                  {currentHandleType === 'corner_hover_orbit' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Survolez quelques pixels au-delà des coins extérieurs pour faire pivoter librement. Laisse la boîte de sélection visuellement épurée.
                </p>
              </div>

              {/* 3. Dual Stems */}
              <div
                onClick={() => updateUIPreferences({ rotationHandleType: 'dual_stems' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentHandleType === 'dual_stems'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Double Tige (Haut & Bas)</span>
                      </div>
                      <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                        Bi-directionnel
                      </span>
                    </div>
                  </div>
                  {currentHandleType === 'dual_stems' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Deux tiges opposées (haute et basse). Permet d'attraper la poignée la plus accessible quel que soit le positionnement de l'élément sur l'étiquette.
                </p>
              </div>

              {/* 4. Corner Satellites */}
              <div
                onClick={() => updateUIPreferences({ rotationHandleType: 'corner_satellites' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentHandleType === 'corner_satellites'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Disc className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Satellites & Rapporteur (4 Coins)</span>
                      </div>
                      <span className="text-[9px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                        Haute Précision CAD
                      </span>
                    </div>
                  </div>
                  {currentHandleType === 'corner_satellites' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  4 boutons satellites décalés en diagonale avec anneau rapporteur circulaire et indicateur d'angle en direct pendant la manipulation.
                </p>
              </div>
            </div>

            {/* 5. Disabled Option */}
            <div
              onClick={() => updateUIPreferences({ rotationHandleType: 'disabled' })}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                currentHandleType === 'disabled'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700 text-xs">Désactiver les poignées de rotation sur le canevas</span>
                <span className="text-[10px] text-slate-400">(la rotation reste modifiable dans l'Inspecteur latéral)</span>
              </div>
              {currentHandleType === 'disabled' && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
            </div>

            {/* Angle Snapping & Precision Settings */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Magnétisme angulaire automatique (Angle Snap)</span>
                  <span className="text-[10px] text-slate-500">
                    Aimante automatiquement la rotation sur des angles réguliers. (Astuce : maintenez <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[9px]">Shift</kbd> pour forcer l'aimant).
                  </span>
                </div>
                <button
                  onClick={() =>
                    updateUIPreferences({ rotationSnapEnabled: !rotationSnapEnabled })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    rotationSnapEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      rotationSnapEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {rotationSnapEnabled && (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">Pas d'aimantation :</span>
                  <div className="flex items-center gap-1.5">
                    {[15, 30, 45, 90].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => updateUIPreferences({ rotationSnapAngle: deg })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                          rotationSnapAngle === deg
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Live Preview Box */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl text-white space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-xs text-slate-200">Aperçu interactif en direct</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                    Angle: {previewAngle}°
                  </span>
                  <button
                    onClick={() => setPreviewAngle((prev) => (prev + 90) % 360)}
                    className="px-2 py-0.5 bg-indigo-600/80 hover:bg-indigo-600 text-[10px] font-bold rounded transition"
                    title="Tourner de +90°"
                  >
                    +90°
                  </button>
                  <button
                    onClick={() => setPreviewAngle(0)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] rounded transition text-slate-300"
                    title="Réinitialiser"
                  >
                    0°
                  </button>
                </div>
              </div>

              {/* Mini Interactive Canvas */}
              <div className="h-36 bg-slate-800/60 rounded-lg border border-slate-700/60 flex items-center justify-center relative overflow-hidden select-none">
                {/* Background Grid Pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                />

                {/* Simulated Selected Label Element with the Selected Handle Mode */}
                <div
                  style={{
                    transform: `rotate(${previewAngle}deg)`,
                    transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                  className="w-32 h-14 bg-white text-slate-900 rounded border-2 border-blue-500 shadow-xl relative flex flex-col justify-center items-center px-2 cursor-pointer"
                  onClick={() => setPreviewAngle((a) => (a + 15) % 360)}
                  title="Cliquez pour faire pivoter par pas de 15°"
                >
                  <span className="text-[10px] font-bold tracking-tight text-slate-800 truncate max-w-full">
                    GABARIT EXEMPLE
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">12.50 € / kg</span>

                  {/* Top Stem Handle Preview */}
                  {currentHandleType === 'top_stem' && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center group">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewAngle((a) => (a + 90) % 360);
                        }}
                        className="w-4.5 h-4.5 rounded-full bg-white border-2 border-blue-500 shadow flex items-center justify-center text-blue-600 hover:scale-125 transition-transform"
                        title="Double-clic: +90°"
                      >
                        <RotateCw className="w-2.5 h-2.5" />
                      </div>
                      <div className="w-0.5 h-2.5 bg-blue-500" />
                    </div>
                  )}

                  {/* Corner Hover Orbit Preview */}
                  {currentHandleType === 'corner_hover_orbit' && (
                    <>
                      <div className="absolute -top-3.5 -left-3.5 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-full flex items-center justify-center opacity-80 animate-pulse">
                        <RotateCw className="w-2 h-2 text-emerald-300" />
                      </div>
                      <div className="absolute -top-3.5 -right-3.5 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-full flex items-center justify-center opacity-80 animate-pulse">
                        <RotateCw className="w-2 h-2 text-emerald-300" />
                      </div>
                    </>
                  )}

                  {/* Dual Stems Preview */}
                  {currentHandleType === 'dual_stems' && (
                    <>
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewAngle((a) => (a + 90) % 360);
                          }}
                          className="w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow flex items-center justify-center text-indigo-600 hover:scale-125 transition-transform"
                        >
                          <RotateCw className="w-2 h-2" />
                        </div>
                        <div className="w-0.5 h-2 bg-indigo-500" />
                      </div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <div className="w-0.5 h-2 bg-indigo-500" />
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewAngle((a) => (a + 90) % 360);
                          }}
                          className="w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow flex items-center justify-center text-indigo-600 hover:scale-125 transition-transform"
                        >
                          <RotateCw className="w-2 h-2" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Corner Satellites Preview */}
                  {currentHandleType === 'corner_satellites' && (
                    <>
                      <div className="absolute -top-3 -left-3 w-3.5 h-3.5 rounded-full bg-white border-2 border-violet-500 shadow flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-violet-600" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-3.5 h-3.5 rounded-full bg-white border-2 border-violet-500 shadow flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-violet-600" />
                      </div>
                      <div className="absolute -bottom-3 -left-3 w-3.5 h-3.5 rounded-full bg-white border-2 border-violet-500 shadow flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-violet-600" />
                      </div>
                      <div className="absolute -bottom-3 -right-3 w-3.5 h-3.5 rounded-full bg-white border-2 border-violet-500 shadow flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-violet-600" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 7. Dynamic Element Instantiation Positioning */}
          <div className="space-y-3">
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between border-b border-slate-100 pb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>7. Positionnement Dynamique à l'Instanciation des Éléments</span>
              </div>
              <span className="text-[10px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Ergonomie Gabarit
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Définissez la méthode de positionnement automatique appliquée lors de l'ajout d'un nouvel élément sur le gabarit (boutons d'ajout, raccourcis ou données importées) :
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Placement Intelligent & Ergonomique */}
              <div
                onClick={() => updateUIPreferences({ elementPlacementStrategy: 'ergonomic_smart' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentPlacementStrategy === 'ergonomic_smart'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Placement Intelligent & Ergonomique</span>
                      </div>
                      <span className="text-[9px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                        Recommandé / Pro
                      </span>
                    </div>
                  </div>
                  {currentPlacementStrategy === 'ergonomic_smart' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Analyse l'espace libre disponible, les marges de découpe, les objets déjà posés et le type métier (textes en haut, codes-barres en bas, prix en zone dédiée) pour éviter tout chevauchement.
                </p>
              </div>

              {/* 2. Cascade Dynamique Décalée */}
              <div
                onClick={() => updateUIPreferences({ elementPlacementStrategy: 'smart_cascade' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentPlacementStrategy === 'smart_cascade'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Cascade Décalée Échelonnée</span>
                      </div>
                      <span className="text-[9px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.2 rounded">
                        Décalage (+4mm)
                      </span>
                    </div>
                  </div>
                  {currentPlacementStrategy === 'smart_cascade' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Positionne chaque nouvel élément avec un décalage progressif par rapport au précédent, avec renvoi automatique en haut si la limite du gabarit est atteinte.
                </p>
              </div>

              {/* 3. Zonage Standard Métier */}
              <div
                onClick={() => updateUIPreferences({ elementPlacementStrategy: 'zone_semantic' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentPlacementStrategy === 'zone_semantic'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Zonage Standard Métier</span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Quadrants Normés
                      </span>
                    </div>
                  </div>
                  {currentPlacementStrategy === 'zone_semantic' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Route immédiatement les nouveaux éléments dans leur zone canonique de balisage : En-tête haut-gauche, Code-barres bas-centre, Bloc prix bas-droit.
                </p>
              </div>

              {/* 4. Centre du Gabarit */}
              <div
                onClick={() => updateUIPreferences({ elementPlacementStrategy: 'canvas_center' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  currentPlacementStrategy === 'canvas_center'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Crosshair className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Centre du Gabarit</span>
                      </div>
                      <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                        Centrage
                      </span>
                    </div>
                  </div>
                  {currentPlacementStrategy === 'canvas_center' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                  Place systématiquement l'élément créé au centre exact du gabarit pour un réajustement manuel direct depuis le centre visuel.
                </p>
              </div>

              {/* 5. Position Fixe Classique */}
              <div
                onClick={() => updateUIPreferences({ elementPlacementStrategy: 'fixed_classic' })}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between sm:col-span-2 ${
                  currentPlacementStrategy === 'fixed_classic'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Box className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Position Fixe Classique (Haut-Gauche)</span>
                      </div>
                      <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                        Origine Fixe
                      </span>
                    </div>
                  </div>
                  {currentPlacementStrategy === 'fixed_classic' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Place tous les éléments à la coordonnée statique d'origine (marge supérieure gauche).
                </p>
              </div>
            </div>

            {/* Simulation Preview of Strategy Layout */}
            <div className="p-3 bg-slate-900 rounded-xl text-white space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Aperçu visuel de disposition simulée :</span>
                <span className="text-indigo-300 font-mono text-[10px]">
                  {currentPlacementStrategy === 'ergonomic_smart' && 'Mode : Ergonomique & Non-Chevauchant'}
                  {currentPlacementStrategy === 'smart_cascade' && 'Mode : Échelonné (+4mm)'}
                  {currentPlacementStrategy === 'zone_semantic' && 'Mode : Zones Métier'}
                  {currentPlacementStrategy === 'canvas_center' && 'Mode : Centré'}
                  {currentPlacementStrategy === 'fixed_classic' && 'Mode : Fixe Haut-Gauche'}
                </span>
              </div>

              <div className="h-32 bg-slate-950/80 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center p-2">
                <div
                  className="absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '10px 10px',
                  }}
                />

                {/* Simulated Gabarit Bounds */}
                <div className="w-64 h-24 bg-white rounded border border-indigo-400/40 relative shadow-inner p-1.5 flex flex-col justify-between">
                  {/* Item 1: Designation / Title */}
                  <div
                    className={`absolute transition-all duration-300 rounded border px-1 py-0.5 text-[8px] font-bold ${
                      currentPlacementStrategy === 'ergonomic_smart'
                        ? 'top-1.5 left-1.5 bg-blue-50 border-blue-400 text-blue-900 w-32'
                        : currentPlacementStrategy === 'smart_cascade'
                        ? 'top-1.5 left-1.5 bg-blue-50 border-blue-400 text-blue-900 w-28'
                        : currentPlacementStrategy === 'zone_semantic'
                        ? 'top-1.5 left-1.5 bg-blue-50 border-blue-400 text-blue-900 w-32'
                        : currentPlacementStrategy === 'canvas_center'
                        ? 'top-4 left-16 bg-blue-50 border-blue-400 text-blue-900 w-28'
                        : 'top-1.5 left-1.5 bg-blue-50 border-blue-400 text-blue-900 w-28'
                    }`}
                  >
                    1. Désignation Produit
                  </div>

                  {/* Item 2: Prix */}
                  <div
                    className={`absolute transition-all duration-300 rounded border px-1 py-0.5 text-[8px] font-bold ${
                      currentPlacementStrategy === 'ergonomic_smart'
                        ? 'top-1.5 right-1.5 bg-rose-50 border-rose-400 text-rose-900 w-16 text-right'
                        : currentPlacementStrategy === 'smart_cascade'
                        ? 'top-7 left-6 bg-rose-50 border-rose-400 text-rose-900 w-16 text-center'
                        : currentPlacementStrategy === 'zone_semantic'
                        ? 'bottom-1.5 right-1.5 bg-rose-50 border-rose-400 text-rose-900 w-16 text-right'
                        : currentPlacementStrategy === 'canvas_center'
                        ? 'top-8 left-18 bg-rose-50 border-rose-400 text-rose-900 w-16 text-center'
                        : 'top-1.5 left-1.5 bg-rose-50 border-rose-400 text-rose-900 w-16 text-center opacity-80'
                    }`}
                  >
                    2. 12,99 €
                  </div>

                  {/* Item 3: Code-Barres */}
                  <div
                    className={`absolute transition-all duration-300 rounded border px-1 py-0.5 text-[8px] font-mono flex items-center justify-center ${
                      currentPlacementStrategy === 'ergonomic_smart'
                        ? 'bottom-1.5 left-6 bg-slate-100 border-slate-400 text-slate-800 w-32'
                        : currentPlacementStrategy === 'smart_cascade'
                        ? 'top-12 left-12 bg-slate-100 border-slate-400 text-slate-800 w-28'
                        : currentPlacementStrategy === 'zone_semantic'
                        ? 'bottom-1.5 left-8 bg-slate-100 border-slate-400 text-slate-800 w-28'
                        : currentPlacementStrategy === 'canvas_center'
                        ? 'top-12 left-20 bg-slate-100 border-slate-400 text-slate-800 w-24'
                        : 'top-1.5 left-1.5 bg-slate-100 border-slate-400 text-slate-800 w-24 opacity-60'
                    }`}
                  >
                    3. |||||| 3250390 |||
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-2xs transition"
          >
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
