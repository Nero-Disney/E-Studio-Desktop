import { LabelTemplate, ProductRecord, AuditLogEntry } from '../types';

export interface PendingSyncItem {
  id: string;
  timestamp: string;
  type: 'template_update' | 'print_job' | 'product_override' | 'rule_change';
  payload: any;
}

const STORAGE_KEYS = {
  TEMPLATES: 'estudio_offline_templates',
  PENDING_SYNC: 'estudio_offline_pending_sync',
  PRINT_HISTORY: 'estudio_offline_print_history',
  AUDIT_LOGS: 'estudio_offline_audit_logs',
};

export class OfflineStorageManager {
  private static isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private static listeners: Array<(online: boolean) => void> = [];

  static init() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processPendingSync();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  static getStatus(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  static subscribe(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(cb => cb(this.isOnline));
  }

  // Pending Sync Operations
  static queuePendingSync(type: PendingSyncItem['type'], payload: any) {
    try {
      const existing = this.getPendingSyncQueue();
      const item: PendingSyncItem = {
        id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        type,
        payload,
      };
      existing.push(item);
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to queue pending sync', e);
    }
  }

  static getPendingSyncQueue(): PendingSyncItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static clearPendingSync() {
    localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
  }

  static processPendingSync() {
    const queue = this.getPendingSyncQueue();
    if (queue.length === 0) return;
    console.log(`[Offline Sync] Reconnected! Synchronizing ${queue.length} pending items...`);
    // Simulate remote cloud sync
    setTimeout(() => {
      this.clearPendingSync();
    }, 800);
  }

  // Audit Logs Persistence
  static appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    try {
      const logs = this.getAuditLogs();
      logs.unshift(fullEntry);
      // Keep max 200 logs
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.error('Failed to save audit log', e);
    }
    return fullEntry;
  }

  static getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

OfflineStorageManager.init();
