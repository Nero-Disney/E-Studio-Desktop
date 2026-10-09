export type ExportFormat = 'pdf' | 'pptx' | 'zpl' | 'json';

export interface ExportJob {
  id: string;
  templateId: string;
  format: ExportFormat;
  status: 'queued' | 'generating' | 'ready' | 'failed';
  fileName: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}
