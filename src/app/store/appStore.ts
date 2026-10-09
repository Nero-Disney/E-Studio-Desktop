import { ProductRecord } from '../../domains/catalog/ProductRecord';
import { SyncJob } from '../../domains/sync/syncContracts';
import { LabelTemplate, TemplateItem } from '../../domains/templates/Template';

export interface AppStoreSnapshot {
  templates: LabelTemplate[];
  products: ProductRecord[];
  syncJobs: SyncJob[];
}

const createTemplateItems = (): TemplateItem[] => [
  {
    id: 'title',
    type: 'text',
    name: 'Product title',
    xMm: 12,
    yMm: 18,
    widthMm: 52,
    heightMm: 8,
    rotationDeg: 0,
    zIndex: 1,
    locked: false,
    bindingKey: 'ITEMNAME',
  },
  {
    id: 'price',
    type: 'price_block',
    name: 'Price block',
    xMm: 12,
    yMm: 42,
    widthMm: 30,
    heightMm: 10,
    rotationDeg: 0,
    zIndex: 2,
    locked: false,
    bindingKey: 'SELLING_PRICE',
  },
  {
    id: 'barcode',
    type: 'barcode',
    name: 'Barcode',
    xMm: 48,
    yMm: 42,
    widthMm: 27,
    heightMm: 13,
    rotationDeg: 0,
    zIndex: 3,
    locked: false,
    bindingKey: 'PRODUCT_SCAN',
  },
];

export function createAppStoreSnapshot(): AppStoreSnapshot {
  const templates: LabelTemplate[] = [
    {
      id: 'tpl-shelf-01',
      name: 'Shelf Tag Standard',
      widthMm: 100,
      heightMm: 60,
      margins: { top: 4, right: 4, bottom: 4, left: 4 },
      backgroundColor: '#ffffff',
      defaultImposition: {
        pageSize: 'A4',
        orientation: 'landscape',
        gapXmm: 2,
        gapYmm: 2,
        showCropMarks: true,
        startOffsetSlot: 1,
      },
      items: createTemplateItems(),
      version: 1,
      updatedAt: '2026-09-20T10:00:00.000Z',
      createdAt: '2026-09-15T09:30:00.000Z',
      status: 'valid',
    },
    {
      id: 'tpl-promo-02',
      name: 'Promo Endcap',
      widthMm: 120,
      heightMm: 80,
      margins: { top: 6, right: 6, bottom: 6, left: 6 },
      backgroundColor: '#f8fafc',
      defaultImposition: {
        pageSize: 'A3',
        orientation: 'portrait',
        gapXmm: 3,
        gapYmm: 3,
        showCropMarks: false,
        startOffsetSlot: 2,
      },
      items: [
        ...createTemplateItems(),
        {
          id: 'promo-tag',
          type: 'shape',
          name: 'Promotion badge',
          xMm: 64,
          yMm: 16,
          widthMm: 24,
          heightMm: 12,
          rotationDeg: 0,
          zIndex: 4,
          locked: false,
          bindingKey: 'PROMOPRICE',
        },
      ],
      version: 2,
      updatedAt: '2026-09-22T14:00:00.000Z',
      createdAt: '2026-09-18T07:15:00.000Z',
      status: 'warning',
    },
  ];

  const products: ProductRecord[] = [
    {
      id: 'P-1001',
      ITEMNAME: 'Café Arabica 250g',
      PRODUCT_SCAN: '978020137962',
      PARTNO: 'AR-250',
      BRAND_INFO: 'Arabica',
      CATEGORY_NAME: 'Coffee',
      DEPT_NAME: 'Grocery',
      SELLING_PRICE: 12.99,
      PROMOPRICE: 10.99,
      CASE_SIZE: 18,
      UNIT: 'Pack',
      CURRENCY: 'CAD',
      raw: { status: 'valid' },
      updatedAt: '2026-09-25T11:30:00.000Z',
    },
    {
      id: 'P-1002',
      ITEMNAME: 'Pasta Biologique 500g',
      PRODUCT_SCAN: '978111234567',
      PARTNO: 'PA-500',
      BRAND_INFO: 'Terra',
      CATEGORY_NAME: 'Dry Goods',
      DEPT_NAME: 'Pantry',
      SELLING_PRICE: 8.5,
      PROMOPRICE: 7.5,
      CASE_SIZE: 12,
      UNIT: 'Pack',
      CURRENCY: 'CAD',
      raw: { status: 'valid' },
      updatedAt: '2026-09-25T12:00:00.000Z',
    },
    {
      id: 'P-1003',
      ITEMNAME: 'Énergie Citrus 330ml',
      PRODUCT_SCAN: '978222334455',
      PARTNO: 'EN-330',
      BRAND_INFO: 'Pulse',
      CATEGORY_NAME: 'Beverage',
      DEPT_NAME: 'Cold Drinks',
      SELLING_PRICE: 4.25,
      PROMOPRICE: 3.75,
      CASE_SIZE: 24,
      UNIT: 'Can',
      CURRENCY: 'CAD',
      raw: { status: 'needs_review' },
      updatedAt: '2026-09-24T08:20:00.000Z',
    },
  ];

  const syncJobs: SyncJob[] = [
    {
      id: 'job-01',
      type: 'product_import',
      status: 'completed',
      createdAt: '2026-09-25T09:00:00.000Z',
      updatedAt: '2026-09-25T09:08:00.000Z',
      payload: { importedCount: 182 },
    },
    {
      id: 'job-02',
      type: 'template_sync',
      status: 'running',
      createdAt: '2026-09-26T08:15:00.000Z',
      updatedAt: '2026-09-26T08:35:00.000Z',
      sourceDeviceId: 'device-shelf-01',
      destinationDeviceId: 'device-ops-02',
    },
  ];

  return { templates, products, syncJobs };
}
