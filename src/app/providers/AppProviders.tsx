import React, { createContext, useContext, useMemo, useState } from 'react';
import { ProductRecord } from '../../domains/catalog/ProductRecord';
import { SyncJob } from '../../domains/sync/syncContracts';
import { LabelTemplate } from '../../domains/templates/Template';
import { createAppStoreSnapshot } from '../store/appStore';

interface AppStoreContextValue {
  templates: LabelTemplate[];
  products: ProductRecord[];
  syncJobs: SyncJob[];
  updateTemplate: (template: LabelTemplate) => void;
  addTemplate: (template: LabelTemplate) => void;
  setProducts: (products: ProductRecord[]) => void;
  setSyncJobs: (jobs: SyncJob[]) => void;
}

const AppStoreContext = createContext<AppStoreContextValue | undefined>(undefined);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => createAppStoreSnapshot(), []);

  const [templates, setTemplates] = useState<LabelTemplate[]>(initial.templates);
  const [products, setProducts] = useState<ProductRecord[]>(initial.products);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(initial.syncJobs);

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
