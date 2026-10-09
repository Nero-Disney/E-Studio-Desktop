import { ProductRecord } from '../types';

export interface ImportReport {
  id: string;
  timestamp: string;
  filename: string;
  totalRowsRead: number;
  importedCount: number;
  updatedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  warnings: string[];
}

export interface WorkspaceExportData {
  version: string;
  exportedAt: string;
  catalog: {
    products: ProductRecord[];
    importHistory: ImportReport[];
  };
  templates?: any[];
}

const CATALOG_STORAGE_KEY = 'estudio_workspace_catalog_v1';
const IMPORT_HISTORY_KEY = 'estudio_workspace_import_history_v1';

class CatalogRepository {
  private products: ProductRecord[] = [];
  private searchIndices: string[] = [];
  private listeners: Array<(products: ProductRecord[]) => void> = [];
  private importReports: ImportReport[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(CATALOG_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            this.products = parsed;
          }
        }
        const historySaved = localStorage.getItem(IMPORT_HISTORY_KEY);
        if (historySaved) {
          const parsedHistory = JSON.parse(historySaved);
          if (Array.isArray(parsedHistory)) {
            this.importReports = parsedHistory;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load local catalog workspace', e);
      this.products = [];
    }
    this.rebuildIndex();
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(this.products));
        localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(this.importReports.slice(0, 50)));
      }
    } catch (e) {
      console.error('Failed to persist catalog workspace', e);
    }
    this.rebuildIndex();
    this.notify();
  }

  private rebuildIndex() {
    this.searchIndices = this.products.map((p) => {
      const tokens = [
        p.ITEMNAME,
        p.PRODUCT_SCAN,
        p.PARTNO,
        p.BRAND_INFO,
        p.VENDOR_NAME,
        p.DEPT_NAME,
        p.CATEGORY_NAME,
        p.STORE_NAME,
      ].filter(Boolean);
      return tokens.join(' ').toLowerCase();
    });
  }

  private notify() {
    const list = [...this.products];
    this.listeners.forEach((l) => {
      try {
        l(list);
      } catch (err) {
        console.error('Error in catalog listener', err);
      }
    });
  }

  public subscribe(listener: (products: ProductRecord[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.products]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getProducts(): ProductRecord[] {
    return [...this.products];
  }

  public getProductById(id: string): ProductRecord | undefined {
    return this.products.find((p) => p.id === id || p.PRODUCT_SCAN === id || p.PARTNO === id);
  }

  public search(query: string, department?: string): ProductRecord[] {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery && !department) {
      return [...this.products];
    }

    const words = cleanQuery.split(/\s+/).filter(Boolean);
    const results: ProductRecord[] = [];

    for (let i = 0; i < this.products.length; i++) {
      const prod = this.products[i];
      if (department && department !== 'all') {
        const prodDept = (prod.DEPT_NAME || prod.CATEGORY_NAME || '').toLowerCase();
        if (prodDept !== department.toLowerCase()) continue;
      }

      if (words.length === 0) {
        results.push(prod);
        continue;
      }

      const index = this.searchIndices[i] || '';
      const matchesAll = words.every((w) => index.includes(w));
      if (matchesAll) {
        results.push(prod);
      }
    }

    return results;
  }

  public saveToMasterDatabase(
    incomingProducts: ProductRecord[],
    mode: 'merge_update' | 'replace' | 'keep_existing' | 'update_upsert' | 'overwrite' | 'append' = 'merge_update'
  ): { totalCount: number; updatedCount: number; addedCount: number } {
    let updatedCount = 0;
    let addedCount = 0;

    const isReplace = mode === 'replace' || mode === 'overwrite';
    const isAppendOnly = mode === 'append' || mode === 'keep_existing';

    if (isReplace) {
      this.products = [...incomingProducts];
      addedCount = incomingProducts.length;
    } else {
      const map = new Map<string, ProductRecord>();
      this.products.forEach((p) => {
        const key = p.PARTNO || p.PRODUCT_SCAN || p.id;
        map.set(key, p);
      });

      incomingProducts.forEach((prod) => {
        const key = prod.PARTNO || prod.PRODUCT_SCAN || prod.id;
        const existing = map.get(key);
        if (existing) {
          if (!isAppendOnly) {
            map.set(key, { ...existing, ...prod });
            updatedCount++;
          }
        } else {
          map.set(key, prod);
          addedCount++;
        }
      });
      this.products = Array.from(map.values());
    }

    this.saveToStorage();
    return {
      totalCount: this.products.length,
      updatedCount,
      addedCount,
    };
  }

  public commitImport(
    importedRecords: ProductRecord[],
    report: ImportReport,
    mode: 'merge_update' | 'replace' = 'merge_update'
  ) {
    if (mode === 'replace') {
      this.products = [...importedRecords];
    } else {
      // Merge by PARTNO or PRODUCT_SCAN or ID
      const map = new Map<string, ProductRecord>();
      // First populate existing
      this.products.forEach((p) => {
        const key = p.PARTNO || p.PRODUCT_SCAN || p.id;
        map.set(key, p);
      });
      // Then merge / update with imported records preserving non-blank fields
      importedRecords.forEach((imp) => {
        const key = imp.PARTNO || imp.PRODUCT_SCAN || imp.id;
        const existing = map.get(key);
        if (existing) {
          map.set(key, { ...existing, ...imp });
        } else {
          map.set(key, imp);
        }
      });
      this.products = Array.from(map.values());
    }

    this.importReports.unshift(report);
    this.saveToStorage();
  }

  public deleteProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    this.saveToStorage();
  }

  public clearCatalog() {
    this.products = [];
    this.saveToStorage();
  }

  public getImportReports(): ImportReport[] {
    return [...this.importReports];
  }

  public exportWorkspaceJson(): string {
    const data: WorkspaceExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      catalog: {
        products: this.products,
        importHistory: this.importReports,
      },
    };
    return JSON.stringify(data, null, 2);
  }

  public importWorkspaceJson(jsonStr: string): { success: boolean; message: string; count?: number } {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.catalog && Array.isArray(parsed.catalog.products)) {
        this.products = parsed.catalog.products;
        if (Array.isArray(parsed.catalog.importHistory)) {
          this.importReports = parsed.catalog.importHistory;
        }
        this.saveToStorage();
        return {
          success: true,
          message: `Espace de travail importé avec succès (${this.products.length} articles).`,
          count: this.products.length,
        };
      }
      return { success: false, message: 'Structure de fichier de sauvegarde invalide.' };
    } catch (e: any) {
      return { success: false, message: `Erreur de lecture : ${e.message || 'JSON invalide'}` };
    }
  }
}

export const catalogRepository = new CatalogRepository();
// Backward compatibility alias for parts of the app expecting databaseService
export const databaseService = catalogRepository;
