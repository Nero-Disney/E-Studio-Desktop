import React, { useState, useEffect, useCallback } from 'react';
import { TooltipProvider } from '../context/TooltipContext';
import { MappingDictionaryProvider } from '../context/MappingDictionaryContext';
import { AppProviders } from './providers/AppProviders';
import { AppTopNavigationBar } from '../components/AppTopNavigationBar';
import { HomeDashboard } from '../components/HomeDashboard';
import { TemplateEditor } from '../components/TemplateEditor';
import { GenerationWorkspace } from '../components/GenerationWorkspace';
import { MasterDatabaseStudio } from '../components/MasterDatabaseStudio';
import { MobileTerminalView } from '../pwa/components/MobileTerminalView';
import { MobileSyncHubModal } from '../pwa/components/MobileSyncHubModal';
import { OmniChannelStudioModal } from '../components/OmniChannelStudioModal';
import { NewGabaritWizard } from '../components/NewGabaritWizard';
import { AuditTrailModal } from '../components/AuditTrailModal';
import { FontManagerModal } from '../components/FontManagerModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { MappingDictionaryModal } from '../components/MappingDictionaryModal';
import { AccessibilityPreferencesModal } from '../components/AccessibilityPreferencesModal';
import { LabelTemplate, ProductRecord } from '../types';
import { DEFAULT_TEMPLATES } from '../defaultTemplates';
import { databaseService } from '../services/databaseService';
import { navigationService, AppView } from '../services/navigationService';
import { mobileSyncService } from '../pwa/services/mobileSyncService';
import { OfflineStorageManager } from '../utils/offlineStorage';

const TEMPLATES_STORAGE_KEY = 'estudio_saved_templates_v2';

function MainWorkspace() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [templates, setTemplates] = useState<LabelTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved templates', e);
    }
    return DEFAULT_TEMPLATES;
  });

  const [activeTemplate, setActiveTemplate] = useState<LabelTemplate | null>(() => templates[0] || null);
  const [generationProducts, setGenerationProducts] = useState<ProductRecord[] | undefined>(undefined);
  const [generationBatchName, setGenerationBatchName] = useState<string | undefined>(undefined);

  // Database products count
  const [productsCount, setProductsCount] = useState<number>(() => databaseService.getProducts().length);
  const [isTursoConfigured, setIsTursoConfigured] = useState<boolean>(() => databaseService.getTursoConfig().enabled);

  // Mobile pending lots count
  const getPendingLots = () =>
    mobileSyncService.getLots().filter((l) => l.status === 'ready' || l.status === 'received').length;
  const [pendingLotsCount, setPendingLotsCount] = useState<number>(getPendingLots);

  // Modals state
  const [isNewWizardOpen, setIsNewWizardOpen] = useState(false);
  const [isMobileSyncOpen, setIsMobileSyncOpen] = useState(false);
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

  // Subscribe to Database Service changes
  useEffect(() => {
    const unsub = databaseService.subscribe((products) => {
      setProductsCount(products.length);
      setIsTursoConfigured(databaseService.getTursoConfig().enabled);
    });
    return () => unsub();
  }, []);

  // Subscribe to Mobile Sync Service
  useEffect(() => {
    const unsub = mobileSyncService.subscribe(() => {
      setPendingLotsCount(getPendingLots());
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
    const existingIndex = templates.findIndex((t) => t.name === updated.name);
    let nextTemplates: LabelTemplate[];
    if (existingIndex >= 0) {
      nextTemplates = [...templates];
      nextTemplates[existingIndex] = updated;
    } else {
      nextTemplates = [updated, ...templates];
    }
    saveTemplates(nextTemplates);
    setActiveTemplate(updated);
    OfflineStorageManager.appendAuditLog({
      user: 'Opérateur Studio',
      action: 'MODIFICATION_GABARIT',
      template_name: updated.name,
      details: `Gabarit sauvegardé : ${updated.name} (${updated.items.length} éléments)`,
    });
  };

  const handleDuplicateTemplate = (template: LabelTemplate) => {
    const copyName = `${template.name} (Copie ${Date.now().toString().slice(-4)})`;
    const duplicated: LabelTemplate = {
      ...JSON.parse(JSON.stringify(template)),
      name: copyName,
    };
    const nextTemplates = [duplicated, ...templates];
    saveTemplates(nextTemplates);
    setActiveTemplate(duplicated);
    OfflineStorageManager.appendAuditLog({
      user: 'Opérateur Studio',
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
    OfflineStorageManager.appendAuditLog({
      user: 'Opérateur Studio',
      action: 'SUPPRESSION_GABARIT',
      template_name: templateName,
      details: `Gabarit supprimé : ${templateName}`,
    });
  };

  const handleImportTemplate = (imported: LabelTemplate) => {
    const nextTemplates = [imported, ...templates.filter((t) => t.name !== imported.name)];
    saveTemplates(nextTemplates);
    setActiveTemplate(imported);
    OfflineStorageManager.appendAuditLog({
      user: 'Opérateur Studio',
      action: 'IMPORT_GABARIT',
      template_name: imported.name,
      details: `Gabarit importé : ${imported.name}`,
    });
  };

  const handleCreateNewTemplate = (newTemplate: LabelTemplate) => {
    const nextTemplates = [newTemplate, ...templates];
    saveTemplates(nextTemplates);
    setActiveTemplate(newTemplate);
    setIsNewWizardOpen(false);
    navigationService.navigateTo('editor', { template: newTemplate.name });
    OfflineStorageManager.appendAuditLog({
      user: 'Opérateur Studio',
      action: 'CREATION_GABARIT',
      template_name: newTemplate.name,
      details: `Nouveau gabarit créé : ${newTemplate.name} (${newTemplate.width_mm}x${newTemplate.height_mm}mm)`,
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Unified Top Navigation Bar (Except in standalone mobile view) */}
      {currentView !== 'mobile' && (
        <AppTopNavigationBar
          currentView={currentView}
          activeTemplate={activeTemplate}
          templates={templates}
          totalProductsCount={productsCount}
          pendingLotsCount={pendingLotsCount}
          isTursoConfigured={isTursoConfigured}
          onNavigate={handleNavigate}
          onOpenMobileSync={() => setIsMobileSyncOpen(true)}
          onOpenMasterDatabase={() => handleNavigate('database')}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
          onOpenFontManager={() => setIsFontManagerOpen(true)}
          onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
          onOpenMappingDictionary={() => setIsMappingDictOpen(true)}
          onOpenPreferences={() => setIsPreferencesOpen(true)}
        />
      )}

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
            onOpenMobileSync={() => setIsMobileSyncOpen(true)}
            onOpenMasterDatabase={() => handleNavigate('database')}
            pendingLotsCount={pendingLotsCount}
          />
        )}

        {currentView === 'editor' && (
          <TemplateEditor
            initialTemplate={activeTemplate || templates[0]}
            onSaveTemplate={handleSaveTemplate}
            onBackToHome={() => handleNavigate('home')}
            onOpenGeneration={(t) => handleSelectTemplateToGenerate(t)}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />
        )}

        {currentView === 'generation' && (
          <GenerationWorkspace
            template={activeTemplate || templates[0]}
            onBack={() => handleNavigate('home')}
            initialProducts={generationProducts}
            initialBatchName={generationBatchName}
          />
        )}

        {currentView === 'database' && (
          <MasterDatabaseStudio
            onBack={() => handleNavigate('home')}
            templates={templates}
            onGenerateFromDatabase={(selectedItems) => {
              const defaultTemplate = activeTemplate || templates[0];
              handleSelectTemplateToGenerate(defaultTemplate, selectedItems, 'Sélection Base Articles');
            }}
          />
        )}

        {currentView === 'mobile' && (
          <MobileTerminalView
            templates={templates}
            onBackToDesktop={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Global Modals */}
      <NewGabaritWizard
        isOpen={isNewWizardOpen}
        onClose={() => setIsNewWizardOpen(false)}
        onCreate={handleCreateNewTemplate}
      />

      <MobileSyncHubModal
        isOpen={isMobileSyncOpen}
        onClose={() => setIsMobileSyncOpen(false)}
        templates={templates}
        onGenerateLot={(lot) => {
          setIsMobileSyncOpen(false);
          const targetTemplate =
            templates.find((t) => t.name === lot.targetTemplateId) || activeTemplate || templates[0];
          // Convert lot items to ProductRecords
          const lotProducts: ProductRecord[] = lot.items.map((item) => ({
            id: item.id,
            PRODUCT_SCAN: item.code,
            ITEMNAME: item.designation || 'Article Scanné',
            SELLING_PRICE: item.price || 0,
            PROMOPRICE: item.promoPrice,
            PARTNO: item.code,
            STORE_NAME: 'Terminal Mobile',
          }));
          handleSelectTemplateToGenerate(targetTemplate, lotProducts, lot.name);
        }}
        onOpenInEditor={(templateName) => {
          setIsMobileSyncOpen(false);
          const t = templates.find((tpl) => tpl.name === templateName);
          if (t) handleSelectTemplateToEdit(t);
        }}
        onOpenMobileSimulator={() => {
          setIsMobileSyncOpen(false);
          handleNavigate('mobile');
        }}
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
