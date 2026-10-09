import React, { useMemo, useState } from 'react';
import { appSections, AppSection } from '../routes';
import { WorkspaceHeader } from './WorkspaceHeader';
import { DashboardScreen } from '../../features/dashboard/DashboardScreen';
import { TemplateEditorScreen } from '../../features/template-editor/TemplateEditorScreen';
import { GenerationScreen } from '../../features/generation/GenerationScreen';
import { CatalogScreen } from '../../features/catalog/CatalogScreen';
import { MobileSyncScreen } from '../../features/mobile-sync/MobileSyncScreen';
import { RulesEngineScreen } from '../../features/rules-engine/RulesEngineScreen';

export function AppShell() {
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');

  const content = useMemo(() => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'template-editor':
        return <TemplateEditorScreen />;
      case 'generation':
        return <GenerationScreen />;
      case 'catalog':
        return <CatalogScreen />;
      case 'mobile-sync':
        return <MobileSyncScreen />;
      case 'rules-engine':
        return <RulesEngineScreen />;
      default:
        return <DashboardScreen />;
    }
  }, [activeSection]);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      <aside className="w-72 border-r border-slate-200 bg-slate-950 text-slate-100">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
            E
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              Studio
            </div>
            <div className="text-lg font-bold text-white">E-Studio</div>
          </div>
        </div>

        <nav className="space-y-2 p-3">
          {appSections.map((section) => {
            const active = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-start justify-between rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? 'border-blue-500 bg-blue-600/15 text-white shadow-inner shadow-blue-500/20'
                    : 'border-transparent bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold">{section.label}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{section.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <WorkspaceHeader section={activeSection} />
        <div className="flex-1 overflow-auto p-6">{content}</div>
      </main>
    </div>
  );
}
