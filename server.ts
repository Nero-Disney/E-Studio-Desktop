import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed !== 8080) return parsed;
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
}

const PORT = resolvePort();

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// In-memory server-side state for station and mobile sync
let stationConfig = {
  protocol: 'estudio-pair-v2',
  stationId: 'PC-CAISSE-01',
  stationName: 'Poste Caisse Centrale',
  storeName: 'Hypermarché Central',
  storeId: 'STORE-PARIS-15',
  host: '0.0.0.0',
  port: PORT,
  token: 'a1b2c3d4e5f67890abcdef99887766554433221100',
  pin: '1234',
  version: '2.4.0',
  catalogVersion: '2026.09.24-V4',
  status: 'ready',
};

// In-memory registered devices
const registeredDevices: Map<string, any> = new Map();

// In-memory imported tables / print jobs
const importedTables: any[] = [];
const printQueue: any[] = [];

// Sample catalog
const CATALOG_ITEMS = [
  {
    sku: 'CAF-250A',
    barcode: '3250390123456',
    designation: 'Café Moulu Arabica Pur 250g',
    department: 'Épicerie',
    category: 'Boissons Chaudes',
    regularPrice: 2450,
    promoPrice: 1950,
    unit: 'paquet',
    stock: 45,
  },
  {
    sku: 'HUI-100T',
    barcode: '3700012345678',
    designation: 'Huile de Tournesol Raffinée 1L',
    department: 'Épicerie',
    category: 'Corps Gras',
    regularPrice: 1350,
    promoPrice: 990,
    unit: 'bouteille',
    stock: 28,
  },
  {
    sku: 'NUT-400G',
    barcode: '3017620422003',
    designation: 'Pâte à Tartiner Noisette Cacao 400g',
    department: 'Épicerie',
    category: 'Petit Déjeuner',
    regularPrice: 3.89,
    promoPrice: 3.29,
    unit: 'pot',
    stock: 60,
  },
  {
    sku: 'COCA-15L',
    barcode: '5449000000996',
    designation: 'Soda Cola Original 1.5L',
    department: 'Boissons',
    category: 'Sodas & Eaux',
    regularPrice: 1.95,
    promoPrice: null,
    unit: 'bouteille',
    stock: 120,
  },
  {
    sku: 'JUS-100O',
    barcode: '3250390667788',
    designation: "Jus d'Orange Pur Jus 1L",
    department: 'Boissons',
    category: 'Jus de Fruits',
    regularPrice: 2.19,
    promoPrice: 1.79,
    unit: 'bouteille',
    stock: 35,
  },
  {
    sku: 'JAM-160G',
    barcode: '3250390123456',
    designation: 'Jambon Supérieur Découenne 4T 160g',
    department: 'Frais',
    category: 'Charcuterie',
    regularPrice: 3.49,
    promoPrice: 2.79,
    unit: 'barquette',
    stock: 22,
  },
  {
    sku: 'COM-200G',
    barcode: '3250390987654',
    designation: 'Fromage Comté AOP 24 Mois 200g',
    department: 'Frais',
    category: 'Fromagerie',
    regularPrice: 4.85,
    promoPrice: null,
    unit: 'pièce',
    stock: 18,
  },
  {
    sku: 'BEU-250G',
    barcode: '3250390554433',
    designation: 'Beurre Demi-Sel Moulé Tradition 250g',
    department: 'Frais',
    category: 'Crèmerie',
    regularPrice: 2.25,
    promoPrice: null,
    unit: 'plaquette',
    stock: 30,
  },
];

const AVAILABLE_TEMPLATES = [
  { id: 'template_38x70', name: 'Étiquette Rayon 38x70 mm', type: 'SHELF', widthMm: 70, heightMm: 38 },
  { id: 'template_promo', name: 'Promo Flash A4 Balisage', type: 'PROMO', widthMm: 210, heightMm: 297 },
  { id: 'template_50x30', name: 'Étiquette Rayon Classique (50x30 mm)', type: 'SHELF', widthMm: 50, heightMm: 30 },
  { id: 'template_70x40_red', name: 'Étiquette Promotionnelle Rouge (70x40 mm)', type: 'PROMO', widthMm: 70, heightMm: 40 },
  { id: 'template_100x60_cash', name: 'Planche Paliers Grossiste Cash & Carry (100x60 mm)', type: 'TIERS', widthMm: 100, heightMm: 60 },
];

// Active SSE / Live Clients
const liveClients: express.Response[] = [];

function broadcastLiveEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  liveClients.forEach((res) => {
    try {
      res.write(payload);
    } catch {}
  });
}

// -------------------------------------------------------------
// REST API v2 ENDPOINTS
// -------------------------------------------------------------

// 1. Station discovery / Info Ping (GET /api/v2/info)
app.get('/api/v2/info', (req, res) => {
  res.json({
    protocol: 'estudio-pair-v2',
    stationId: stationConfig.stationId,
    stationName: stationConfig.stationName,
    storeName: stationConfig.storeName,
    version: stationConfig.version,
    status: stationConfig.status,
    port: stationConfig.port,
    pendingJobsCount: printQueue.filter((j) => j.status === 'QUEUED' || j.status === 'PRINTING').length,
    timestamp: Date.now(),
  });
});

// 2. Handshake & Pairing (POST /api/v2/handshake)
app.post('/api/v2/handshake', (req, res) => {
  const { deviceId, deviceName, operatorName, token, pin, clientTimestamp } = req.body;

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      error: 'deviceId is required',
    });
  }

  // Record or update registered device
  const sessionToken = `session_${deviceId}_${Date.now().toString(36)}`;
  const deviceRecord = {
    deviceId,
    deviceName: deviceName || 'Terminal Mobile Android',
    operatorName: operatorName || 'Opérateur',
    token,
    sessionToken,
    registeredAt: Date.now(),
    lastSeen: Date.now(),
    status: 'ACTIVE',
  };
  registeredDevices.set(deviceId, deviceRecord);

  broadcastLiveEvent('DEVICE_CONNECTED', {
    deviceId,
    deviceName: deviceRecord.deviceName,
    operatorName: deviceRecord.operatorName,
    time: new Date().toISOString(),
  });

  return res.json({
    status: 'PAIRED',
    stationId: stationConfig.stationId,
    stationName: stationConfig.stationName,
    storeName: stationConfig.storeName,
    sessionToken,
    catalogVersion: stationConfig.catalogVersion,
    availableTemplates: AVAILABLE_TEMPLATES,
    serverTimestamp: Date.now(),
  });
});

// 3. Import Tables & Scan Lots (POST /api/v2/tables/import)
app.post('/api/v2/tables/import', (req, res) => {
  const tableData = req.body;

  const tableId = tableData.tableId || tableData.id || `TB-${Date.now()}`;
  const tableName = tableData.tableName || tableData.name || 'Table Scans Mobile';
  const items = Array.isArray(tableData.items) ? tableData.items : [];
  const operatorName = tableData.operatorName || 'Opérateur Mobile';

  // Calculate items count and total labels count
  const itemsCount = items.length;
  const totalLabelsCount = items.reduce((sum: number, it: any) => sum + (it.quantity || it.copies || 1), 0);

  const importedTable = {
    tableId,
    tableName,
    colorTag: tableData.colorTag || 'BLUE',
    department: tableData.department || 'Tous Rayons',
    operatorName,
    isLocked: tableData.isLocked ?? true,
    createdAt: tableData.createdAt || Date.now(),
    exportedAt: tableData.exportedAt || Date.now(),
    receivedAt: Date.now(),
    itemsCount,
    totalLabelsCount,
    status: 'QUEUED',
    items,
  };

  // Check for duplicate / idempotency
  const existingIdx = importedTables.findIndex((t) => t.tableId === tableId);
  if (existingIdx >= 0) {
    importedTables[existingIdx] = importedTable;
  } else {
    importedTables.unshift(importedTable);
  }

  // Create corresponding Print Job
  const printJob = {
    id: `JOB-${tableId}`,
    tableId,
    tableName,
    status: 'QUEUED',
    progress: 0,
    totalLabels: totalLabelsCount,
    createdAt: Date.now(),
  };
  printQueue.unshift(printJob);

  // Broadcast to all connected clients & desktop UI
  broadcastLiveEvent('TABLE_IMPORTED', {
    table: importedTable,
    job: printJob,
  });

  return res.json({
    success: true,
    importedTableId: tableId,
    importedItemsCount: itemsCount,
    totalLabelsCount,
    printJobStatus: 'QUEUED',
    message: "Table intégrée avec succès dans la file d'impression PC",
  });
});

// Alias for lots import
app.post('/api/v2/lots/import', (req, res) => {
  // Delegate to tables/import logic
  req.url = '/api/v2/tables/import';
  app.handle(req, res);
});

// 4. Catalog Download / Sync (GET /api/v2/catalog/sync)
app.get('/api/v2/catalog/sync', (req, res) => {
  const sinceVersion = req.query.since || req.query.version;

  res.json({
    version: stationConfig.catalogVersion,
    storeId: stationConfig.storeId,
    storeName: stationConfig.storeName,
    totalItems: CATALOG_ITEMS.length,
    items: CATALOG_ITEMS,
    templates: AVAILABLE_TEMPLATES,
    timestamp: Date.now(),
  });
});

// Update Server Master Catalog from Desktop Studio (POST /api/v2/catalog/update)
app.post('/api/v2/catalog/update', (req, res) => {
  const { items } = req.body;
  if (Array.isArray(items)) {
    CATALOG_ITEMS.length = 0;
    items.forEach((it: any) => {
      CATALOG_ITEMS.push({
        sku: it.PARTNO || it.sku || it.PRODUCT_SCAN || `SKU-${Math.random().toString(36).substring(2, 6)}`,
        barcode: it.PRODUCT_SCAN || it.barcode || '',
        designation: it.ITEMNAME || it.designation || 'Article',
        department: it.CATEGORY_NAME || it.DEPT_NAME || 'Épicerie',
        category: it.CATEGORY_NAME || 'Général',
        regularPrice: it.SELLING_PRICE || 0,
        promoPrice: it.PROMOPRICE || null,
        unit: 'pièce',
        stock: 50,
      });
    });
    stationConfig.catalogVersion = `CAT-${Date.now().toString(36).toUpperCase()}`;
    broadcastLiveEvent('CATALOG_UPDATED', { version: stationConfig.catalogVersion, totalItems: CATALOG_ITEMS.length });
    return res.json({ success: true, version: stationConfig.catalogVersion, totalItems: CATALOG_ITEMS.length });
  }
  return res.status(400).json({ success: false, error: 'Invalid items array' });
});

// 5. Get all imported tables (GET /api/v2/tables)
app.get('/api/v2/tables', (req, res) => {
  res.json({
    tables: importedTables,
    total: importedTables.length,
  });
});

// 6. Get registered devices (GET /api/v2/devices)
app.get('/api/v2/devices', (req, res) => {
  res.json({
    devices: Array.from(registeredDevices.values()),
    count: registeredDevices.size,
  });
});

// 7. Get live print jobs status (GET /api/v2/print-jobs)
app.get('/api/v2/print-jobs', (req, res) => {
  res.json({
    jobs: printQueue,
  });
});

// 8. Update Station Configuration (POST /api/v2/station/config)
app.post('/api/v2/station/config', (req, res) => {
  const updates = req.body;
  stationConfig = { ...stationConfig, ...updates };
  broadcastLiveEvent('STATION_CONFIG_UPDATED', stationConfig);
  res.json({ success: true, config: stationConfig });
});

// 9. SSE Real-Time Event Stream (GET /api/v2/events)
app.get('/api/v2/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  liveClients.push(res);
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ stationId: stationConfig.stationId, time: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = liveClients.indexOf(res);
    if (idx !== -1) liveClients.splice(idx, 1);
  });
});

// 10. Turso / LibSQL Pipeline CORS Proxy (POST /api/v2/turso/pipeline)
app.post('/api/v2/turso/pipeline', async (req, res) => {
  const { databaseUrl, authToken, requests } = req.body;
  if (!databaseUrl) {
    return res.status(400).json({ error: 'databaseUrl is required' });
  }

  let cleanUrl = databaseUrl.trim();
  if (cleanUrl.startsWith('libsql://')) cleanUrl = cleanUrl.replace('libsql://', 'https://');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) cleanUrl = `https://${cleanUrl}`;
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  try {
    const upstreamRes = await fetch(`${cleanUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authToken ? `Bearer ${authToken}` : '',
      },
      body: JSON.stringify({ requests }),
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err: any) {
    return res.status(502).json({ error: `Turso proxy error: ${err.message}` });
  }
});

// -------------------------------------------------------------
// Vite Middlewares (Dev) or Static Assets (Prod)
// -------------------------------------------------------------
async function startServer() {
  const distHtmlPath = path.resolve(__dirname, 'dist', 'index.html');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distHtmlPath);

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(distHtmlPath);
    });
  }

  const server = http.createServer(app);

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use.`);
    } else {
      console.error('[Server] Server error:', err);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 E-Studio Desktop REST API Server listening on port ${PORT}`);
    console.log(`📱 Mobile Interop endpoints ready on http://0.0.0.0:${PORT}/api/v2/`);
  });
}

startServer();
