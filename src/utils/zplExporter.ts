import { LabelTemplate, ProductRecord } from '../types';
import { PricingEngine } from './pricingEngine';

export interface ZplConfig {
  dpi: 203 | 300 | 600;
  quantity: number;
  printSpeed: number; // 2 to 14
  darkness: number; // 0 to 30
  includeComments: boolean;
}

export class ZplExporter {
  /**
   * Converts mm to printer dots based on DPI
   */
  static mmToDots(mm: number, dpi: 203 | 300 | 600): number {
    const dotsPerMm = dpi === 203 ? 8 : dpi === 300 ? 11.811 : 23.622;
    return Math.round(mm * dotsPerMm);
  }

  /**
   * Generates a single ZPL string for a specific product and template
   */
  static generateLabelZpl(
    template: LabelTemplate,
    record: ProductRecord,
    config: ZplConfig = { dpi: 203, quantity: 1, printSpeed: 4, darkness: 15, includeComments: true }
  ): string {
    const lines: string[] = [];
    const { dpi, quantity, darkness, includeComments } = config;

    const labelWidthDots = ZplExporter.mmToDots(template.width_mm, dpi);
    const labelHeightDots = ZplExporter.mmToDots(template.height_mm, dpi);

    lines.push('^XA');
    if (includeComments) {
      lines.push(`^FX --- E-STUDIO GENERATED ZPL II ---`);
      lines.push(`^FX Template: ${template.name} (${template.width_mm}x${template.height_mm} mm)`);
      lines.push(`^FX Article: ${record.ITEMNAME}`);
    }

    // Label dimensions and darkness
    lines.push(`^PW${labelWidthDots}`);
    lines.push(`^LL${labelHeightDots}`);
    lines.push(`~SD${darkness}`);
    lines.push(`^LH0,0`);

    // Render elements
    for (const item of template.items) {
      if (!PricingEngine.shouldDisplayItem(item, record)) continue;

      const x = ZplExporter.mmToDots(item.x_mm, dpi);
      const y = ZplExporter.mmToDots(item.y_mm, dpi);
      const w = ZplExporter.mmToDots(item.w_mm, dpi);
      const h = ZplExporter.mmToDots(item.h_mm, dpi);

      switch (item.type) {
        case 'text': {
          const rawText = PricingEngine.resolveCalculatedText(item, record);
          let displayText = `${item.prefix_text || ''}${rawText}${item.suffix_text || ''}`;
          if (item.is_price && item.currency_symbol) {
            displayText = item.currency_position === 'before' 
              ? `${item.currency_symbol} ${displayText}` 
              : `${displayText} ${item.currency_symbol}`;
          }

          // Font height based on pt
          const fontHeightDots = Math.max(12, Math.round(item.font_size_pt * (dpi / 72) * 0.8));
          const fontWidthDots = Math.round(fontHeightDots * 0.65);

          // If background fill exists, draw rectangle first
          if (item.fill_color && item.fill_color !== 'transparent') {
            lines.push(`^FO${x},${y}^GB${w},${h},${h},B,0^FS`);
            // White text on black box
            lines.push(`^FO${x + 4},${y + 4}^A0N,${fontHeightDots},${fontWidthDots}^FR^FD${displayText}^FS`);
          } else {
            lines.push(`^FO${x},${y}^A0N,${fontHeightDots},${fontWidthDots}^FD${displayText}^FS`);
          }
          break;
        }

        case 'barcode': {
          const rawCode = PricingEngine.resolveBarcodeValue(item, record);
          const cleanCode = (rawCode || '1234567890128').replace(/\D/g, '');
          const barcodeH = Math.max(20, h - (item.show_text ? 20 : 0));

          if (item.barcode_type === 'ean13') {
            lines.push(`^FO${x},${y}^BEN,${barcodeH},${item.show_text ? 'Y' : 'N'},N^FD${cleanCode.slice(0, 13)}^FS`);
          } else {
            // Code 128
            lines.push(`^FO${x},${y}^BY2,3,${barcodeH}^BCN,${barcodeH},${item.show_text ? 'Y' : 'N'},N,N^FD>:${rawCode}^FS`);
          }
          break;
        }

        case 'qrcode': {
          const qrData = PricingEngine.resolveQrContent(item, record);
          const mag = Math.max(2, Math.min(10, Math.round(w / 35)));
          lines.push(`^FO${x},${y}^BQN,2,${mag}^FDLA,${qrData}^FS`);
          break;
        }

        case 'shape': {
          const borderThick = Math.max(1, ZplExporter.mmToDots(item.border_width || 1, dpi));
          const radiusDots = Math.round(ZplExporter.mmToDots(item.corner_radius || 0, dpi) / 2);
          const isFilled = item.fill_color && item.fill_color !== '#FFFFFF' && item.fill_color !== 'transparent';
          lines.push(`^FO${x},${y}^GB${w},${h},${isFilled ? h : borderThick},B,${Math.min(8, radiusDots)}^FS`);
          break;
        }

        case 'line': {
          const thick = Math.max(1, ZplExporter.mmToDots(item.thickness || 1, dpi));
          lines.push(`^FO${x},${y}^GB${w},${thick},${thick},B,0^FS`);
          break;
        }

        default:
          break;
      }
    }

    lines.push(`^PQ${quantity},0,1,Y`);
    lines.push('^XZ');

    return lines.join('\n');
  }

  /**
   * Generates a batch ZPL file for all records in the queue
   */
  static generateBatchZpl(
    template: LabelTemplate,
    products: ProductRecord[],
    config: ZplConfig = { dpi: 203, quantity: 1, printSpeed: 4, darkness: 15, includeComments: true }
  ): string {
    return products.map((p) => ZplExporter.generateLabelZpl(template, p, config)).join('\n\n');
  }

  /**
   * Triggers download of the generated .zpl file
   */
  static downloadZplFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.zpl') ? filename : `${filename}.zpl`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
