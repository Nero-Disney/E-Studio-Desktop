import React, { createContext, useContext, useMemo, useState } from 'react';
import { ProductRecord } from '../../domains/catalog/ProductRecord';
import { LabelTemplate } from '../../domains/templates/Template';
import { createAppStoreSnapshot, SyncJobSummary } from '../store/appStore';

export type { SyncJobSummary };

interface AppStoreContextValue {
  templates: LabelTemplate[];
  products: ProductRecord[];
  syncJobs: SyncJobSummary[];
  updateTemplate: (template: LabelTemplate) => void;
  addTemplate: (template: LabelTemplate) => void;
  setProducts: (products: ProductRecord[]) => void;
  setSyncJobs: (jobs: SyncJobSummary[]) => void;
}

const AppStoreContext = createContext<AppStoreContextValue | undefined>(undefined);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => createAppStoreSnapshot(), []);

  const [templates, setTemplates] = useState<LabelTemplate[]>(initial.templates);
  const [products, setProducts] = useState<ProductRecord[]>(initial.products);
  const [syncJobs, setSyncJobs] = useState<SyncJobSummary[]>(initial.syncJobs);

  const value = useMemo<AppStoreContextValue>(
    () => ({
      templates,
      products,
      syncJobs,
      updateTemplate: (template) => {
        setTemplates((current) =>
          current.map((item) => (item.id === template.id ? template : item))
        );
      },
      addTemplate: (template) => {
        setTemplates((current) => [template, ...current]);
      },
      setProducts,
      setSyncJobs,
    }),
    [templates, products, syncJobs]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProviders');
  }
  return context;
}
