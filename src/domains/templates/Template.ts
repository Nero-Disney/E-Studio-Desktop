export type TemplateStatus = 'draft' | 'valid' | 'warning' | 'error';

export interface TemplateMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ImpositionConfig {
  pageSize: 'A4' | 'A3' | 'Letter' | 'Custom';
  orientation: 'portrait' | 'landscape';
  gapXmm: number;
  gapYmm: number;
  showCropMarks: boolean;
  startOffsetSlot: number;
  customPageWidthMm?: number;
  customPageHeightMm?: number;
}

export interface ConditionalDisplayRule {
  enabled: boolean;
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'contains' | 'not_empty';
  value?: string | number | boolean;
}

export type TemplateItemType =
  | 'text'
  | 'shape'
  | 'ellipse'
  | 'line'
  | 'barcode'
  | 'qrcode'
  | 'image'
  | 'tier_price'
  | 'pictogram'
  | 'price_block'
  | 'curved_text';

export interface TemplateItemBase {
  id: string;
  type: TemplateItemType;
  name: string;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotationDeg: number;
  zIndex: number;
  locked: boolean;
  bindingKey?: string;
  conditionalDisplay?: ConditionalDisplayRule;
}

export interface TemplateItem extends TemplateItemBase {
  [key: string]: unknown;
}

export interface LabelTemplate {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  margins: TemplateMargins;
  backgroundColor: string;
  defaultImposition: ImpositionConfig;
  items: TemplateItem[];
  version: number;
  updatedAt: string;
  createdAt: string;
  status: TemplateStatus;
}
