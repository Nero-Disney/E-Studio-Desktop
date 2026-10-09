import { ProductRecord, TextItemProperties, TemplateItem } from '../types';
import { resolveCanonicalKey } from './mappingDictionary';

/**
 * Advanced Retail & Pricing Engine for E-Studio
 * Handles automatic unit price per kg/L, discount percentage, 
 * secondary currency conversion, dynamic dates (DLC/DLUO), and conditional display rules.
 */
export class PricingEngine {
  /**
   * Helper: Resolves field value from ProductRecord, taking into account exact keys, 
   * canonical domain aliases, and case/spacing normalization.
   */
  static getProductFieldValue(record: ProductRecord | null | undefined, bindingKey: string): any {
    if (!record || !bindingKey) return undefined;

    // Check custom name override (Virtual assortment substitution)
    if (
      (bindingKey === 'ITEMNAME' || bindingKey === 'DESIGNATION' || bindingKey === 'PRODUCT_NAME') &&
      record.custom_name_override &&
      record.custom_name_override.trim() !== ''
    ) {
      return record.custom_name_override;
    }

    // 1. Direct property match
    if (record[bindingKey] !== undefined && record[bindingKey] !== null && record[bindingKey] !== '') {
      return record[bindingKey];
    }

    // 2. Special handling for Promo Price
    if (bindingKey === 'PROMOPRICE') {
      return PricingEngine.getPromoPrice(record);
    }

    // 3. Special handling for Selling Price
    if (bindingKey === 'SELLING_PRICE') {
      return PricingEngine.getSellingPrice(record);
    }

    // 4. Normalized key search (e.g. "PRIX_PROMO", "PRIX PROMO", "prix_promo")
    const normTarget = bindingKey.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
    for (const k of Object.keys(record)) {
      const kNorm = k.trim().toUpperCase().replace(/[\s\.\-]+/g, '_');
      if (kNorm === normTarget && record[k] !== undefined && record[k] !== null && record[k] !== '') {
        return record[k];
      }
    }

    // 5. Check if canonical resolution matches
    for (const k of Object.keys(record)) {
      const canonical = resolveCanonicalKey(k);
      if (canonical === bindingKey && record[k] !== undefined && record[k] !== null && record[k] !== '') {
        return record[k];
      }
    }

    return undefined;
  }

  /**
   * Helper: Resolves promo price from record with fallback matching
   */
  static getPromoPrice(record: ProductRecord | null | undefined): number | undefined {
    if (!record) return undefined;

    if (typeof record.PROMOPRICE === 'number' && !isNaN(record.PROMOPRICE) && record.PROMOPRICE > 0) {
      return record.PROMOPRICE;
    }

    // Search record keys for canonical PROMOPRICE
    for (const k of Object.keys(record)) {
      const canonical = resolveCanonicalKey(k);
      if (canonical === 'PROMOPRICE') {
        const val = record[k];
        if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
        if (typeof val === 'string') {
          const num = parseFloat(val.replace(',', '.').replace(/[^0-9.-]+/g, ''));
          if (!isNaN(num) && num > 0) return num;
        }
      }
    }

    return undefined;
  }

  /**
   * Helper: Resolves standard selling price from record with fallback matching
   */
  static getSellingPrice(record: ProductRecord | null | undefined): number {
    if (!record) return 0;

    if (typeof record.SELLING_PRICE === 'number' && !isNaN(record.SELLING_PRICE)) {
      return record.SELLING_PRICE;
    }

    for (const k of Object.keys(record)) {
      const canonical = resolveCanonicalKey(k);
      if (canonical === 'SELLING_PRICE') {
        const val = record[k];
        if (typeof val === 'number' && !isNaN(val)) return val;
        if (typeof val === 'string') {
          const num = parseFloat(val.replace(',', '.').replace(/[^0-9.-]+/g, ''));
          if (!isNaN(num)) return num;
        }
      }
    }

    return 0;
  }

  /**
   * Evaluates whether an item should be rendered based on its conditional display configuration
   */
  static shouldDisplayItem(item: TemplateItem, record?: ProductRecord | null): boolean {
    if (!item.conditional_display || !item.conditional_display.enabled) {
      return true;
    }

    if (!record) return true;

    const { rule, field_key } = item.conditional_display;

    switch (rule) {
      case 'has_promo': {
        const promo = PricingEngine.getPromoPrice(record);
        const base = PricingEngine.getSellingPrice(record);
        return promo !== undefined && promo > 0 && (base === 0 || promo < base);
      }

      case 'has_barcode': {
        const scan = PricingEngine.resolveBarcodeValue(item, record);
        return Boolean(scan && String(scan).trim().length > 0);
      }

      case 'has_tiers':
        return Boolean(record.TIERS && record.TIERS.length > 0);

      case 'field_gt_zero': {
        const key = field_key || item.binding_key;
        if (!key) return true;
        const val = PricingEngine.getProductFieldValue(record, key);
        const num = typeof val === 'number' ? val : parseFloat(String(val || 0));
        return !isNaN(num) && num > 0;
      }

      case 'field_not_empty': {
        const key = field_key || item.binding_key;
        if (!key) return true;
        const val = PricingEngine.getProductFieldValue(record, key);
        return val !== undefined && val !== null && String(val).trim() !== '';
      }

      case 'always':
      default:
        return true;
    }
  }

  /**
   * Dynamically resolves the barcode data from the ProductRecord with intelligent
   * alias matching, case-insensitivity, and fallback cascade (binding_key -> PRODUCT_SCAN -> PARTNO/SKU -> id).
   */
  static resolveBarcodeValue(
    item: { binding_key?: string; code?: string; barcode_type?: string } | TemplateItem,
    record?: ProductRecord | null
  ): string {
    if (record) {
      // 1. Explicit binding key defined on element
      if (item.binding_key) {
        const val = PricingEngine.getProductFieldValue(record, item.binding_key);
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }

      // 2. Automatic canonical barcode domain resolution
      const scan = PricingEngine.getProductFieldValue(record, 'PRODUCT_SCAN');
      if (scan !== undefined && scan !== null && String(scan).trim() !== '') {
        return String(scan).trim();
      }

      // 3. Fallback to SKU / Reference / PARTNO
      const partNo = PricingEngine.getProductFieldValue(record, 'PARTNO');
      if (partNo !== undefined && partNo !== null && String(partNo).trim() !== '') {
        return String(partNo).trim();
      }

      // 4. Fallback to product record ID
      if (record.id) {
        return String(record.id).trim();
      }
    }

    // Static fallback
    return (item as any).code || '3250390123456';
  }

  /**
   * Dynamically resolves QR Code payload/URL from the ProductRecord,
   * supporting template tags (e.g. {{PARTNO}}), explicit binding keys, or product scan fallbacks.
   */
  static resolveQrContent(
    item: { binding_key?: string; content?: string } | TemplateItem,
    record?: ProductRecord | null
  ): string {
    if (record) {
      // 1. Explicit binding key
      if (item.binding_key) {
        const val = PricingEngine.getProductFieldValue(record, item.binding_key);
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }

      // 2. Interpolate template variables in content (e.g. "https://store.com/item/{{PARTNO}}")
      const rawContent = (item as any).content;
      if (rawContent && typeof rawContent === 'string' && rawContent.includes('{{')) {
        return rawContent.replace(/\{\{([^}]+)\}\}/g, (_: string, key: string) => {
          const val = PricingEngine.getProductFieldValue(record, key.trim());
          return val !== undefined && val !== null ? String(val) : '';
        });
      }

      // 3. If content is default placeholder, try falling back to product link or barcode or partno
      const defaultContents = ['https://example.com', 'https://monmagasin.fr', ''];
      if (!rawContent || defaultContents.includes(rawContent)) {
        const scan = PricingEngine.getProductFieldValue(record, 'PRODUCT_SCAN');
        if (scan) return String(scan);
        const partNo = PricingEngine.getProductFieldValue(record, 'PARTNO');
        if (partNo) return String(partNo);
      }
    }

    return (item as any).content || 'https://example.com';
  }

  /**
   * Injects non-breaking spaces (\u00A0) between numbers and units or currencies
   * to guarantee professional typography and prevent line-wrapping detachment.
   */
  static injectNonBreakingSpaces(input: string): string {
    if (!input) return input;
    return input
      .replace(/(\d[\d\s.,]*)\s+([€$£¥]|FCFA|CFA|F|USD|EUR)\b/gi, '$1\u00A0$2')
      .replace(/(\d[\d.,]*)\s+(%|‰)/g, '$1\u00A0$2')
      .replace(/(\d[\d.,]*)\s+(kg|g|mg|L|l|cl|ml|pièce|pièces|pcs|carton|cartons|ctn|cm|mm|m)\b/gi, '$1\u00A0$2');
  }

  /**
   * Splits a raw price into integer part and decimal part for smart floating decimal styling
   */
  static splitPrice(
    val: number | string | undefined | null,
    separator: '.' | ',' = ','
  ): { integerPart: string; decimalPart: string; hasDecimals: boolean } {
    if (val === undefined || val === null || val === '') {
      return { integerPart: '0', decimalPart: '00', hasDecimals: false };
    }

    let numVal: number;
    if (typeof val === 'number') {
      numVal = val;
    } else {
      const parsed = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]+/g, ''));
      numVal = isNaN(parsed) ? 0 : parsed;
    }

    // Format with 2 decimals if has decimal part or if fixed
    const formatted = numVal.toFixed(2);
    const [intPart, decPart] = formatted.split('.');
    
    // Group integer with spaces
    const integerGrouped = parseInt(intPart, 10).toLocaleString('fr-FR');
    const hasDecimals = decPart !== undefined && decPart !== '00';

    return {
      integerPart: integerGrouped,
      decimalPart: decPart || '00',
      hasDecimals,
    };
  }

  /**
   * Resolves dynamic calculated text values for text items (Unit price / Discount % / Secondary currency / Dynamic dates)
   */
  static resolveCalculatedText(item: TextItemProperties, record?: ProductRecord | null): string {
    const rawResult = PricingEngine._computeCalculatedText(item, record);
    return PricingEngine.injectNonBreakingSpaces(rawResult);
  }

  private static _computeCalculatedText(item: TextItemProperties, record?: ProductRecord | null): string {
    // If no record is provided, return preview placeholders
    if (!record) {
      if (item.calculation_mode === 'unit_price') return '7,80 € / kg';
      if (item.calculation_mode === 'discount_pct') return '-20%';
      if (item.calculation_mode === 'secondary_currency') return '(~ 3,73 €)';
      if (item.calculation_mode === 'dynamic_date') return `DLC : ${PricingEngine.formatDateOffset(3, 'DD/MM/YYYY')}`;
      return item.text;
    }

    const promoPrice = PricingEngine.getPromoPrice(record);
    const sellingPrice = PricingEngine.getSellingPrice(record);

    // 1. Unit Price Calculation (Prix au kilo / litre / pièce)
    if (item.calculation_mode === 'unit_price' && item.unit_price_config?.enabled) {
      const cfg = item.unit_price_config;
      const basePrice = (promoPrice && promoPrice > 0) ? promoPrice : sellingPrice;
      
      // Determine quantity / weight from explicit record fields or fallback heuristics
      let quantity = 1.0;
      if (cfg.weight_volume_key) {
        const raw = PricingEngine.getProductFieldValue(record, cfg.weight_volume_key);
        if (raw !== undefined) {
          quantity = typeof raw === 'number' ? raw : parseFloat(String(raw)) || 1.0;
        }
      } else if (record.NET_WEIGHT_KG) {
        quantity = record.NET_WEIGHT_KG;
      } else if (record.VOLUME_L) {
        quantity = record.VOLUME_L;
      } else if (record.CASE_SIZE) {
        quantity = record.CASE_SIZE;
      } else {
        // Try parsing numbers from pack unit or item name (e.g. "250g" -> 0.25kg, "1L" -> 1.0)
        quantity = PricingEngine.extractQuantityFromText(record.PACK_UNIT || record.ITEMNAME, cfg.measure_unit);
      }

      if (quantity <= 0) quantity = 1.0;

      const unitPrice = basePrice / quantity;
      const formattedUnitPrice = unitPrice >= 100 
        ? Math.round(unitPrice).toLocaleString('fr-FR')
        : unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      const currency = item.currency_symbol || (sellingPrice > 500 ? 'FCFA' : '€');
      return `${formattedUnitPrice} ${currency} / ${cfg.measure_unit}`;
    }

    // 2. Discount Percentage (-25%)
    if (item.calculation_mode === 'discount_pct' || item.promo_badge_type === 'discount_pct') {
      if (record.DISCOUNT_PCT !== undefined && record.DISCOUNT_PCT > 0) {
        return `-${Math.round(record.DISCOUNT_PCT)}%`;
      }
      if (promoPrice && promoPrice > 0 && sellingPrice > promoPrice) {
        const pct = Math.round(((sellingPrice - promoPrice) / sellingPrice) * 100);
        return `-${pct}%`;
      }
      return '-20%';
    }

    // 3. Secondary Currency Conversion (e.g. FCFA -> EUR)
    if (item.calculation_mode === 'secondary_currency' && item.secondary_currency_config?.enabled) {
      const cfg = item.secondary_currency_config;
      const basePrice = (promoPrice && promoPrice > 0) ? promoPrice : sellingPrice;
      const rate = cfg.exchange_rate > 0 ? cfg.exchange_rate : 655.957;

      const converted = cfg.mode === 'multiply' ? basePrice * rate : basePrice / rate;
      const formattedConverted = converted >= 100
        ? Math.round(converted).toLocaleString('fr-FR')
        : converted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return `(~ ${formattedConverted} ${cfg.target_currency})`;
    }

    // 4. Dynamic Date (DLC / DLUO / Fabrication)
    if (item.calculation_mode === 'dynamic_date' && item.dynamic_date_config?.enabled) {
      const cfg = item.dynamic_date_config;
      const formattedDate = PricingEngine.formatDateOffset(cfg.offset_days || 0, cfg.format || 'DD/MM/YYYY');
      const prefix = cfg.prefix_label ? `${cfg.prefix_label} ` : '';
      return `${prefix}${formattedDate}`;
    }

    // Fallback: standard binding key or static text
    if (item.binding_key) {
      const val = PricingEngine.getProductFieldValue(record, item.binding_key);
      if (val !== undefined && val !== null && val !== '') {
        if (typeof val === 'number') {
          return val.toLocaleString('fr-FR');
        }
        return String(val);
      }
    }

    return item.text;
  }

  /**
   * Helper: formats a date offset from today (e.g. +3 days)
   */
  static formatDateOffset(offsetDays: number, format: string): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const shortYear = String(year).slice(-2);

    switch (format) {
      case 'DD.MM.YY':
        return `${day}.${month}.${shortYear}`;
      case 'DD/MM':
        return `${day}/${month}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
      default:
        return `${day}/${month}/${year}`;
    }
  }

  /**
   * Helper: heuristic parser for weight/volume (e.g. "250g" -> 0.25 kg, "500ml" -> 0.5 L)
   */
  static extractQuantityFromText(text: string, targetUnit: string): number {
    if (!text) return 1.0;
    const clean = text.toLowerCase();

    // Check grams (e.g. "250g", "250 g")
    const matchG = clean.match(/(\d+(?:[.,]\d+)?)\s*g\b/);
    if (matchG && targetUnit === 'kg') {
      const g = parseFloat(matchG[1].replace(',', '.'));
      return g / 1000;
    }

    // Check kg
    const matchKg = clean.match(/(\d+(?:[.,]\d+)?)\s*kg\b/);
    if (matchKg && targetUnit === 'kg') {
      return parseFloat(matchKg[1].replace(',', '.'));
    }

    // Check ml / cl / L
    const matchMl = clean.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
    if (matchMl && targetUnit === 'L') {
      return parseFloat(matchMl[1].replace(',', '.')) / 1000;
    }

    const matchCl = clean.match(/(\d+(?:[.,]\d+)?)\s*cl\b/);
    if (matchCl && targetUnit === 'L') {
      return parseFloat(matchCl[1].replace(',', '.')) / 100;
    }

    const matchL = clean.match(/(\d+(?:[.,]\d+)?)\s*l\b/);
    if (matchL && targetUnit === 'L') {
      return parseFloat(matchL[1].replace(',', '.'));
    }

    return 1.0;
  }
}
