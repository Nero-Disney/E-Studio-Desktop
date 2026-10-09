import pptxgen from 'pptxgenjs';
import { LabelTemplate, ProductRecord, ImpositionConfig, ImpositionCalculation } from '../types';
import { TierEngine } from './tierEngine';
import { PricingEngine } from './pricingEngine';
import { renderBarcodeToDataUrl } from './barcodeGenerator';
import { renderQrToDataUrl } from './qrGenerator';

/**
 * Converts mm to inches for pptxgenjs layout
 */
const mmToIn = (mm: number) => mm / 25.4;

export class PptxExporter {
  /**
   * Generates a PowerPoint (.pptx) file with one slide per print sheet page,
   * rendering full vector shapes, labels, text blocks, and barcodes.
   */
  static async exportToPptx(
    template: LabelTemplate,
    products: ProductRecord[],
    imposition: ImpositionCalculation,
    impositionConfig: ImpositionConfig
  ) {
    const pptx = new pptxgen();

    // Configure Slide Dimensions matching the paper page
    const pageWidthIn = mmToIn(imposition.page_w_mm);
    const pageHeightIn = mmToIn(imposition.page_h_mm);

    pptx.defineLayout({
      name: 'CUSTOM_SHEET',
      width: pageWidthIn,
      height: pageHeightIn,
    });
    pptx.layout = 'CUSTOM_SHEET';

    const labelsPerPage = imposition.total_per_page;
    const totalPages = Math.ceil(products.length / labelsPerPage);

    for (let page = 0; page < totalPages; page++) {
      const slide = pptx.addSlide();
      slide.background = { color: 'FFFFFF' };

      for (let slot = 0; slot < labelsPerPage; slot++) {
        const prodIndex = page * labelsPerPage + slot;
        if (prodIndex >= products.length) break;
        const prod = products[prodIndex];

        const col = slot % imposition.cols;
        const row = Math.floor(slot / imposition.cols);

        // Calculate label origin in mm on sheet
        const labelX_mm =
          imposition.horizontal_offset_mm + col * (imposition.label_total_w_mm + impositionConfig.gap_mm);
        const labelY_mm =
          imposition.vertical_offset_mm + row * (imposition.label_total_h_mm + impositionConfig.gap_mm);

        const labelX_in = mmToIn(labelX_mm);
        const labelY_in = mmToIn(labelY_mm);
        const labelW_in = mmToIn(template.width_mm);
        const labelH_in = mmToIn(template.height_mm);

        // Draw Label Background / Outline
        slide.addShape(pptx.ShapeType.rect, {
          x: labelX_in,
          y: labelY_in,
          w: labelW_in,
          h: labelH_in,
          fill: { color: (template.bg_color || '#FFFFFF').replace('#', '') },
          line: { color: 'CCCCCC', width: 0.5, dashType: 'dash' },
        });

        // Add each template item to the slide
        for (const item of template.items) {
          const itemX_in = labelX_in + mmToIn(item.x_mm);
          const itemY_in = labelY_in + mmToIn(item.y_mm);
          const itemW_in = mmToIn(item.w_mm);
          const itemH_in = mmToIn(item.h_mm);

          switch (item.type) {
            case 'text': {
              let textVal = item.text || '';
              if (item.binding_key && prod[item.binding_key] !== undefined) {
                const raw = prod[item.binding_key];
                textVal = typeof raw === 'number' ? raw.toLocaleString('fr-FR') : String(raw);
              }
              if (item.prefix_text) textVal = `${item.prefix_text} ${textVal}`;
              if (item.suffix_text) textVal = `${textVal} ${item.suffix_text}`;

              if (item.text_transform === 'uppercase') textVal = textVal.toUpperCase();
              else if (item.text_transform === 'lowercase') textVal = textVal.toLowerCase();

              slide.addText(textVal, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fontSize: Math.max(6, item.font_size_pt),
                fontFace: item.font_family || 'Calibri',
                bold: item.font_weight === 'bold' || item.font_weight === '800',
                italic: item.font_style === 'italic',
                underline: item.text_decoration === 'underline' ? { style: 'sng' } : undefined,
                strike: item.text_decoration === 'line-through',
                color: (item.text_color || '#000000').replace('#', ''),
                align: (item.alignment === 'justify' ? 'left' : item.alignment) || 'left',
                valign: item.valign || 'top',
                fill: item.fill_color ? { color: item.fill_color.replace('#', '') } : undefined,
                line:
                  item.border_width && item.border_width > 0
                    ? { color: (item.border_color || '#000000').replace('#', ''), width: item.border_width }
                    : undefined,
                wrap: item.wrap,
                charSpacing: item.letter_spacing_pt ? item.letter_spacing_pt * 20 : undefined,
              });
              break;
            }

            case 'shape': {
              slide.addShape(
                item.corner_radius && item.corner_radius > 0
                  ? pptx.ShapeType.roundRect
                  : pptx.ShapeType.rect,
                {
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                  fill: item.fill_color ? { color: item.fill_color.replace('#', '') } : undefined,
                  line: {
                    color: (item.border_color || '#000000').replace('#', ''),
                    width: item.border_width || 1,
                  },
                }
              );
              break;
            }

            case 'ellipse': {
              slide.addShape(pptx.ShapeType.ellipse, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fill: item.fill_color ? { color: item.fill_color.replace('#', '') } : undefined,
                line: {
                  color: (item.border_color || '#000000').replace('#', ''),
                  width: item.border_width || 1,
                },
              });
              break;
            }

            case 'line': {
              slide.addShape(pptx.ShapeType.line, {
                x: itemX_in,
                y: itemY_in + itemH_in / 2,
                w: itemW_in,
                h: 0,
                line: {
                  color: (item.color || '#000000').replace('#', ''),
                  width: item.thickness || 1,
                  dashType: item.style === 'dashed' ? 'dash' : item.style === 'dotted' ? 'sysDot' : 'solid',
                },
              });
              break;
            }

            case 'barcode': {
              const code = PricingEngine.resolveBarcodeValue(item, prod);
              const imgData = renderBarcodeToDataUrl(
                code,
                item.barcode_type || 'ean13',
                Boolean(item.show_text),
                item.bar_color || '#000000'
              );

              if (imgData) {
                slide.addImage({
                  data: imgData,
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                });
              } else {
                slide.addShape(pptx.ShapeType.rect, {
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                  fill: { color: 'F8FAFC' },
                  line: { color: 'CBD5E1', width: 0.5 },
                });
                slide.addText(code, {
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                  fontSize: 8,
                  fontFace: 'Consolas',
                  align: 'center',
                  valign: 'middle',
                });
              }
              break;
            }

            case 'qrcode': {
              const qrContent = PricingEngine.resolveQrContent(item, prod);
              const imgData = renderQrToDataUrl(
                qrContent,
                item.module_color || '#000000',
                item.background_color || '#FFFFFF'
              );

              if (imgData) {
                slide.addImage({
                  data: imgData,
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                });
              } else {
                slide.addShape(pptx.ShapeType.rect, {
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                  fill: { color: (item.background_color || '#FFFFFF').replace('#', '') },
                  line: { color: '000000', width: 0.5 },
                });
                slide.addText(qrContent, {
                  x: itemX_in,
                  y: itemY_in,
                  w: itemW_in,
                  h: itemH_in,
                  fontSize: 7,
                  align: 'center',
                  valign: 'middle',
                });
              }
              break;
            }

            case 'tier_price': {
              let tierText = `[${item.prefix_text}] Palier #${item.primary_tier} (${item.unit_label})`;
              const resolved = TierEngine.resolve(
                {
                  primary_index: Math.max(0, item.primary_tier - 1),
                  keyword_prefix: item.prefix_text,
                  unit_label: item.unit_label,
                  strict_required: item.strict_required,
                  fallback_to_base_price: item.fallback_to_base_price ?? true,
                  pricing_strategy: item.pricing_strategy,
                  cross_conditional: item.cross_conditional,
                },
                prod
              );

              if (resolved) {
                if (resolved.error) {
                  tierText = resolved.text_qty;
                } else {
                  tierText = `${resolved.text_qty} : ${resolved.formatted_price}${resolved.is_fallback ? ' (base)' : ''}`;
                }
              }

              // Apply custom typography parameters
              const fontSize = item.font_size_pt || 9;
              const fontFace = item.font_family || 'Calibri';
              const bold = item.font_weight === 'bold' || item.font_weight === '600' || item.font_weight === '800';
              const italic = item.font_style === 'italic';
              const underline = item.text_decoration === 'underline' || item.text_decoration === 'underline line-through'
                ? { style: 'sng' as const }
                : undefined;
              const color = (item.text_color || '#0369A1').replace('#', '');
              const align = item.alignment || 'left';
              const valign = item.valign === 'middle' ? 'middle' : item.valign === 'bottom' ? 'bottom' : 'top';

              slide.addText(tierText, {
                x: itemX_in,
                y: itemY_in,
                w: itemW_in,
                h: itemH_in,
                fontSize: fontSize,
                fontFace: fontFace,
                bold: bold,
                italic: italic,
                underline: underline,
                color: color,
                align: align as any,
                valign: valign as any,
              });
              break;
            }
          }
        }
      }
    }

    const safeName = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    await pptx.writeFile({ fileName: `etiquettes_${safeName}.pptx` });
  }
}
