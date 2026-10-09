import { AuditLogEntry } from '../types';

const AUDIT_LOGS_STORAGE_KEY = 'estudio_desktop_audit_logs_v1';

export class AuditLogService {
  public static append(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    try {
      const logs = this.getAll();
      logs.unshift(fullEntry);
      // Keep maximum 500 audit events locally
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 500)));
    } catch (e) {
      console.warn('Failed to persist audit log', e);
    }
    return fullEntry;
  }

  public static getAll(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static clear(): void {
    localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
  }
}
