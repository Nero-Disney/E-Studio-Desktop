import { ProductRecord, BatchSpoolConfig } from '../types';

export interface SpoolBatch {
  batchNumber: number;
  totalBatches: number;
  groupKey: string; // e.g. "Rayon Épicerie" or "Allée A1"
  items: ProductRecord[];
  totalLabels: number;
}

export function createSpoolBatches(
  products: ProductRecord[],
  config: BatchSpoolConfig = { batch_size: 500, group_by_field: 'DEPT_NAME', sort_order: 'aisle_order' }
): SpoolBatch[] {
  if (!products || products.length === 0) return [];

  // 1. Group products
  const groups = new Map<string, ProductRecord[]>();

  products.forEach((prod) => {
    let groupKey = 'Tous les produits';
    if (config.group_by_field !== 'none') {
      groupKey = String((prod as any)[config.group_by_field] || 'Sans Département').trim();
    }
    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(prod);
  });

  // 2. Sort within groups
  const sortedBatches: SpoolBatch[] = [];
  let batchCounter = 1;

  groups.forEach((groupProducts, groupKey) => {
    // Sort
    const sorted = [...groupProducts].sort((a, b) => {
      if (config.sort_order === 'alphabetical') {
        return (a.ITEMNAME || '').localeCompare(b.ITEMNAME || '');
      }
      if (config.sort_order === 'sku_order') {
        return (a.PARTNO || '').localeCompare(b.PARTNO || '');
      }
      // Default aisle / original order
      return 0;
    });

    // Chunk into batch_size
    const batchSize = Math.max(10, config.batch_size || 500);
    for (let i = 0; i < sorted.length; i += batchSize) {
      const chunk = sorted.slice(i, i + batchSize);
      sortedBatches.push({
        batchNumber: batchCounter++,
        totalBatches: 0, // Will fill after
        groupKey: groupKey,
        items: chunk,
        totalLabels: chunk.reduce((sum, p) => sum + (p.forced_copies || 1), 0),
      });
    }
  });

  // Update total batches count
  const total = sortedBatches.length;
  sortedBatches.forEach(b => { b.totalBatches = total; });

  return sortedBatches;
}
