import { ProductRecord } from '../../domains/catalog/ProductRecord';
import { LabelTemplate } from '../../domains/templates/Template';

export interface SyncJobSummary {
  id: string;
  stationName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  lotCount: number;
  timestamp: string;
}

export interface AppStoreSnapshot {
  templates: LabelTemplate[];
  products: ProductRecord[];
  syncJobs: SyncJobSummary[];
}

export function createAppStoreSnapshot(): AppStoreSnapshot {
  return {
    templates: [],
    products: [],
    syncJobs: [],
  };
}
