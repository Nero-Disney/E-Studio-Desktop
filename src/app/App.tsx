import React, { useState, useEffect, useCallback } from 'react';
import { TooltipProvider } from '../context/TooltipContext';
import { MappingDictionaryProvider } from '../context/MappingDictionaryContext';
import { AppProviders } from './providers/AppProviders';
import { AppTopNavigationBar } from '../components/AppTopNavigationBar';
import { HomeDashboard } from '../components/HomeDashboard';
import { TemplateEditor } from '../components/TemplateEditor';
import { GenerationWorkspace } from '../components/GenerationWorkspace';
import { CatalogManagementStudio } from '../components/CatalogManagementStudio';
import { OmniChannelStudioModal } from '../components/OmniChannelStudioModal';
import { NewGabaritWizard } from '../components/NewGabaritWizard';
import { AuditTrailModal } from '../components/AuditTrailModal';
import { FontManagerModal } from '../components/FontManagerModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { MappingDictionaryModal } from '../components/MappingDictionaryModal';
import { AccessibilityPreferencesModal } from '../components/AccessibilityPreferencesModal';
import { LabelTemplate, ProductRecord } from '../types';
import { catalogRepository } from '../services/catalogRepository';
import { navigationService, AppView } from '../services/navigationService';
import { AuditLogService } from '../services/auditLogService';
import { sanitizeNonPriceElement } from '../utils/pricingEngine';

const TEMPLATES_STORAGE_KEY = 'estudio_desktop_templates_v3';

function MainWorkspace() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  // Starts with genuine empty array on clean install
  const [templates, setTemplates] = useState<LabelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((tpl: LabelTemplate) => ({
            ...tpl,
            items: (tpl.items || []).map((it) => sanitizeNonPriceElement(it)),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load local templates workspace', e);
    }
    return [];
  });

  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(() => templates[0] || null);
  const [generationProducts, setGenerationProducts] = useState<ProductRecord[] | undefined>(undefined);
  const [generationBatchName, setGenerationBatchName] = useState<string | undefined>(undefined);

  // Catalog products count
  const [productsCount, setProductsCount] = useState<number>(() => catalogRepository.getProducts().length);

  // Modals state
  const [isNewWizardOpen, setIsNewWizardOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isFontManagerOpen, setIsFontManagerOpen] = useState(false);
  const [isMappingDictOpen, setIsMappingDictOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  // Sync templates to localStorage
  const saveTemplates = useCallback((updatedTemplates: LabelTemplate[]) => {
    setTemplates(updatedTemplates);
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (e) {
      console.warn('Failed to persist templates', e);
    }
  }, []);

  // Subscribe to Navigation Service
  useEffect(() => {
    const unsub = navigationService.subscribe((route) => {
      setCurrentView(route.view);
      if (route.params.template) {
        const found = templates.find((t) => t.name === route.params.template);
        if (found) setActiveTemplate(found);
      }
    });
    return () => unsub();
  }, [templates]);

  // Subscribe to Catalog Repository changes
  useEffect(() => {
    const unsub = catalogRepository.subscribe((products) => {
      setProductsCount(products.length);
    });
    return () => unsub();
  }, []);

  // Navigation handlers
  const handleNavigate = (view: AppView, params: Record<string, string> = {}) => {
    navigationService.navigateTo(view, params);
  };

  const handleSelectTemplateToEdit = (template: LabelTemplate) => {
    setActiveTemplate(template);
    navigationService.navigateTo('editor', { template: template.name });
  };

  const handleSelectTemplateToGenerate = (
    template: LabelTemplate,
    customProducts?: ProductRecord[],
    batchName?: string
  ) => {
    setActiveTemplate(template);
    setGenerationProducts(customProducts);
    setGenerationBatchName(batchName);
    navigationService.navigateTo('generation', { template: template.name });
  };

  const handleSaveTemplate = (updated: LabelTemplate) => {
    const sanitized: LabelTemplate = {
      ...updated,
      items: (updated.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    const existingIndex = templates.findIndex((t) => t.name === sanitized.name);
    let nextTemplates: LabelTemplate[];
    if (existingIndex >= 0) {
      nextTemplates = [...templates];
      nextTemplates[existingIndex] = sanitized;
    } else {
      nextTemplates = [sanitized, ...templates];
    }
    saveTemplates(nextTemplates);
    setActiveTemplate(sanitized);
    AuditLogService.append({
      user: 'Opérateur Local',
      action: 'MODIFICATION_GABARIT',
      template_name: sanitized.name,
      details: `Gabarit sauvegardé : ${sanitized.name} (${sanitized.items.length} éléments)`,
    });
  };

  const handleDuplicateTemplate = (template: LabelTemplate) => {
    const copyName = `${template.name} (Copie ${Date.now().toString().slice(-4)})`;
    const duplicated: LabelTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      name: copyName,
      items: (template.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    const nextTemplates = [duplicated, ...templates];
    saveTemplates(nextTemplates);
    setActiveTemplate(duplicated);
    AuditLogService.append({
      user: 'Opérateur Local',
      action: 'DUPLICATION_GABARIT',
      template_name: copyName,
      details: `Gabarit dupliqué depuis : ${template.name}`,
    });
  };

  const handleDeleteTemplate = (templateName: string) => {
    const nextTemplates = templates.filter((t) => t.name !== templateName);
    saveTemplates(nextTemplates);
    if (activeTemplate?.name === templateName) {
      setActiveTemplate(nextTemplates[0] || null);
    }
    AuditLogService.append({
      user: 'Opérateur Local',
      action: 'SUPPRESSION_GABARIT',
      template_name: templateName,
      details: `Gabarit supprimé : ${templateName}`,
    });
  };

  const handleImportTemplate = (imported: LabelTemplate) => {
    const sanitized: LabelTemplate = {
      ...imported,
      items: (imported.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    const nextTemplates = [sanitized, ...templates.filter((t) => t.name !== sanitized.name)];
    saveTemplates(nextTemplates);
    setActiveTemplate(sanitized);
    AuditLogService.append({
      user: 'Opérateur Local',
      action: 'IMPORT_GABARIT',
      template_name: sanitized.name,
      details: `Gabarit importé : ${sanitized.name}`,
    });
  };

  const handleCreateNewTemplate = (newTemplate: LabelTemplate) => {
    const sanitized: LabelTemplate = {
      ...newTemplate,
      items: (newTemplate.items || []).map((it) => sanitizeNonPriceElement(it)),
    };
    const nextTemplates = [sanitized, ...templates];
    saveTemplates(nextTemplates);
    setActiveTemplate(sanitized);
    setIsNewWizardOpen(false);
    navigationService.navigateTo('editor', { template: sanitized.name });
    AuditLogService.append({
      user: 'Opérateur Local',
      action: 'CREATION_GABARIT',
      template_name: newTemplate.name,
      details: `Nouveau gabarit créé : ${newTemplate.name} (${newTemplate.width_mm}x${newTemplate.height_mm}mm)`,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <AppTopNavigationBar
        currentView={currentView}
        activeTemplate={activeTemplate}
        templates={templates}
        totalProductsCount={productsCount}
        onNavigate={handleNavigate}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenFontManager={() => setIsFontManagerOpen(true)}
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenMappingDictionary={() => setIsMappingDictOpen(true)}
        onOpenPreferences={() => setIsPreferencesOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 flex min-h-0 min-w-0 overflow-hidden relative">
        {currentView === 'home' && (
          <HomeDashboard
            templates={templates}
            onSelectTemplateToEdit={handleSelectTemplateToEdit}
            onSelectTemplateToGenerate={(t) => handleSelectTemplateToGenerate(t)}
            onOpenNewWizard={() => setIsNewWizardOpen(true)}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onImportTemplate={handleImportTemplate}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
            onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
            onOpenFontManager={() => setIsFontManagerOpen(true)}
            onOpenMappingDictionary={() => setIsMappingDictOpen(true)}
            onOpenCatalog={() => handleNavigate('catalog')}
          />
        )}

        {currentView === 'editor' && (
          <TemplateEditor
            initialTemplate={activeTemplate || {
              schema_version: 1,
              name: 'Nouveau Gabarit',
              width_mm: 100,
              height_mm: 50,
              inner_margins_mm: { top: 2, bottom: 2, left: 2, right: 2 },
              outer_margins_mm: { top: 1, bottom: 1, left: 1, right: 1 },
              bg_color: '#FFFFFF',
              bg_opacity: 1,
              items: [],
            }}
            onSaveTemplate={handleSaveTemplate}
            onBackToHome={() => handleNavigate('home')}
            onOpenGeneration={(t) => handleSelectTemplateToGenerate(t)}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />
        )}

        {currentView === 'generation' && (
          <GenerationWorkspace
            template={activeTemplate || {
              schema_version: 1,
              name: 'Gabarit Standard',
              width_mm: 100,
              height_mm: 50,
              inner_margins_mm: { top: 2, bottom: 2, left: 2, right: 2 },
              outer_margins_mm: { top: 1, bottom: 1, left: 1, right: 1 },
              bg_color: '#FFFFFF',
              bg_opacity: 1,
              items: [],
            }}
            onBack={() => handleNavigate('home')}
            initialProducts={generationProducts}
            initialBatchName={generationBatchName}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogManagementStudio
            onBack={() => handleNavigate('home')}
            templates={templates}
            onGenerateFromDatabase={(selectedItems) => {
              if (templates.length === 0) {
                alert('Veuillez d\'abord créer un gabarit d\'étiquette avant de lancer la génération.');
                handleNavigate('home');
                return;
              }
              const defaultTemplate = activeTemplate || templates[0];
              handleSelectTemplateToGenerate(defaultTemplate, selectedItems, 'Sélection Catalogue');
            }}
          />
        )}
      </main>

      {/* Global Modals */}
      <NewGabaritWizard
        isOpen={isNewWizardOpen}
        onClose={() => setIsNewWizardOpen(false)}
        onCreate={handleCreateNewTemplate}
      />

      <OmniChannelStudioModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        currentTemplateName={activeTemplate?.name}
      />

      <AuditTrailModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <FontManagerModal
        isOpen={isFontManagerOpen}
        onClose={() => setIsFontManagerOpen(false)}
      />

      <MappingDictionaryModal
        isOpen={isMappingDictOpen}
        onClose={() => setIsMappingDictOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AccessibilityPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProviders>
      <TooltipProvider>
        <MappingDictionaryProvider>
          <MainWorkspace />
        </MappingDictionaryProvider>
      </TooltipProvider>
    </AppProviders>
  );
}
