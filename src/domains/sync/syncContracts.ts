export type SyncJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'needs_review';

export interface SyncJob {
  id: string;
  type: 'product_import' | 'template_sync' | 'mobile_lot' | 'catalog_pull';
  status: SyncJobStatus;
  createdAt: string;
  updatedAt: string;
  sourceDeviceId?: string;
  destinationDeviceId?: string;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface SyncSession {
  id: string;
  deviceId: string;
  deviceName: string;
  startedAt: string;
  lastSeenAt: string;
  status: 'connected' | 'offline' | 'paired' | 'error';
  token?: string;
}
