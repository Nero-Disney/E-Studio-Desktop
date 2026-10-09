import React, { useState } from 'react';
import { LabelTemplate } from '../types';
import { LabelRenderer } from './LabelRenderer';
import { ContextTooltip, useTooltip } from '../context/TooltipContext';
import {
  Plus,
  Printer,
  Edit3,
  Copy,
  Trash2,
  Download,
  Upload,
  Layers,
  Search,
  CheckCircle,
  Tag,
  Grid,
  FileCode,
  Cpu,
  Settings,
  History,
  Type,
  BookOpen,
  Smartphone,
  Database,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from '../pwa';

interface HomeDashboardProps {
  templates: LabelTemplate[];
  onSelectTemplateToEdit: (template: LabelTemplate) => void;
  onSelectTemplateToGenerate: (template: LabelTemplate) => void;
  onOpenNewWizard: () => void;
  onDuplicateTemplate: (template: LabelTemplate) => void;
  onDeleteTemplate: (templateName: string) => void;
  onImportTemplate: (template: LabelTemplate) => void;
  onOpenRulesModal: () => void;
  onOpenAuditLogs?: () => void;
  onOpenFontManager?: () => void;
  onOpenMappingDictionary?: () => void;
  onOpenMobileSync?: () => void;
  onOpenMasterDatabase?: () => void;
  pendingLotsCount?: number;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  templates,
  onSelectTemplateToEdit,
  onSelectTemplateToGenerate,
  onOpenNewWizard,
  onDuplicateTemplate,
  onDeleteTemplate,
  onImportTemplate,
  onOpenRulesModal,
  onOpenAuditLogs,
  onOpenFontManager,
  onOpenMappingDictionary,
  onOpenMobileSync,
  onOpenMasterDatabase,
  pendingLotsCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { openPreferencesModal } = useTooltip();

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.name && json.width_mm && json.height_mm) {
          onImportTemplate(json);
        } else {
          alert('Fichier JSON de gabarit invalide (propriétés manquantes).');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON: ' + String(err));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
      {/* Top Welcome & Quick Actions Banner */}
      <div className="bg-white border-b border-slate-200 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1 font-semibold text-xs uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>Studio d'Étiquetage & Imposition de Prix</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              E-Studio Web
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Conception vectorielle d'étiquettes de rayon, gestion des paliers prix Cash & Carry, liaison de données Excel et imposition automatique sur planches d'impression.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <ContextTooltip
              title="Base de Données Master & Import Excel"
              content="Explorer le catalogue central, importer/nettoyer vos fichiers Excel/CSV et gérer tous les champs produits"
              category="Base de Données"
            >
              <button
                onClick={onOpenMasterDatabase}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition hover:scale-[1.01]"
              >
                <Database className="w-4 h-4" />
                <span>Base de Données & Import</span>
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Dictionnaire de Mapping & Alias"
              content="Gérer les alias de colonnes Excel, mots-clés de détection automatique et champs personnalisés"
              category="Données"
            >
              <button
                onClick={onOpenMappingDictionary}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Mapping</span>
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Passerelle Mobiles & Lots Scannés"
              content="Réceptionner les scans de rayons depuis iPhones (PWA) et terminaux Android (Zebra), appairer par QR Code et lancer l'impression des lots"
              category="Mobile"
            >
              <button
                onClick={onOpenMobileSync}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition relative"
              >
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mobiles & Lots</span>
                {pendingLotsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                    {pendingLotsCount}
                  </span>
                )}
              </button>
            </ContextTooltip>

            <PWAInstallButton compact />

            <ContextTooltip
              title="Moteur de Règles Omni-Canal"
              content="Simulateur multi-device pour étiquettes électroniques ESL, étiquettes papier et écrans LCD de rayon"
              category="Automatisation"
            >
              <button
                onClick={onOpenRulesModal}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <Cpu className="w-4 h-4 text-blue-200" />
                <span>Omni-Canal</span>
              </button>
            </ContextTooltip>

            <ContextTooltip
              title="Nouveau Gabarit d'Étiquette"
              content="Lancer l'assistant pas-à-pas pour créer un nouveau gabarit sur-mesure"
              category="Création"
            >
              <button
                onClick={onOpenNewWizard}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Créer Gabarit</span>
              </button>
            </ContextTooltip>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-8 flex-1 flex flex-col space-y-6">
        {/* Search & Grid Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              Gabarits d'Étiquettes Disponibles
            </h2>
            <span className="bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
              {filteredTemplates.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un gabarit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white border border-dashed border-slate-300 rounded-2xl text-center">
            <Tag className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700">Aucun gabarit trouvé</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Aucun gabarit ne correspond à votre recherche "{searchTerm}".
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.name}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {template.name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {template.width_mm}x{template.height_mm} mm
                    </span>
                  </div>

                  {/* Visual Label Preview */}
                  <div className="aspect-[4/3] bg-slate-100 rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden relative mb-4">
                    <div className="transform scale-[0.6] origin-center shadow-xs bg-white">
                      <LabelRenderer template={template} />
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100">
                  <ContextTooltip
                    title="Générer & Imprimer"
                    content="Ouvrir l'espace d'imposition pour sélectionner ou importer des données et lancer l'impression"
                    category="Impression"
                  >
                    <button
                      onClick={() => onSelectTemplateToGenerate(template)}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer</span>
                    </button>
                  </ContextTooltip>

                  <ContextTooltip
                    title="Modifier Gabarit"
                    content="Éditer la disposition, les dimensions et les champs de ce gabarit"
                    category="Édition"
                  >
                    <button
                      onClick={() => onSelectTemplateToEdit(template)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </ContextTooltip>

                  <ContextTooltip
                    title="Dupliquer Gabarit"
                    content="Créer une copie exacte de ce gabarit"
                    category="Édition"
                  >
                    <button
                      onClick={() => onDuplicateTemplate(template)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </ContextTooltip>

                  <ContextTooltip
                    title="Supprimer Gabarit"
                    content="Supprimer définitivement ce gabarit de la bibliothèque"
                    category="Édition"
                  >
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer le gabarit "${template.name}" ?`)) {
                          onDeleteTemplate(template.name);
                        }
                      }}
                      className="p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </ContextTooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
