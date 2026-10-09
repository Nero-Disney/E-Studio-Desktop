export type AppSection =
  | 'dashboard'
  | 'template-editor'
  | 'generation'
  | 'catalog'
  | 'mobile-sync'
  | 'rules-engine';

export interface AppSectionMeta {
  id: AppSection;
  label: string;
  description: string;
}

export const appSections: AppSectionMeta[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Operational overview and entry points',
  },
  {
    id: 'template-editor',
    label: 'Template Editor',
    description: 'Design and validate label layouts',
  },
  {
    id: 'generation',
    label: 'Generation',
    description: 'Import, map and prepare print jobs',
  },
  {
    id: 'catalog',
    label: 'Catalog',
    description: 'Unified product database and data hygiene',
  },
  {
    id: 'mobile-sync',
    label: 'Mobile Sync',
    description: 'Device intake and lot synchronization',
  },
  {
    id: 'rules-engine',
    label: 'Rules Engine',
    description: 'Business automation and display logic',
  },
];

export function getSectionMeta(section: AppSection): AppSectionMeta {
  return appSections.find((item) => item.id === section) ?? appSections[0];
}
