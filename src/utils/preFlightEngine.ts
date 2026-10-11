import { LabelTemplate, TemplateItem, ProductRecord } from '../types';

export type PreFlightSeverity = 'error' | 'warning' | 'info';
export type PreFlightCategory = 'geometry' | 'data' | 'barcode' | 'typography';

export interface PreFlightIssue {
  id: string;
  severity: PreFlightSeverity;
  category: PreFlightCategory;
  message: string;
  itemId?: string;
  field?: string;
}

export type ComputedTemplateStatus = 'ready' | 'warning' | 'draft';

export interface PreFlightReport {
  status: ComputedTemplateStatus;
  errorsCount: number;
  warningsCount: number;
  infosCount: number;
  issues: PreFlightIssue[];
  passed: boolean;
}

export class PreFlightEngine {
  /**
   * Evaluates template geometric integrity, required retail bindings,
   * barcode encodability, and minimum font sizing against a sample product.
   */
  static analyzeTemplate(
    template: LabelTemplate,
    sampleProduct?: ProductRecord
  ): PreFlightReport {
    const issues: PreFlightIssue[] = [];

    // 1. Geometric bounds validation
    const width = template.width_mm || 100;
    const height = template.height_mm || 50;
    const margins = template.inner_margins_mm || { top: 0, bottom: 0, left: 0, right: 0 };

    const minX = margins.left;
    const minY = margins.top;
    const maxX = width - margins.right;
    const maxY = height - margins.bottom;

    if (!template.items || template.items.length === 0) {
      issues.push({
        id: 'no_elements',
        severity: 'error',
        category: 'geometry',
        message: 'Le gabarit ne contient aucun élément graphique ou textuel.',
      });
    }

    let hasPriceElement = false;
    let hasNameElement = false;

    template.items.forEach((item: TemplateItem) => {
      // Check boundaries
      const itemRight = item.x_mm + item.w_mm;
      const itemBottom = item.y_mm + item.h_mm;
      const label = item.type;

      if (item.x_mm < minX || item.y_mm < minY || itemRight > maxX || itemBottom > maxY) {
        issues.push({
          id: `overflow_${item.id}`,
          severity: 'warning',
          category: 'geometry',
          message: `L'élément "${label}" dépasse les marges intérieures sécurisées (${itemRight.toFixed(1)}x${itemBottom.toFixed(1)}mm).`,
          itemId: item.id,
        });
      }

      // Check zero or negative dimensions
      if (item.w_mm <= 0 || item.h_mm <= 0) {
        issues.push({
          id: `zero_dim_${item.id}`,
          severity: 'error',
          category: 'geometry',
          message: `L'élément "${label}" possède une dimension nulle ou négative.`,
          itemId: item.id,
        });
      }

      // Typography checks
      if (item.type === 'text') {
        const fontSize = item.font_size_pt || 12;
        if (fontSize < 5) {
          issues.push({
            id: `font_too_small_${item.id}`,
            severity: 'warning',
            category: 'typography',
            message: `Taille de police très réduite (${fontSize}pt) sur l'élément texte. Risque d'illisibilité en rayon.`,
            itemId: item.id,
          });
        }
      }

      // Price field identification
      if (
        item.type === 'price_block' ||
        item.type === 'tier_price' ||
        (item.type === 'text' && (item.is_price || item.binding_key === 'SELLING_PRICE' || item.binding_key === 'PROMOPRICE')) ||
        item.binding_key === 'SELLING_PRICE' ||
        item.binding_key === 'PROMOPRICE'
      ) {
        hasPriceElement = true;
      }

      // Designation / Item Name identification
      if (
        item.binding_key === 'ITEMNAME' ||
        (item.type === 'text' && item.text && item.text.toLowerCase().includes('designation'))
      ) {
        hasNameElement = true;
      }

      // Barcode element checks
      if (item.type === 'barcode') {
        const barcodeType = item.barcode_type || 'ean13';
        const sampleValue = sampleProduct?.PRODUCT_SCAN || item.code || '3017620422003';

        if (barcodeType === 'ean13') {
          const sanitized = String(sampleValue).replace(/\D/g, '');
          if (sanitized.length !== 12 && sanitized.length !== 13) {
            issues.push({
              id: `ean_length_${item.id}`,
              severity: 'error',
              category: 'barcode',
              message: `Code EAN-13 attend 12 ou 13 chiffres (valeur échantillon: ${sanitized.length} chiffres).`,
              itemId: item.id,
            });
          }
        }
      }
    });

    // Mandatory retail fields
    if (!hasPriceElement) {
      issues.push({
        id: 'missing_price',
        severity: 'warning',
        category: 'data',
        message: 'Aucun champ de prix (SELLING_PRICE ou bloc prix) lié dans ce gabarit étiquette.',
      });
    }

    if (!hasNameElement) {
      issues.push({
        id: 'missing_name',
        severity: 'info',
        category: 'data',
        message: 'Aucun champ de désignation article (ITEMNAME) identifié.',
      });
    }

    const errorsCount = issues.filter((i) => i.severity === 'error').length;
    const warningsCount = issues.filter((i) => i.severity === 'warning').length;
    const infosCount = issues.filter((i) => i.severity === 'info').length;

    let status: ComputedTemplateStatus = 'ready';
    if (errorsCount > 0) {
      status = 'draft';
    } else if (warningsCount > 0) {
      status = 'warning';
    }

    return {
      status,
      errorsCount,
      warningsCount,
      infosCount,
      issues,
      passed: errorsCount === 0,
    };
  }

  /**
   * Fast computed status getter without full report overhead
   */
  static computeTemplateStatus(template: LabelTemplate): ComputedTemplateStatus {
    const report = PreFlightEngine.analyzeTemplate(template);
    return report.status;
  }
}
