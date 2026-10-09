import {
  MobileScanLot,
  MobileScanItem,
  SyncConnectionConfig,
  MobileSyncMessage,
  PWACredentials,
  NetworkConnectionMode,
  EstudioPairV2Payload,
  MobileTablePayload,
  MobileTableItem,
  CatalogSyncItem,
  HandshakeResponse,
} from '../types';
import { ProductRecord } from '../../types';
import {
  sha256,
  generateSecureCredentials,
  createEncryptedPairingPayload,
  createEstudioPairV2Payload,
  createEstudioPairV2Uri,
} from '../crypto';

const STORAGE_LOTS_KEY = 'estudio_pwa_lots_v2';
const STORAGE_CONFIG_KEY = 'estudio_pwa_sync_config_v2';
const BROADCAST_CHANNEL_NAME = 'estudio_mobile_sync_bus_v2';

const SAMPLE_MOBILE_LOTS: MobileScanLot[] = [
  {
    id: 'TB-849201',
    tableId: 'TB-849201',
    name: 'Changement Prix Épicerie',
    department: 'Épicerie',
    colorTag: 'GREEN',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    operatorName: 'Jean Dupont',
    deviceName: 'Terminal Rayon 03 (Android)',
    deviceType: 'android',
    status: 'ready',
    targetTemplateId: 'Étiquette Rayon Classique (50x30 mm)',
    syncMethod: 'direct_lan',
    totalLabelsCount: 15,
    items: [
      {
        id: 'item_01',
        code: '3017620422003',
        designation: 'Nutella Pâte à Tartiner 400g',
        price: 3.89,
        promoPrice: 3.29,
        quantity: 5,
        facing: 2,
        scannedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        note: 'Sticker promo -15% à apposer',
      },
      {
        id: 'item_02',
        code: '5449000000996',
        designation: 'Coca-Cola Original 1.5L',
        price: 1.95,
        quantity: 10,
        facing: 4,
        scannedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      },
    ],
  },
  {
    id: 'TB-920412',
    tableId: 'TB-920412',
    name: 'Arrivage Boissons & Jus Frais',
    department: 'Boissons',
    colorTag: 'BLUE',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    operatorName: 'Sébastien M.',
    deviceName: 'Terminal Zebra TC26 (Android DataWedge)',
    deviceType: 'native_terminal',
    status: 'received',
    targetTemplateId: 'Étiquette Promotionnelle Rouge (70x40 mm)',
    syncMethod: 'direct_lan',
    totalLabelsCount: 10,
    items: [
      {
        id: 'item_m4',
        code: '3250390667788',
        designation: "Jus d'Orange Pur Jus Sans Pulpe 1L",
        price: 2.19,
        promoPrice: 1.79,
        quantity: 6,
        facing: 2,
        scannedAt: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
      },
      {
        id: 'item_m5',
        code: '3250390112233',
        designation: 'Limonade Artisanale Citron Bio 75cl',
        price: 1.89,
        quantity: 4,
        facing: 1,
        scannedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      },
    ],
  },
];

class MobileSyncService {
  private lots: MobileScanLot[] = [];
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Array<(lots: MobileScanLot[]) => void> = [];
  private config: SyncConnectionConfig;
  private sseEventSource: EventSource | null = null;

  constructor() {
    this.config = this.loadConfig();
    this.lots = this.loadLots();
    this.initBroadcastChannel();
    this.initServerEvents();

    // Ensure credentials have SHA-256 token
    if (!this.config.credentials?.sessionToken) {
      this.regenerateCredentials();
    }
  }

  private loadConfig(): SyncConnectionConfig {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load sync config', e);
    }

    const stationId = 'PC-CAISSE-01';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const hostname = typeof window !== 'undefined' ? window.location.hostname || '192.168.1.45' : '192.168.1.45';
    const port = typeof window !== 'undefined' ? Number(window.location.port) || 3000 : 3000;

    const initialCredentials: PWACredentials = {
      instanceId: stationId,
      instanceName: 'Poste Caisse Centrale',
      sessionToken: 'a1b2c3d4e5f67890abcdef99887766554433221100',
      authPin: '1234',
      secretSalt: 'salt_caisse_centrale_sec_99',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    };

    return {
      instanceId: stationId,
      instanceName: 'Poste Caisse Centrale',
      storeName: 'Hypermarché Central',
      hostAddress: hostname,
      port,
      publicHostUrl: origin,
      connectionMode: 'internet_public', // universally accessible URL
      credentials: initialCredentials,
      allowLanDiscovery: true,
      allowCellularTunnel: true,
      saveDataOnMetered: true,
      mdnsServiceName: '_estudio-desktop._tcp.local.',
      udpDiscoveryPort: 8081,
    };
  }

  public async regenerateCredentials(): Promise<PWACredentials> {
    const creds = await generateSecureCredentials(this.config.instanceId, this.config.instanceName);
    this.config.credentials = creds;
    this.saveConfig({ credentials: creds });
    return creds;
  }

  public saveConfig(newConfig: Partial<SyncConnectionConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.error(e);
    }
  }

  public getConfig(): SyncConnectionConfig {
    return { ...this.config };
  }

  private loadLots(): MobileScanLot[] {
    try {
      const saved = localStorage.getItem(STORAGE_LOTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load lots', e);
    }
    return SAMPLE_MOBILE_LOTS;
  }

  private persistLots() {
    try {
      localStorage.setItem(STORAGE_LOTS_KEY, JSON.stringify(this.lots));
    } catch (e) {
      console.error('Failed to persist lots', e);
    }
    this.notifyListeners();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event: MessageEvent<MobileSyncMessage>) => {
          const msg = event.data;
          if (!msg || msg.senderInstanceId === this.config.instanceId) return;

          if (msg.type === 'LOT_PUSH' && msg.payload) {
            this.handleIncomingRemoteLot(msg.payload as MobileScanLot);
          } else if (msg.type === 'TABLE_IMPORT' && msg.payload) {
            this.importTablePayload(msg.payload as MobileTablePayload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error', e);
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_LOTS_KEY && e.newValue) {
          try {
            this.lots = JSON.parse(e.newValue);
            this.notifyListeners();
          } catch {}
        }
      });
    }
  }

  private initServerEvents() {
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        this.sseEventSource = new EventSource('/api/v2/events');
        this.sseEventSource.addEventListener('TABLE_IMPORTED', (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.table) {
              this.importTablePayload(data.table);
            }
          } catch (err) {
            console.warn('Error parsing TABLE_IMPORTED event', err);
          }
        });
      } catch (err) {
        // Dev server or environment without SSE
      }
    }
  }

  private handleIncomingRemoteLot(lot: MobileScanLot) {
    const existingIndex = this.lots.findIndex((l) => l.id === lot.id);
    if (existingIndex >= 0) {
      this.lots[existingIndex] = lot;
    } else {
      this.lots.unshift(lot);
    }
    try {
      localStorage.setItem(STORAGE_LOTS_KEY, JSON.stringify(this.lots));
    } catch {}
    this.notifyListeners();
  }

  public subscribe(listener: (lots: MobileScanLot[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getLots());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const current = this.getLots();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (e) {
        console.error('Error in lot subscriber', e);
      }
    });
  }

  public getLots(): MobileScanLot[] {
    return [...this.lots];
  }

  public getLotById(id: string): MobileScanLot | undefined {
    return this.lots.find((l) => l.id === id || l.tableId === id);
  }

  public saveLot(lot: MobileScanLot, broadcast: boolean = true) {
    const existingIndex = this.lots.findIndex((l) => l.id === lot.id || (lot.tableId && l.tableId === lot.tableId));
    if (existingIndex >= 0) {
      this.lots[existingIndex] = lot;
    } else {
      this.lots.unshift(lot);
    }
    this.persistLots();

    if (broadcast && this.broadcastChannel) {
      const msg: MobileSyncMessage = {
        type: 'LOT_PUSH',
        payload: lot,
        senderInstanceId: this.config.instanceId,
        timestamp: new Date().toISOString(),
      };
      this.broadcastChannel.postMessage(msg);
    }
  }

  /**
   * Imports a Table payload complying with V2.0 Mobile Specification (POST /api/v2/tables/import)
   */
  public importTablePayload(table: MobileTablePayload): MobileScanLot {
    const convertedItems: MobileScanItem[] = (table.items || []).map((it) => ({
      id: it.id || `it_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: it.barcode,
      designation: it.designation,
      price: it.regularPrice,
      promoPrice: it.discountPrice ?? undefined,
      quantity: it.quantity || 1,
      facing: it.facing || 1,
      targetTemplateId: it.templateId,
      scannedAt: it.scannedAt ? new Date(it.scannedAt).toISOString() : new Date().toISOString(),
    }));

    const totalLabelsCount =
      table.totalLabelsCount ||
      convertedItems.reduce((sum, it) => sum + (it.quantity || 1), 0);

    const lot: MobileScanLot = {
      id: table.tableId || `TB-${Date.now()}`,
      tableId: table.tableId,
      name: table.tableName || 'Table Scans Mobile',
      department: table.department || 'Épicerie',
      colorTag: table.colorTag || 'GREEN',
      createdAt: table.createdAt ? new Date(table.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: table.exportedAt ? new Date(table.exportedAt).toISOString() : new Date().toISOString(),
      operatorName: table.operatorName || 'Jean Dupont',
      deviceName: 'Terminal Mobile Android (V2 Interop)',
      deviceType: 'android',
      status: 'received',
      targetTemplateId: table.items?.[0]?.templateId || 'Étiquette Rayon Classique (50x30 mm)',
      syncMethod: 'direct_lan',
      totalLabelsCount,
      items: convertedItems,
    };

    this.saveLot(lot, true);
    return lot;
  }

  public deleteLot(id: string) {
    this.lots = this.lots.filter((l) => l.id !== id && l.tableId !== id);
    this.persistLots();
  }

  public updateLotStatus(id: string, status: MobileScanLot['status']) {
    const lot = this.getLotById(id);
    if (lot) {
      lot.status = status;
      lot.updatedAt = new Date().toISOString();
      this.saveLot(lot, true);
    }
  }

  /**
   * Converts a MobileScanLot into an array of ProductRecords for label imposition
   */
  public convertLotToProductRecords(lot: MobileScanLot): ProductRecord[] {
    return lot.items.map((item, index) => {
      const record: ProductRecord = {
        id: item.id || `rec_${Date.now()}_${index}`,
        ITEMNAME: item.designation || `Article scanné ${item.code}`,
        SELLING_PRICE: item.price ?? 0,
        PRODUCT_SCAN: item.code,
        PARTNO: item.code,
        PROMOPRICE: item.promoPrice ?? undefined,
        barcode: item.code,
        code: item.code,
        ean: item.code,
        sku: item.code,
        part_number: item.code,
        designation: item.designation || `Article scanné ${item.code}`,
        name: item.designation || `Article scanné ${item.code}`,
        libelle: item.designation || `Article scanné ${item.code}`,
        price: item.price ?? 0,
        prix: item.price ?? 0,
        prix_vente: item.price ?? 0,
        promo_price: item.promoPrice ?? undefined,
        remise_promo: item.promoPrice && item.price
          ? `${Math.round(((item.price - item.promoPrice) / item.price) * 100)}%`
          : undefined,
        unit_price: item.unitPrice || (item.price ? `${item.price.toFixed(2)} € / pièce` : ''),
        copies: item.quantity > 0 ? item.quantity : 1, // Desired label count
        quantity: item.quantity > 0 ? item.quantity : 1,
        facing: item.facing || 1,
        note: item.note || '',
        lot_id: lot.id,
        lot_name: lot.name,
        operator: lot.operatorName,
        scanned_at: item.scannedAt,
        department: lot.department,
      };
      return record;
    });
  }

  /**
   * Resolves the target base URL according to connection mode
   */
  public getTargetHostUrl(mode?: NetworkConnectionMode): string {
    const selectedMode = mode || this.config.connectionMode;

    if (selectedMode === 'wifi_lan') {
      const portStr = this.config.port === 80 || this.config.port === 443 ? '' : `:${this.config.port}`;
      return `http://${this.config.hostAddress}${portStr}`;
    }

    if (selectedMode === 'custom_tunnel') {
      return this.config.publicHostUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    }

    // Default: 'internet_public'
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  }

  /**
   * Generates official V2.0 Pairing JSON Payload for Desktop QR Code
   */
  public async getPairingV2Payload(): Promise<EstudioPairV2Payload> {
    const host = this.config.hostAddress || '192.168.1.45';
    const port = this.config.port || 8080;
    const stationId = this.config.instanceId || 'PC-CAISSE-01';
    const stationName = this.config.instanceName || 'Poste Caisse Centrale';
    const token = this.config.credentials.sessionToken || 'a1b2c3d4e5f67890abcdef99887766554433221100';
    const pin = this.config.credentials.authPin || '1234';

    return createEstudioPairV2Payload(stationId, stationName, host, port, token, pin);
  }

  /**
   * Generates custom URI scheme pairing link (estudio://pair?...)
   */
  public async getPairingV2Uri(): Promise<string> {
    const payload = await this.getPairingV2Payload();
    return createEstudioPairV2Uri(payload);
  }

  /**
   * Generates a cryptographic SHA-256 encrypted pairing URL with credentials & signature (Web fallback)
   */
  public async getCryptedPairingUrl(mode?: NetworkConnectionMode): Promise<{ url: string; signature: string }> {
    const hostUrl = this.getTargetHostUrl(mode);
    return createEncryptedPairingPayload(this.config.credentials, hostUrl);
  }

  /**
   * Direct test simulation of sending a Mobile Table to Desktop REST API (/api/v2/tables/import)
   */
  public async simulateMobileTableImport(): Promise<{ success: boolean; data?: any; error?: string }> {
    const demoPayload: MobileTablePayload = {
      tableId: `TB-${Math.floor(100000 + Math.random() * 900000)}`,
      tableName: 'Changement Prix Épicerie & Boissons',
      colorTag: 'GREEN',
      department: 'Épicerie',
      operatorName: 'Jean Dupont',
      isLocked: true,
      createdAt: Date.now() - 60000,
      exportedAt: Date.now(),
      itemsCount: 3,
      totalLabelsCount: 17,
      items: [
        {
          id: 'item_01',
          barcode: '3017620422003',
          designation: 'Nutella Pâte à Tartiner 400g',
          templateId: 'template_38x70',
          quantity: 5,
          facing: 2,
          regularPrice: 3.89,
          discountPrice: 3.29,
          scannedAt: Date.now() - 50000,
        },
        {
          id: 'item_02',
          barcode: '5449000000996',
          designation: 'Coca-Cola Original 1.5L',
          templateId: 'template_38x70',
          quantity: 10,
          facing: 4,
          regularPrice: 1.95,
          discountPrice: null,
          scannedAt: Date.now() - 40000,
        },
        {
          id: 'item_03',
          barcode: '3250390123456',
          designation: 'Café Moulu Pur Arabica 250g',
          templateId: 'template_promo',
          quantity: 2,
          facing: 1,
          regularPrice: 3.49,
          discountPrice: 2.79,
          scannedAt: Date.now() - 20000,
        },
      ],
    };

    try {
      const response = await fetch('/api/v2/tables/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demoPayload),
      });

      if (response.ok) {
        const resJson = await response.json();
        // Also update client memory
        this.importTablePayload(demoPayload);
        return { success: true, data: resJson };
      } else {
        // Fallback locally if offline/no server
        this.importTablePayload(demoPayload);
        return { success: true, data: { success: true, importedTableId: demoPayload.tableId } };
      }
    } catch (e) {
      // Local fallback
      this.importTablePayload(demoPayload);
      return { success: true, data: { success: true, importedTableId: demoPayload.tableId } };
    }
  }

  /**
   * Export lots bundle as JSON
   */
  public exportLotsBundle(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        protocol: 'estudio-pair-v2',
        station: this.config,
        lots: this.lots,
      },
      null,
      2
    );
  }

  /**
   * Import lots bundle JSON
   */
  public importLotsBundle(jsonString: string): number {
    try {
      const data = JSON.parse(jsonString);
      const incomingLots: MobileScanLot[] = Array.isArray(data) ? data : data.lots || [];
      if (!Array.isArray(incomingLots)) return 0;

      let count = 0;
      incomingLots.forEach((incoming) => {
        if (incoming && incoming.id && (incoming.name || incoming.tableId) && Array.isArray(incoming.items)) {
          this.saveLot(incoming, true);
          count++;
        }
      });
      return count;
    } catch (e) {
      console.error('Failed to import lots bundle', e);
      return 0;
    }
  }
}

export const mobileSyncService = new MobileSyncService();
