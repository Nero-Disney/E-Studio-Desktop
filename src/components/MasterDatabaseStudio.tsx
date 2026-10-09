import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ProductRecord, LabelTemplate } from '../types';
import { databaseService, TursoConfig } from '../services/databaseService';
import {
  sanitizePriceValue,
  sanitizeBarcodeValue,
  COMMON_HEADER_KEYWORDS,
  COMMON_REPORT_BANNER_KEYWORDS,
  COMMON_SUBTOTAL_KEYWORDS,
  CleaningDiagnosticReport,
} from '../utils/excelCleaner';
import * as XLSX from 'xlsx';
import {
  Database,
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  RefreshCw,
  Tag,
  Layers,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Columns,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Info,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Save,
  HelpCircle,
  FileUp,
  Table as TableIcon,
  Cloud,
  HardDrive,
  Zap,
  Activity,
  Key,
} from 'lucide-react';

// ==========================================
// CANONICAL DATABASE SCHEMA DEFINITION (51 FIELDS)
// ==========================================
export interface SchemaColumnDef {
  key: string;
  label: string;
  category: 'id' | 'classification' | 'price' | 'inventory' | 'sales' | 'system' | 'custom';
  aliases: string[];
  type: 'text' | 'number' | 'currency' | 'date';
  defaultVisible: boolean;
}

export const CANONICAL_SCHEMA: SchemaColumnDef[] = [
  // Identification
  { key: 'STORE_NAME', label: 'STORE_NAME', category: 'id', aliases: ['store', 'store_name', 'magasin', 'nom_magasin', 'site'], type: 'text', defaultVisible: true },
  { key: 'PRODUCT_SCAN', label: 'PRODUCT_SCAN', category: 'id', aliases: ['product_scan', 'product scan', 'ean', 'gencod', 'barcode', 'code_barre', 'scan'], type: 'text', defaultVisible: true },
  { key: 'PARTNO', label: 'PARTNO', category: 'id', aliases: ['partno', 'part_no', 'part no', 'code_article', 'ref', 'sku', 'code_prod'], type: 'text', defaultVisible: true },
  { key: 'ITEMNAME', label: 'ITEMNAME', category: 'id', aliases: ['itemname', 'item_name', 'item name', 'designation', 'libelle', 'nom_article', 'description'], type: 'text', defaultVisible: true },
  { key: 'ITEMDESCRIPTION', label: 'ITEMDESCRIPTION', category: 'id', aliases: ['itemdescription', 'item_description', 'item description', 'description_detaillee', 'remarque'], type: 'text', defaultVisible: false },
  { key: 'HSCOD', label: 'HSCOD', category: 'id', aliases: ['hscod', 'hs_code', 'hs code', 'code_douanier', 'tariff_code'], type: 'text', defaultVisible: false },

  // Classification
  { key: 'DIV.NAME', label: 'DIV.NAME', category: 'classification', aliases: ['div.name', 'div_name', 'div name', 'division', 'nom_division'], type: 'text', defaultVisible: false },
  { key: 'DEPT NAME', label: 'DEPT NAME', category: 'classification', aliases: ['dept name', 'dept_name', 'rayon', 'departement', 'department'], type: 'text', defaultVisible: true },
  { key: 'CATEGORY NAME', label: 'CATEGORY NAME', category: 'classification', aliases: ['category name', 'category_name', 'famille', 'categorie', 'category'], type: 'text', defaultVisible: true },
  { key: 'SUB CATEGORY NAME', label: 'SUB CATEGORY NAME', category: 'classification', aliases: ['sub category name', 'sub_category_name', 'sous_famille', 'sous_categorie', 'sub_category'], type: 'text', defaultVisible: false },
  { key: 'BRAND_INFO', label: 'BRAND_INFO', category: 'classification', aliases: ['brand_info', 'brand info', 'brand', 'marque', 'fabricant'], type: 'text', defaultVisible: true },
  { key: 'PACK UNIT', label: 'PACK UNIT', category: 'classification', aliases: ['pack unit', 'pack_unit', 'unite_cond', 'conditionnement', 'pack'], type: 'text', defaultVisible: false },
  { key: 'VENDOR NAME', label: 'VENDOR NAME', category: 'classification', aliases: ['vendor name', 'vendor_name', 'fournisseur', 'vendor', 'tier'], type: 'text', defaultVisible: false },
  { key: 'SELLING UNIT', label: 'SELLING UNIT', category: 'classification', aliases: ['selling unit', 'selling_unit', 'unite_vente', 'u_vente'], type: 'text', defaultVisible: false },

  // Pricing & Tax
  { key: 'SELLING PRICE', label: 'SELLING PRICE', category: 'price', aliases: ['selling price', 'selling_price', 'pv', 'pv_ttc', 'prix_vente', 'prix', 'price'], type: 'currency', defaultVisible: true },
  { key: 'PROMOPRICE', label: 'PROMOPRICE', category: 'price', aliases: ['promoprice', 'promo_price', 'prix_promo', 'tarif_promo', 'p_promo'], type: 'currency', defaultVisible: true },
  { key: 'SUPPLIER', label: 'SUPPLIER', category: 'classification', aliases: ['supplier', 'distributeur', 'fournisseur_secondaire'], type: 'text', defaultVisible: false },
  { key: 'ITEM_TYPE', label: 'ITEM_TYPE', category: 'classification', aliases: ['item_type', 'item type', 'type_article', 'nature'], type: 'text', defaultVisible: false },
  { key: 'CASE SIZE', label: 'CASE SIZE', category: 'inventory', aliases: ['case size', 'case_size', 'colisage', 'nb_colis', 'emb'], type: 'number', defaultVisible: false },
  { key: 'CASE UNIT', label: 'CASE UNIT', category: 'inventory', aliases: ['case unit', 'case_unit', 'unite_colis', 'emb_unit'], type: 'text', defaultVisible: false },
  { key: 'TAX', label: 'TAX', category: 'price', aliases: ['tax', 'code_tva', 'tva_code'], type: 'text', defaultVisible: false },
  { key: 'TAX RATE', label: 'TAX RATE', category: 'price', aliases: ['tax rate', 'tax_rate', 'taux_tva', 'tva_pct', 'vat_rate'], type: 'number', defaultVisible: false },
  { key: 'TAX TYPE', label: 'TAX TYPE', category: 'price', aliases: ['tax type', 'tax_type', 'regime_tva', 'type_tva'], type: 'text', defaultVisible: false },

  // System Audit
  { key: 'ITEM CREATED DATE', label: 'ITEM CREATED DATE', category: 'system', aliases: ['item created date', 'item_created_date', 'date_creation', 'created_at'], type: 'date', defaultVisible: false },
  { key: 'ITEM CREATED BY', label: 'ITEM CREATED BY', category: 'system', aliases: ['item created by', 'item_created_by', 'cree_par', 'author'], type: 'text', defaultVisible: false },
  { key: 'ITEM UPDATED BY', label: 'ITEM UPDATED BY', category: 'system', aliases: ['item updated by', 'item_updated_by', 'modifie_par'], type: 'text', defaultVisible: false },

  // Stock & Inventory
  { key: 'SOH', label: 'SOH', category: 'inventory', aliases: ['soh', 'stock_on_hand', 'stock', 'stock_physique', 'qte_stock', 'inventory'], type: 'number', defaultVisible: true },
  { key: 'LAST GRN DATE', label: 'LAST GRN DATE', category: 'inventory', aliases: ['last grn date', 'last_grn_date', 'date_dernier_bon_reception', 'date_der_recep'], type: 'date', defaultVisible: false },
  { key: 'LAST GRN QTY', label: 'LAST GRN QTY', category: 'inventory', aliases: ['last grn qty', 'last_grn_qty', 'qte_dernier_recep', 'last_grn_quantity'], type: 'number', defaultVisible: false },
  { key: 'SALE QTY AFTER LAST GRN', label: 'SALE QTY AFTER LAST GRN', category: 'inventory', aliases: ['sale qty after last grn', 'sale_qty_after_last_grn', 'ventes_apres_recep'], type: 'number', defaultVisible: false },
  { key: 'LAST PO DATE', label: 'LAST PO DATE', category: 'inventory', aliases: ['last po date', 'last_po_date', 'date_dernier_bon_commande'], type: 'date', defaultVisible: false },
  { key: 'LAST RECEIVE NOTE DATE', label: 'LAST RECEIVE NOTE DATE', category: 'inventory', aliases: ['last receive note date', 'last_receive_note_date', 'date_reception'], type: 'date', defaultVisible: false },
  { key: 'ON ORDER QTY', label: 'ON ORDER QTY', category: 'inventory', aliases: ['on order qty', 'on_order_qty', 'qte_en_commande', 'qte_commandee'], type: 'number', defaultVisible: false },
  { key: 'STOCK JOURNAL CONSUMPTION', label: 'STOCK JOURNAL CONSUMPTION', category: 'inventory', aliases: ['stock journal consumption', 'stock_journal_consumption', 'consommation_stock'], type: 'number', defaultVisible: false },
  { key: 'GOODS IN TRANSIT', label: 'GOODS IN TRANSIT', category: 'inventory', aliases: ['goods in transit', 'goods_in_transit', 'en_transit'], type: 'number', defaultVisible: false },

  // Sales & Performance KPIs
  { key: 'QTY SOLD', label: 'QTY SOLD', category: 'sales', aliases: ['qty sold', 'qty_sold', 'total_vendu', 'qte_vendue', 'sales_qty'], type: 'number', defaultVisible: false },
  { key: 'QTY SALES RETURN', label: 'QTY SALES RETURN', category: 'sales', aliases: ['qty sales return', 'qty_sales_return', 'retour_ventes'], type: 'number', defaultVisible: false },
  { key: 'LAST SOLD DATE', label: 'LAST SOLD DATE', category: 'sales', aliases: ['last sold date', 'last_sold_date', 'date_dernière_vente'], type: 'date', defaultVisible: false },
  { key: 'QTYSOLDINLAST30DAYS', label: 'QTYSOLDINLAST30DAYS', category: 'sales', aliases: ['qtysoldinlast30days', 'qty_sold_30d', 'ventes_30j'], type: 'number', defaultVisible: false },
  { key: 'QTYSOLDINLAST60DAYS', label: 'QTYSOLDINLAST60DAYS', category: 'sales', aliases: ['qtysoldinlast60days', 'qty_sold_60d', 'ventes_60j'], type: 'number', defaultVisible: false },
  { key: 'QTYSOLDINLAST90DAYS', label: 'QTYSOLDINLAST90DAYS', category: 'sales', aliases: ['qtysoldinlast90days', 'qty_sold_90d', 'ventes_90j'], type: 'number', defaultVisible: false },
  { key: 'WAC COST', label: 'WAC COST', category: 'price', aliases: ['wac cost', 'wac_cost', 'cost', 'pmp', 'cout_pmp', 'pu_achat', 'buy_price'], type: 'currency', defaultVisible: false },
  { key: 'Aging  Status', label: 'Aging  Status', category: 'inventory', aliases: ['aging status', 'aging  status', 'aging_status', 'obsolescence', 'aging'], type: 'text', defaultVisible: false },
  { key: 'Item/ Loc  Status', label: 'Item/ Loc  Status', category: 'inventory', aliases: ['item/ loc  status', 'item/loc status', 'item_loc_status', 'statut_emplacement'], type: 'text', defaultVisible: false },
  { key: 'Total Stock Retail Incl. Tax', label: 'Total Stock Retail Incl. Tax', category: 'price', aliases: ['total stock retail incl. tax', 'total_stock_retail_incl_tax', 'valeur_stock_ttc'], type: 'currency', defaultVisible: false },
  { key: 'DMS', label: 'DMS', category: 'sales', aliases: ['dms', 'dms_jour', 'vente_moyenne'], type: 'number', defaultVisible: false },
  { key: 'Total Stock Cost Excl. Tax', label: 'Total Stock Cost Excl. Tax', category: 'price', aliases: ['total stock cost excl. tax', 'total_stock_cost_excl_tax', 'valeur_stock_ht'], type: 'currency', defaultVisible: false },
  { key: 'LAST Cost Excl. Tax', label: 'LAST Cost Excl. Tax', category: 'price', aliases: ['last cost excl. tax', 'last_cost_excl_tax', 'dernier_cout_ht'], type: 'currency', defaultVisible: false },

  // Origin & Margins
  { key: 'ITEM SOURCE', label: 'ITEM SOURCE', category: 'classification', aliases: ['item source', 'item_source', 'origine_article'], type: 'text', defaultVisible: false },
  { key: 'PRODUCTION ITEM', label: 'PRODUCTION ITEM', category: 'classification', aliases: ['production item', 'production_item', 'produit_fabrique'], type: 'text', defaultVisible: false },
  { key: 'MARGIN', label: 'MARGIN', category: 'price', aliases: ['margin', 'margin_pct', 'marge', 'taux_marge'], type: 'number', defaultVisible: true },
];

/**
 * Universal getter function to extract field from ProductRecord across key variants
 */
export function getProductFieldValue(p: any, schemaKey: string, aliases: string[] = []): any {
  if (!p) return '';
  // Direct key check
  if (p[schemaKey] !== undefined && p[schemaKey] !== null && p[schemaKey] !== '') {
    return p[schemaKey];
  }
  // Try snake_case or clean version
  const snake = schemaKey.replace(/[\s\.]+/g, '_');
  if (p[snake] !== undefined && p[snake] !== null && p[snake] !== '') {
    return p[snake];
  }
  // Check aliases
  for (const alias of aliases) {
    if (p[alias] !== undefined && p[alias] !== null && p[alias] !== '') {
      return p[alias];
    }
    const aliasSnake = alias.replace(/[\s\.]+/g, '_');
    if (p[aliasSnake] !== undefined && p[aliasSnake] !== null && p[aliasSnake] !== '') {
      return p[aliasSnake];
    }
  }
  return '';
}

interface MasterDatabaseStudioProps {
  onBack: () => void;
  templates: LabelTemplate[];
  onGenerateFromDatabase: (selectedProducts: ProductRecord[]) => void;
}

export const MasterDatabaseStudio: React.FC<MasterDatabaseStudioProps> = ({
  onBack,
  templates,
  onGenerateFromDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'importer' | 'new_item' | 'turso_cloud'>('explorer');

  // Turso / LibSQL Cloud Synchronization State
  const [tursoConfig, setTursoConfig] = useState<TursoConfig>(() => databaseService.getTursoConfig());
  const [tursoTesting, setTursoTesting] = useState(false);
  const [tursoTestResult, setTursoTestResult] = useState<{ success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [tursoSyncing, setTursoSyncing] = useState(false);
  const [tursoSyncMessage, setTursoSyncMessage] = useState<string | null>(null);

  // Master products list
  const [products, setProducts] = useState<ProductRecord[]>([]);

  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Column Visibility & Custom Columns
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(() => {
    return CANONICAL_SCHEMA.filter((c) => c.defaultVisible).map((c) => c.key);
  });
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [newCustomColumnName, setNewCustomColumnName] = useState('');

  // Editing Item Drawer / Modal
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'id' | 'class' | 'price' | 'stock' | 'sales' | 'system'>('id');

  // New Item State
  const [newItemData, setNewItemData] = useState<Partial<ProductRecord>>({
    STORE_NAME: 'MAGASIN PRINCIPAL',
    PRODUCT_SCAN: '',
    PARTNO: '',
    ITEMNAME: '',
    SELLING_PRICE: 0,
    PROMOPRICE: 0,
    DEPT_NAME: 'GENERAL',
    BRAND_INFO: '',
    SOH: 0,
  });

  // Importer & Cleanser State
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [rawFileHeaders, setRawFileHeaders] = useState<string[]>([]);
  const [rawFileRows, setRawFileRows] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({}); // fileHeader -> schemaKey
  const [cleanedPreviewRows, setCleanedPreviewRows] = useState<any[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<CleaningDiagnosticReport | null>(null);
  const [importMergeMode, setImportMergeMode] = useState<'update_upsert' | 'append' | 'overwrite'>('update_upsert');
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Database Changes
  useEffect(() => {
    const unsubscribe = databaseService.subscribe((items) => {
      setProducts(items);
    });
    return () => unsubscribe();
  }, []);

  // Compute Store List & Dept List
  const stores = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const val = getProductFieldValue(p, 'STORE_NAME', ['store', 'store_name', 'magasin']);
      if (val) set.add(String(val));
    });
    return Array.from(set);
  }, [products]);

  const depts = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const val = getProductFieldValue(p, 'DEPT NAME', ['dept name', 'dept_name', 'rayon', 'category_name', 'department']);
      if (val) set.add(String(val));
    });
    return Array.from(set);
  }, [products]);

  // Combined Active Columns Schema
  const allActiveColumns = useMemo(() => {
    const canonicals = CANONICAL_SCHEMA.filter((c) => visibleColumnKeys.includes(c.key));
    const customs = customColumns
      .filter((colName) => visibleColumnKeys.includes(colName))
      .map((colName) => ({
        key: colName,
        label: colName,
        category: 'custom' as const,
        aliases: [colName.toLowerCase()],
        type: 'text' as const,
        defaultVisible: true,
      }));
    return [...canonicals, ...customs];
  }, [visibleColumnKeys, customColumns]);

  // Deferred search term for sub-millisecond filtering on heavy datasets
  const deferredSearchTerm = React.useDeferredValue(searchTerm);

  // Filtered Products using pre-indexed search
  const filteredProducts = useMemo(() => {
    return databaseService.queryProducts({
      searchTerm: deferredSearchTerm,
      dept: selectedDept,
      store: selectedStore,
    });
  }, [products, deferredSearchTerm, selectedDept, selectedStore]);

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Bulk Delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Voulez-vous vraiment supprimer ${selectedIds.size} produit(s) de la base Master ?`)) {
      selectedIds.forEach((id) => databaseService.deleteSingleProduct(id));
      setSelectedIds(new Set());
    }
  };

  // Bulk Export to Excel
  const handleExportExcel = () => {
    const targetList = selectedIds.size > 0
      ? products.filter((p) => selectedIds.has(p.id))
      : filteredProducts;

    const exportRows = targetList.map((p) => {
      const row: Record<string, any> = {};
      CANONICAL_SCHEMA.forEach((col) => {
        row[col.key] = getProductFieldValue(p, col.key, col.aliases);
      });
      customColumns.forEach((col) => {
        row[col] = p[col] || '';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Base_Master");
    XLSX.writeFile(wb, `base_master_estudio_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Preset Column Layout Views
  const applyColumnPreset = (preset: 'essential' | 'stock' | 'sales' | 'all') => {
    if (preset === 'essential') {
      setVisibleColumnKeys(['STORE_NAME', 'PRODUCT_SCAN', 'PARTNO', 'ITEMNAME', 'SELLING PRICE', 'PROMOPRICE', 'BRAND_INFO', 'DEPT NAME', 'SOH', 'MARGIN']);
    } else if (preset === 'stock') {
      setVisibleColumnKeys(['PARTNO', 'ITEMNAME', 'SOH', 'WAC COST', 'LAST GRN DATE', 'LAST GRN QTY', 'GOODS IN TRANSIT', 'ON ORDER QTY', 'Aging  Status']);
    } else if (preset === 'sales') {
      setVisibleColumnKeys(['ITEMNAME', 'SELLING PRICE', 'QTY SOLD', 'QTYSOLDINLAST30DAYS', 'QTYSOLDINLAST60DAYS', 'QTYSOLDINLAST90DAYS', 'DMS', 'MARGIN']);
    } else {
      setVisibleColumnKeys([...CANONICAL_SCHEMA.map((c) => c.key), ...customColumns]);
    }
  };

  // Add Custom Column
  const handleAddCustomColumn = () => {
    const trimmed = newCustomColumnName.trim().toUpperCase();
    if (!trimmed) return;
    if (CANONICAL_SCHEMA.some((c) => c.key === trimmed) || customColumns.includes(trimmed)) {
      alert('Cette colonne existe déjà dans le schéma.');
      return;
    }
    setCustomColumns([...customColumns, trimmed]);
    setVisibleColumnKeys([...visibleColumnKeys, trimmed]);
    setNewCustomColumnName('');
  };

  // Handle Save Single Product Edit
  const handleSaveProductEdit = () => {
    if (!editingProduct) return;
    databaseService.updateSingleProduct(editingProduct);
    setEditingProduct(null);
  };

  // Handle Save New Item
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.ITEMNAME) {
      alert('Veuillez saisir au moins la désignation de l\'article.');
      return;
    }
    const created: ProductRecord = {
      id: `PROD_${Date.now()}`,
      ITEMNAME: newItemData.ITEMNAME,
      SELLING_PRICE: Number(newItemData.SELLING_PRICE) || 0,
      STORE_NAME: newItemData.STORE_NAME || 'MAGASIN PRINCIPAL',
      PRODUCT_SCAN: newItemData.PRODUCT_SCAN || '',
      PARTNO: newItemData.PARTNO || '',
      PROMOPRICE: Number(newItemData.PROMOPRICE) || 0,
      DEPT_NAME: newItemData.DEPT_NAME || 'GENERAL',
      BRAND_INFO: newItemData.BRAND_INFO || '',
      SOH: Number(newItemData.SOH) || 0,
      ...newItemData,
    };

    databaseService.saveToMasterDatabase([created], 'update_upsert');
    alert('🎉 Article ajouté avec succès à la base Master !');
    setNewItemData({
      STORE_NAME: 'MAGASIN PRINCIPAL',
      PRODUCT_SCAN: '',
      PARTNO: '',
      ITEMNAME: '',
      SELLING_PRICE: 0,
      PROMOPRICE: 0,
      DEPT_NAME: 'GENERAL',
      BRAND_INFO: '',
      SOH: 0,
    });
    setActiveTab('explorer');
  };

  // Turso Handlers
  const handleTestTurso = async () => {
    setTursoTesting(true);
    setTursoTestResult(null);
    const res = await databaseService.testTursoConnection(tursoConfig);
    setTursoTesting(false);
    if (res.success) {
      setTursoTestResult({
        success: true,
        latencyMs: res.latencyMs,
        message: `Connexion Turso LibSQL établie avec succès (${res.latencyMs} ms de latence).`,
      });
      setTursoConfig(databaseService.getTursoConfig());
    } else {
      setTursoTestResult({
        success: false,
        message: res.error || 'Impossible de joindre le serveur Turso.',
      });
    }
  };

  const handlePushTurso = async () => {
    setTursoSyncing(true);
    setTursoSyncMessage(null);
    const res = await databaseService.pushToTurso();
    setTursoSyncing(false);
    if (res.success) {
      setTursoSyncMessage(`✅ ${res.rowsSynced} articles envoyés vers la base Turso.`);
      setTursoConfig(databaseService.getTursoConfig());
    } else {
      setTursoSyncMessage(`❌ Erreur: ${res.error}`);
    }
  };

  const handlePullTurso = async () => {
    setTursoSyncing(true);
    setTursoSyncMessage(null);
    const res = await databaseService.pullFromTurso();
    setTursoSyncing(false);
    if (res.success) {
      setTursoSyncMessage(`✅ ${res.rowsReceived} articles reçus depuis Turso et intégrés en cache.`);
      setTursoConfig(databaseService.getTursoConfig());
    } else {
      setTursoSyncMessage(`❌ Erreur: ${res.error}`);
    }
  };

  const handleDownloadSqlDump = () => {
    const dump = databaseService.exportSqlDump();
    const blob = new Blob([dump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estudio_master_dump_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // IN-APP EXCEL/CSV IMPORTER & CLEANSING ENGINE
  // ==========================================
  const handleFileDropOrSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportedFile(file);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = new Uint8Array(loadEvent.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawMatrix || rawMatrix.length === 0) {
          alert('Le fichier sélectionné est vide.');
          return;
        }

        // Find header row (first non-empty row with text)
        let headerIdx = 0;
        for (let i = 0; i < Math.min(rawMatrix.length, 15); i++) {
          const row = rawMatrix[i];
          if (Array.isArray(row) && row.length > 0) {
            const rowStr = row.map((cell) => String(cell || '').trim().toLowerCase()).join(' ');
            const isBanner = COMMON_REPORT_BANNER_KEYWORDS.some((kw) => rowStr.includes(kw));
            if (!isBanner && row.filter((c) => c !== undefined && String(c).trim() !== '').length >= 2) {
              headerIdx = i;
              break;
            }
          }
        }

        const rawHeaders = (rawMatrix[headerIdx] || []).map((c, idx) => (c ? String(c).trim() : `Colonne_${idx + 1}`));

        // Convert rows below header into row objects
        const rawRows = rawMatrix.slice(headerIdx + 1).map((rRow, rIdx) => {
          const rowObj: Record<string, any> = { _originalRowIndex: rIdx + headerIdx + 2 };
          rawHeaders.forEach((h, idx) => {
            rowObj[h] = rRow[idx] !== undefined ? rRow[idx] : '';
          });
          return rowObj;
        });

        // High-performance filter: check key columns without serializing entire row objects
        let subtotalsRemoved = 0;
        const validRows: any[] = [];
        const subtotalKeywords = COMMON_SUBTOTAL_KEYWORDS;
        const headerCheckLimit = Math.min(rawHeaders.length, 5);

        for (let r = 0; r < rawRows.length; r++) {
          const rowObj = rawRows[r];
          let isSubtotal = false;
          let hasContent = false;

          for (let h = 0; h < headerCheckLimit; h++) {
            const val = String(rowObj[rawHeaders[h]] || '').toLowerCase();
            if (val) {
              hasContent = true;
              for (let k = 0; k < subtotalKeywords.length; k++) {
                if (val.includes(subtotalKeywords[k])) {
                  isSubtotal = true;
                  break;
                }
              }
              if (isSubtotal) break;
            }
          }

          if (isSubtotal) {
            subtotalsRemoved++;
          } else {
            if (!hasContent) {
              for (let h = headerCheckLimit; h < rawHeaders.length; h++) {
                if (rowObj[rawHeaders[h]] !== '' && rowObj[rawHeaders[h]] !== null && rowObj[rawHeaders[h]] !== undefined) {
                  hasContent = true;
                  break;
                }
              }
            }
            if (hasContent) {
              validRows.push(rowObj);
            }
          }
        }

        // Auto-match column mappings to Canonical Schema
        const initialMappings: Record<string, string> = {};
        rawHeaders.forEach((headerName) => {
          const normHeader = headerName.toLowerCase().replace(/[\s\.\_\-]+/g, ' ');
          let matchedKey = 'IGNORE';

          // Exact or alias match
          for (const col of CANONICAL_SCHEMA) {
            const allAliases = [col.key.toLowerCase(), ...col.aliases.map((a) => a.toLowerCase())];
            if (allAliases.some((alias) => normHeader === alias || normHeader.includes(alias) || alias.includes(normHeader))) {
              matchedKey = col.key;
              break;
            }
          }
          initialMappings[headerName] = matchedKey;
        });

        setRawFileHeaders(rawHeaders);
        setRawFileRows(validRows);
        setColumnMappings(initialMappings);

        // Build Cleaned Preview
        processCleanedPreview(validRows, initialMappings, subtotalsRemoved);
      } catch (err) {
        alert('Erreur lors de la lecture du fichier Excel: ' + String(err));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Re-process Preview when mappings change
  const processCleanedPreview = (
    rowsToProcess: any[],
    mappings: Record<string, string>,
    subtotalsCount: number = 0
  ) => {
    let pricesFixed = 0;
    let barcodesFixed = 0;

    const cleaned: ProductRecord[] = rowsToProcess.map((rawRow, idx) => {
      const p: any = { id: `IMP_${Date.now()}_${idx}` };

      Object.entries(mappings).forEach(([fileHeader, targetSchemaKey]) => {
        if (targetSchemaKey && targetSchemaKey !== 'IGNORE') {
          const rawVal = rawRow[fileHeader];

          // Check if numeric price
          if (targetSchemaKey.includes('PRICE') || targetSchemaKey.includes('COST') || targetSchemaKey === 'MARGIN') {
            const cleanNum = sanitizePriceValue(rawVal);
            if (String(rawVal) !== String(cleanNum)) pricesFixed++;
            p[targetSchemaKey] = cleanNum;
          } else if (targetSchemaKey === 'PRODUCT_SCAN' || targetSchemaKey === 'PARTNO') {
            const cleanScan = sanitizeBarcodeValue(rawVal);
            if (String(rawVal) !== String(cleanScan)) barcodesFixed++;
            p[targetSchemaKey] = cleanScan;
          } else {
            p[targetSchemaKey] = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
          }
        }
      });

      // Default required fallbacks
      if (!p.ITEMNAME) {
        p.ITEMNAME = p.ITEMDESCRIPTION || p.PRODUCT_SCAN || p.PARTNO || `Article_Ligne_${idx + 1}`;
      }
      if (p.SELLING_PRICE === undefined) {
        p.SELLING_PRICE = p['SELLING PRICE'] !== undefined ? p['SELLING PRICE'] : 0;
      }

      return p as ProductRecord;
    });

    setCleanedPreviewRows(cleaned);

    // Calculate Diagnostic Report
    const totalCount = rowsToProcess.length;
    const missingPrices = cleaned.filter((c) => !c.SELLING_PRICE || c.SELLING_PRICE === 0).length;
    const missingEans = cleaned.filter((c) => !c.PRODUCT_SCAN).length;
    const score = Math.max(0, Math.min(100, Math.round(100 - (missingPrices / (totalCount || 1)) * 30 - (missingEans / (totalCount || 1)) * 20)));

    setDiagnosticReport({
      healthScore: score,
      totalRowsProcessed: totalCount,
      validRowsCount: cleaned.length,
      reportLinesRemovedCount: 0,
      subtotalsRemovedCount: subtotalsCount,
      pricesFixedCount: pricesFixed,
      barcodesFixedCount: barcodesFixed,
      duplicateBarcodesCount: 0,
      missingPriceCount: missingPrices,
      missingEanCount: missingEans,
      issues: [],
    });
  };

  const handleMappingChange = (fileHeader: string, targetKey: string) => {
    const updated = { ...columnMappings, [fileHeader]: targetKey };
    setColumnMappings(updated);
    processCleanedPreview(rawFileRows, updated, diagnosticReport?.subtotalsRemovedCount || 0);
  };

  const handleCommitImport = () => {
    if (cleanedPreviewRows.length === 0) {
      alert('Aucune donnée valide à importer.');
      return;
    }
    setIsProcessingImport(true);

    setTimeout(() => {
      const res = databaseService.saveToMasterDatabase(cleanedPreviewRows, importMergeMode);
      setIsProcessingImport(false);
      alert(
        `✅ Importation réussie !\n\nTotal Base Master: ${res.totalCount} articles.\nArticles mis à jour: ${res.updatedCount}\nArticles ajoutés: ${res.addedCount}`
      );
      // Reset importer state and go to explorer tab
      setImportedFile(null);
      setCleanedPreviewRows([]);
      setActiveTab('explorer');
    }, 400);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 min-h-screen">
      {/* HEADER BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
            title="Retour au Tableau de Bord"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Base de Données Master & Nettoyeur</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                51 Champs Canoniques
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestionnaire universel de catalogue, importateur Excel/CSV avec auto-nettoyage et mapping dynamique.
            </p>
          </div>
        </div>

        {/* TOP STATS BADGES */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-slate-400">Articles Master:</span>
            <span className="text-sm font-bold text-blue-400">{products.length}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-slate-400">Rayons:</span>
            <span className="text-sm font-bold text-emerald-400">{depts.length}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-slate-400">Magasins:</span>
            <span className="text-sm font-bold text-purple-400">{stores.length || 1}</span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('explorer')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'explorer'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Catalogue Master ({filteredProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('importer')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'importer'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Importer & Nettoyer Fichier Excel/CSV</span>
            {cleanedPreviewRows.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-extrabold rounded-full">
                {cleanedPreviewRows.length} prêts
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('new_item')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'new_item'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel Article</span>
          </button>

          <button
            onClick={() => setActiveTab('turso_cloud')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'turso_cloud'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span>Turso / LibSQL Cloud</span>
            {tursoConfig.enabled && tursoConfig.status === 'connected' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadSqlDump}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            title="Télécharger la base complète au format script SQL standard (SQLite / LibSQL)"
          >
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export SQL (.sql)</span>
          </button>
        </div>

        {/* COLUMN CUSTOMIZER BUTTON (EXPLORER TAB ONLY) */}
        {activeTab === 'explorer' && (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => applyColumnPreset('essential')}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              >
                Vue Essentiels
              </button>
              <button
                onClick={() => applyColumnPreset('stock')}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              >
                Vue Stocks
              </button>
              <button
                onClick={() => applyColumnPreset('sales')}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              >
                Vue Ventes
              </button>
              <button
                onClick={() => applyColumnPreset('all')}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              >
                Toutes (51)
              </button>
            </div>

            <button
              onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition"
            >
              <Columns className="w-4 h-4 text-blue-400" />
              <span>Colonnes ({visibleColumnKeys.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* TAB 1: CATALOGUE MASTER EXPLORER GRID      */}
      {/* ========================================== */}
      {activeTab === 'explorer' && (
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Rechercher par EAN, Part Number, Nom article, Marque, Fournisseur..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* STORE FILTER */}
              {stores.length > 0 && (
                <select
                  value={selectedStore}
                  onChange={(e) => {
                    setSelectedStore(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Tous les Magasins</option>
                  {stores.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              )}

              {/* DEPT FILTER */}
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tous les Rayons ({depts.length})</option>
                {depts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-600"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exporter XLSX</span>
              </button>

              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={() => {
                      const selectedProds = products.filter((p) => selectedIds.has(p.id));
                      onGenerateFromDatabase(selectedProds);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Générer Étiquettes ({selectedIds.size})</span>
                  </button>

                  <button
                    onClick={handleBulkDelete}
                    className="px-3.5 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer ({selectedIds.size})</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* MAIN DATA TABLE */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  <tr>
                    <th className="p-3 w-10 text-center border-r border-slate-800/60">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 w-12 text-center border-r border-slate-800/60">Actions</th>
                    {allActiveColumns.map((col) => (
                      <th
                        key={col.key}
                        className="p-3 whitespace-nowrap border-r border-slate-800/60 hover:bg-slate-850 transition"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          {col.category === 'custom' && (
                            <span className="px-1 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] rounded font-bold">
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs text-slate-200">
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={allActiveColumns.length + 2}
                        className="p-12 text-center text-slate-500"
                      >
                        <Database className="w-10 h-10 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
                        <p className="text-sm font-semibold text-slate-400">Aucun produit trouvé dans la base Master.</p>
                        <p className="text-xs mt-1 text-slate-500">
                          Utilisez l'onglet <span className="text-emerald-400 font-medium">"Importer & Nettoyer Fichier"</span> pour charger votre catalogue Excel.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => {
                      const isSelected = selectedIds.has(p.id);
                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-900/80 transition ${
                            isSelected ? 'bg-blue-950/30' : ''
                          }`}
                        >
                          <td className="p-3 text-center border-r border-slate-850/60">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectOne(p.id)}
                              className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="p-3 text-center border-r border-slate-850/60">
                            <button
                              onClick={() => setEditingProduct({ ...p })}
                              className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                              title="Éditer la fiche complète"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                          {allActiveColumns.map((col) => {
                            const val = getProductFieldValue(p, col.key, col.aliases);
                            return (
                              <td
                                key={col.key}
                                className="p-3 whitespace-nowrap border-r border-slate-850/60 font-mono text-[11px]"
                              >
                                {col.type === 'currency' ? (
                                  <span
                                    className={
                                      col.key.includes('PRICE') && Number(val) > 0
                                        ? 'font-bold text-emerald-400'
                                        : 'text-slate-300'
                                    }
                                  >
                                    {val !== undefined && val !== '' ? `${Number(val).toFixed(2)} FCFA` : '-'}
                                  </span>
                                ) : col.key === 'PRODUCT_SCAN' ? (
                                  <span className="font-bold text-blue-300 tracking-wider">
                                    {val || '-'}
                                  </span>
                                ) : col.key === 'ITEMNAME' ? (
                                  <span className="font-semibold text-slate-100 font-sans">
                                    {val || '-'}
                                  </span>
                                ) : col.key === 'MARGIN' ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      Number(val) >= 20
                                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                        : Number(val) > 0
                                        ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {val !== undefined && val !== '' ? `${val}%` : '-'}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">{val !== undefined && val !== null ? String(val) : '-'}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  Affichage de{' '}
                  <strong className="text-slate-200">
                    {filteredProducts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                  </strong>{' '}
                  à{' '}
                  <strong className="text-slate-200">
                    {Math.min(currentPage * pageSize, filteredProducts.length)}
                  </strong>{' '}
                  sur <strong className="text-slate-200">{filteredProducts.length}</strong> articles
                </span>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none"
                >
                  <option value={50}>50 par page</option>
                  <option value={100}>100 par page</option>
                  <option value={200}>200 par page</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition"
                >
                  Précédent
                </button>
                <span className="text-slate-300 font-semibold">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700 transition"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: IN-APP EXCEL/CSV IMPORTER & CLEANSER*/}
      {/* ========================================== */}
      {activeTab === 'importer' && (
        <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {/* STEP 1: FILE DROPZONE */}
          <div className="bg-slate-800/80 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center transition bg-slate-900/50">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileDropOrSelect}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto">
                <FileUp className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Glisser-déposer votre fichier Excel / ERP / CSV</h3>
              <p className="text-xs text-slate-400">
                L'assistant analyse le fichier, détecte automatiquement les entêtes ERP, supprime les sous-totaux et mappe les 51 colonnes du catalogue.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Sélectionner un fichier (.xlsx, .csv)</span>
              </button>
            </div>
          </div>

          {/* STEP 2: DIAGNOSTIC REPORT & MAPPING MATRIX */}
          {cleanedPreviewRows.length > 0 && (
            <>
              {/* HEALTH SCORE BANNER */}
              {diagnosticReport && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-lg">
                      {diagnosticReport.healthScore}%
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Aperçu du Nettoyage Automatique
                      </h4>
                      <p className="text-xs text-slate-400">
                        {diagnosticReport.validRowsCount} lignes d'articles valides détectées • {diagnosticReport.subtotalsRemovedCount} sous-totaux ignorés • {diagnosticReport.pricesFixedCount} prix corrigés
                      </p>
                    </div>
                  </div>

                  {/* MERGE MODE STRATEGY */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Mode de Fusion:</span>
                    <select
                      value={importMergeMode}
                      onChange={(e: any) => setImportMergeMode(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 font-semibold focus:outline-none"
                    >
                      <option value="update_upsert">🔄 Mettre à Jour & Enrichir (Upsert)</option>
                      <option value="append">🆕 Ajouter à la Suite (Append)</option>
                      <option value="overwrite">⚠️ Remplacer la Base Master</option>
                    </select>

                    <button
                      disabled={isProcessingImport}
                      onClick={handleCommitImport}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider & Importer {cleanedPreviewRows.length} Articles</span>
                    </button>
                  </div>
                </div>
              )}

              {/* COLUMN MAPPING MATRIX */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                      Mapping des Colonnes du Fichier Excel
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Associez chaque colonne de votre fichier source aux champs du schéma Master.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-1">
                  {rawFileHeaders.map((header) => {
                    const currentTarget = columnMappings[header] || 'IGNORE';
                    const isMatched = currentTarget !== 'IGNORE';

                    return (
                      <div
                        key={header}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between space-y-1.5 transition ${
                          isMatched
                            ? 'bg-slate-900/80 border-slate-700'
                            : 'bg-slate-900/30 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 truncate" title={header}>
                            {header}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isMatched ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isMatched ? 'MAPPÉ' : 'IGNORÉ'}
                          </span>
                        </div>

                        <select
                          value={currentTarget}
                          onChange={(e) => handleMappingChange(header, e.target.value)}
                          className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-500 w-full"
                        >
                          <option value="IGNORE">🚫 Ne pas importer</option>
                          <optgroup label="--- CHAMPS CANONIQUES (51) ---">
                            {CANONICAL_SCHEMA.map((col) => (
                              <option key={col.key} value={col.key}>
                                {col.label} ({col.category})
                              </option>
                            ))}
                          </optgroup>
                          {customColumns.length > 0 && (
                            <optgroup label="--- COLONNES CUSTOM ---">
                              {customColumns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LIVE PREVIEW GRID */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  Aperçu Direct des Données Nettoyées ({cleanedPreviewRows.length})
                </h4>

                <div className="overflow-x-auto border border-slate-700 rounded-lg max-h-80">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-slate-900 border-b border-slate-700 text-[10px] uppercase text-slate-400 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">EAN / Scan</th>
                        <th className="p-2.5">Part No</th>
                        <th className="p-2.5">Désignation</th>
                        <th className="p-2.5 text-right">Prix Vente</th>
                        <th className="p-2.5 text-right">Prix Promo</th>
                        <th className="p-2.5">Marque</th>
                        <th className="p-2.5">Rayon</th>
                        <th className="p-2.5 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {cleanedPreviewRows.slice(0, 30).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-750/50">
                          <td className="p-2.5 font-mono text-blue-300 font-bold">{row.PRODUCT_SCAN || '-'}</td>
                          <td className="p-2.5 font-mono">{row.PARTNO || '-'}</td>
                          <td className="p-2.5 font-semibold text-slate-100">{row.ITEMNAME}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-400">
                            {row.SELLING_PRICE ? `${Number(row.SELLING_PRICE).toFixed(2)} FCFA` : '-'}
                          </td>
                          <td className="p-2.5 text-right text-orange-300">
                            {row.PROMOPRICE ? `${Number(row.PROMOPRICE).toFixed(2)} FCFA` : '-'}
                          </td>
                          <td className="p-2.5">{row.BRAND_INFO || '-'}</td>
                          <td className="p-2.5">{row.DEPT_NAME || row['DEPT NAME'] || '-'}</td>
                          <td className="p-2.5 text-right font-mono">{row.SOH || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: CREATE NEW ITEM FORM                */}
      {/* ========================================== */}
      {activeTab === 'new_item' && (
        <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
          <form onSubmit={handleCreateNewItem} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-400" />
                  Créer un Nouvel Article dans la Base Master
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complétez la fiche produit avec les informations requises.
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer l'Article</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Désignation Article *</label>
                <input
                  type="text"
                  required
                  value={newItemData.ITEMNAME || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, ITEMNAME: e.target.value })}
                  placeholder="ex: LAIT UHT DEMI-ECREME 1L"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">EAN / Barcode (PRODUCT_SCAN)</label>
                <input
                  type="text"
                  value={newItemData.PRODUCT_SCAN || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, PRODUCT_SCAN: e.target.value })}
                  placeholder="ex: 3250390001234"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Code Article (PARTNO)</label>
                <input
                  type="text"
                  value={newItemData.PARTNO || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, PARTNO: e.target.value })}
                  placeholder="ex: ART-9981"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Prix de Vente TTC (SELLING_PRICE) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItemData.SELLING_PRICE || 0}
                  onChange={(e) => setNewItemData({ ...newItemData, SELLING_PRICE: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Prix Promo TTC (PROMOPRICE)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newItemData.PROMOPRICE || 0}
                  onChange={(e) => setNewItemData({ ...newItemData, PROMOPRICE: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-orange-300 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rayon (DEPT_NAME)</label>
                <input
                  type="text"
                  value={newItemData.DEPT_NAME || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, DEPT_NAME: e.target.value })}
                  placeholder="ex: EPICERIE"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Marque (BRAND_INFO)</label>
                <input
                  type="text"
                  value={newItemData.BRAND_INFO || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, BRAND_INFO: e.target.value })}
                  placeholder="ex: PRESIDENT"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Stock Physique (SOH)</label>
                <input
                  type="number"
                  value={newItemData.SOH || 0}
                  onChange={(e) => setNewItemData({ ...newItemData, SOH: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: TURSO / LIBSQL & CLOUD SYNC STUDIO  */}
      {/* ========================================== */}
      {activeTab === 'turso_cloud' && (
        <div className="flex-1 p-6 overflow-y-auto max-w-5xl mx-auto w-full space-y-6">
          {/* Card 1: Turso Cloud Configuration */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-bold text-white">
                    Synchronisation Turso / LibSQL Cloud & Edge Database
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    LibSQL Pipeline v2
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Connectez votre base de données distribuée Turso pour répliquer le catalogue d'articles en temps réel entre magasins et terminaux mobiles.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    tursoConfig.status === 'connected'
                      ? 'bg-emerald-400'
                      : tursoConfig.status === 'error'
                      ? 'bg-rose-500'
                      : 'bg-slate-500'
                  }`}
                />
                <span className="text-xs font-semibold text-slate-300 capitalize">
                  {tursoConfig.status === 'connected'
                    ? 'Connecté'
                    : tursoConfig.status === 'error'
                    ? 'Erreur'
                    : 'Déconnecté'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    URL de la Base Turso (databaseUrl) *
                  </label>
                  <input
                    type="text"
                    value={tursoConfig.databaseUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTursoConfig((prev) => databaseService.saveTursoConfig({ databaseUrl: val }));
                    }}
                    placeholder="https://votre-base-votre-org.turso.io"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Supporte les préfixes https:// et libsql://
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Jeton d'Authentification (Auth Token) *
                  </label>
                  <input
                    type="password"
                    value={tursoConfig.authToken}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTursoConfig((prev) => databaseService.saveTursoConfig({ authToken: val }));
                    }}
                    placeholder="eyJhbGciOiJFZERTQ..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Clé générée via `turso db tokens create [db-name]`
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Nom de la Table Distribuée
                  </label>
                  <input
                    type="text"
                    value={tursoConfig.tableName || 'estudio_catalog'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTursoConfig((prev) => databaseService.saveTursoConfig({ tableName: val }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-col justify-center space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={tursoConfig.enabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setTursoConfig((prev) => databaseService.saveTursoConfig({ enabled: val }));
                      }}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                    />
                    <span className="font-semibold">Activer la liaison Turso</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={tursoConfig.autoSync}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setTursoConfig((prev) => databaseService.saveTursoConfig({ autoSync: val }));
                      }}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                    />
                    <span>Synchroniser automatiquement lors des imports ou modifications</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleTestTurso}
                  disabled={tursoTesting || !tursoConfig.databaseUrl}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Activity className={`w-3.5 h-3.5 ${tursoTesting ? 'animate-spin' : 'text-cyan-400'}`} />
                  <span>{tursoTesting ? 'Test en cours...' : 'Tester Connexion (Ping)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushTurso}
                  disabled={tursoSyncing || !tursoConfig.databaseUrl}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition shadow-md"
                >
                  <Upload className={`w-3.5 h-3.5 ${tursoSyncing ? 'animate-bounce' : ''}`} />
                  <span>Envoyer vers Turso ({products.length} articles)</span>
                </button>

                <button
                  type="button"
                  onClick={handlePullTurso}
                  disabled={tursoSyncing || !tursoConfig.databaseUrl}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                >
                  <Download className={`w-3.5 h-3.5 ${tursoSyncing ? 'animate-bounce' : ''}`} />
                  <span>Importer depuis Turso (Download)</span>
                </button>
              </div>

              {/* Feedback Messages */}
              {tursoTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 mt-3 ${
                    tursoTestResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}
                >
                  {tursoTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{tursoTestResult.message}</span>
                </div>
              )}

              {tursoSyncMessage && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 mt-2">
                  {tursoSyncMessage}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Offline-First High-Speed Local Architecture */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">
                  Architecture Locale Offline-First & Moteur IndexedDB v3
                </h3>
              </div>
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Latence de recherche &lt; 2 ms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80">
                <span className="text-slate-400 block font-semibold mb-1">Stockage Principal</span>
                <span className="font-bold text-white text-sm">IndexedDB v3 + RAM Tier</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Persistance asynchrone non-bloquante avec mise en tampon automatique (Debounced Persistence).
                </p>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80">
                <span className="text-slate-400 block font-semibold mb-1">Index de Recherche</span>
                <span className="font-bold text-white text-sm">Tokens Multi-Champs</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Index normalisé précalculé couvrant EAN, SKU, Désignation, Rayon et Marque.
                </p>
              </div>

              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80">
                <span className="text-slate-400 block font-semibold mb-1">Bus Multi-Onglets</span>
                <span className="font-bold text-white text-sm">BroadcastChannel</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Synchronisation instantanée entre onglets ouverts et instance PWA sans rechargement.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs">
              <span className="text-slate-400">
                Articles actuellement indexés en local : <strong className="text-white">{products.length}</strong>
              </span>

              <button
                type="button"
                onClick={handleDownloadSqlDump}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Télécharger le Dump SQL Complet (.sql)</span>
              </button>
            </div>
          </div>

          {/* Card 3: Two-Database Local-First Architecture (System DB & Dataset DB) */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Architecture "Local-First" à Deux Bases (System DB & Dataset DB)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modèle de référence recommandé pour applications Desktop (Electron / Tauri) & Mobiles (Kotlin / React Native)
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Turso / libSQL Standard
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ce modèle sépare hermétiquement la logique applicative et les réglages de la station des jeux de données volumineux importés par les utilisateurs. Aucun jeton secret n'est embarqué dans le binaire compilé, et chaque magasin ou rayon peut manipuler des bases isolées et interchangeables.
            </p>

            {/* Architecture Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-700 rounded-xl overflow-hidden">
                <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Base Physique</th>
                    <th className="p-3">Rôle & Données Stockées</th>
                    <th className="p-3">Cycle de Vie & Initialisation</th>
                    <th className="p-3">Emplacement Recommandé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-850/40 text-slate-300">
                  <tr>
                    <td className="p-3 font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                      <span>1. system.db</span>
                    </td>
                    <td className="p-3">
                      Configuration de l'app, gabarits d'étiquettes, profils opérateurs, imprimantes par défaut, chemins vers les jeux de données actifs.
                    </td>
                    <td className="p-3 text-slate-400">
                      Livrée vierge dans l'installateur, initialisée au tout premier lancement du logiciel.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      %AppData%/EStudio/system.db (Win)<br />
                      ~/Library/Application Support/EStudio (macOS)
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-purple-400 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-purple-400" />
                      <span>2. dataset_xyz.db</span>
                    </td>
                    <td className="p-3">
                      Catalogue réel d'articles (EAN, désignation, prix régulier, prix promo, stocks, rayonnage).
                    </td>
                    <td className="p-3 text-slate-400">
                      Créée dynamiquement à la volée dès que l'utilisateur crée un espace de travail ou importe un fichier Excel/CSV.
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      %AppData%/EStudio/workspaces/data_*.db<br />
                      (ou fichier local sélectionné par l'utilisateur)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Step-by-Step Implementation with libSQL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              {/* Step 1 */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Initialisation Dynamique</span>
                </div>
                <p className="text-slate-400 text-[11px] flex-1">
                  Création instantanée d'un fichier SQLite isolé et exécution des migrations sans nécessiter d'accès réseau.
                </p>
                <pre className="bg-slate-950 p-2.5 rounded-lg text-[10px] font-mono text-cyan-300 border border-slate-800 overflow-x-auto">
{`import { createClient } from "@libsql/client";

function initUserDataset(name: string) {
  const localPath = \`file:./data_\${name}.db\`;
  const db = createClient({ url: localPath });
  await db.execute(\`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL,
      barcode TEXT
    );
  \`);
  return db;
}`}
                </pre>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Batch Inserts Microseconde</span>
                </div>
                <p className="text-slate-400 text-[11px] flex-1">
                  Import haute vitesse (Approach A: Batch transaction verrouillée en mode "write", ou Approach B: Remplacement direct du fichier .db).
                </p>
                <pre className="bg-slate-950 p-2.5 rounded-lg text-[10px] font-mono text-purple-300 border border-slate-800 overflow-x-auto">
{`// High-speed batch insert
await dbClient.batch(
  parsedItems.map(item => ({
    sql: "INSERT INTO items VALUES (?, ?, ?, ?)",
    args: [item.id, item.name, item.price, item.ean]
  })),
  "write" // Verrouille pour vitesse max
);

// Approach B: Swapping physique
// Copiez simplement magasin_nord.db 
// et réorientez l'URL de connexion !`}
                </pre>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Réplica Cloud Optionnel</span>
                </div>
                <p className="text-slate-400 text-[11px] flex-1">
                  Synchronisation bidirectionnelle fluide vers Turso Cloud dès que le poste souhaite partager ses données avec la flotte mobile.
                </p>
                <pre className="bg-slate-950 p-2.5 rounded-lg text-[10px] font-mono text-emerald-300 border border-slate-800 overflow-x-auto">
{`// Upgrade local file to synced replica
const syncedClient = createClient({
  url: "file:local_dataset.db",
  syncUrl: "libsql://dataset-123.turso.io",
  authToken: userEphemeralToken,
});

// Sync push & pull bidirectionnel
await syncedClient.sync();`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* COLUMN SELECTOR MODAL / POPOVER            */}
      {/* ========================================== */}
      {isColumnSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Columns className="w-4 h-4 text-blue-400" />
                Personnaliser les Colonnes Visibles dans la Grille
              </h3>
              <button
                onClick={() => setIsColumnSelectorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ADD CUSTOM COLUMN INPUT */}
            <div className="p-4 bg-slate-850/50 border-b border-slate-800 flex items-center gap-3">
              <input
                type="text"
                value={newCustomColumnName}
                onChange={(e) => setNewCustomColumnName(e.target.value)}
                placeholder="Ajouter un nouveau champ dynamique (ex: SHELF_LOC, ECO_TAX)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddCustomColumn}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition"
              >
                + Ajouter Champ
              </button>
            </div>

            {/* COLUMN CHECKBOXES */}
            <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              {CANONICAL_SCHEMA.map((col) => {
                const isChecked = visibleColumnKeys.includes(col.key);
                return (
                  <label
                    key={col.key}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      isChecked
                        ? 'bg-blue-950/40 border-blue-600/60 text-blue-200'
                        : 'bg-slate-850/30 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-semibold">{col.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setVisibleColumnKeys(visibleColumnKeys.filter((k) => k !== col.key));
                        } else {
                          setVisibleColumnKeys([...visibleColumnKeys, col.key]);
                        }
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                    />
                  </label>
                );
              })}

              {customColumns.map((col) => {
                const isChecked = visibleColumnKeys.includes(col);
                return (
                  <label
                    key={col}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      isChecked
                        ? 'bg-purple-950/40 border-purple-600/60 text-purple-200'
                        : 'bg-slate-850/30 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[11px] font-semibold">{col}</span>
                      <span className="px-1 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] rounded font-bold">
                        CUSTOM
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setVisibleColumnKeys(visibleColumnKeys.filter((k) => k !== col));
                        } else {
                          setVisibleColumnKeys([...visibleColumnKeys, col]);
                        }
                      }}
                      className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
                    />
                  </label>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsColumnSelectorOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition"
              >
                Appliquer les colonnes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* EDIT PRODUCT MODAL DRAWER                  */}
      {/* ========================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Fiche Produit Master
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ID: {editingProduct.id}</p>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {CANONICAL_SCHEMA.map((col) => {
                  const val = getProductFieldValue(editingProduct, col.key, col.aliases);
                  return (
                    <div key={col.key}>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        {col.label}
                      </label>
                      <input
                        type={col.type === 'number' || col.type === 'currency' ? 'number' : 'text'}
                        step={col.type === 'currency' ? '0.01' : '1'}
                        value={val !== undefined && val !== null ? val : ''}
                        onChange={(e) => {
                          const value = col.type === 'number' || col.type === 'currency' ? Number(e.target.value) : e.target.value;
                          setEditingProduct({
                            ...editingProduct,
                            [col.key]: value,
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  databaseService.deleteSingleProduct(editingProduct.id);
                  setEditingProduct(null);
                }}
                className="px-3.5 py-2 bg-red-950 text-red-300 border border-red-800 text-xs font-semibold rounded-lg hover:bg-red-900 transition"
              >
                Supprimer de la base
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProductEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Sauvegarder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
