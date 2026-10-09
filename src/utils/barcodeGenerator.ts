// Vector Code 128 and EAN-13 Barcode generator with High-Performance LRU/Map caching

const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

// Runtime Memoization Caches
const code128Cache = new Map<string, boolean[]>();
const ean13Cache = new Map<string, { bars: boolean[]; formattedCode: string }>();
const svgPathCache = new Map<string, string>();

export function generateCode128Bars(text: string): boolean[] {
  const clean = text || "123456789012";
  const cached = code128Cache.get(clean);
  if (cached) return cached;

  const startCodeB = 104; // Start B
  const codes: number[] = [startCodeB];

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    const codeVal = charCode - 32;
    if (codeVal >= 0 && codeVal <= 95) {
      codes.push(codeVal);
    } else {
      codes.push(0);
    }
  }

  // Calculate checksum
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += codes[i] * i;
  }
  const checksum = sum % 103;
  codes.push(checksum);
  codes.push(106); // Stop code

  // Convert to bar pattern
  const bars: boolean[] = [];
  for (const c of codes) {
    const pattern = CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
    let isBar = true;
    for (let j = 0; j < pattern.length; j++) {
      const width = parseInt(pattern[j], 10);
      for (let w = 0; w < width; w++) {
        bars.push(isBar);
      }
      isBar = !isBar;
    }
  }
  // Terminal bar
  bars.push(true, true);

  if (code128Cache.size > 2000) code128Cache.clear();
  code128Cache.set(clean, bars);
  return bars;
}

// EAN-13 encodings
const EAN_L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011"
];
const EAN_G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111"
];
const EAN_R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100"
];
const EAN_PARITY = [
  "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
  "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
];

export function generateEAN13Bars(code: string): { bars: boolean[]; formattedCode: string } {
  const cached = ean13Cache.get(code);
  if (cached) return cached;

  const digitsOnly = code.replace(/\D/g, "").padStart(12, "0").slice(-12);
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digitsOnly[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const full13 = digitsOnly + checkDigit.toString();

  const firstDigit = parseInt(full13[0], 10);
  const parity = EAN_PARITY[firstDigit];

  const bars: boolean[] = [];
  // Normal quiet zone / start guard: 101
  bars.push(true, false, true);

  // First group of 6 digits (L or G)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(full13[i + 1], 10);
    const useG = parity[i] === 'G';
    const pattern = useG ? EAN_G[digit] : EAN_L[digit];
    for (let b = 0; b < pattern.length; b++) {
      bars.push(pattern[b] === '1');
    }
  }

  // Center guard pattern: 01010
  bars.push(false, true, false, true, false);

  // Second group of 6 digits (always R)
  for (let i = 6; i < 12; i++) {
    const digit = parseInt(full13[i + 1], 10);
    const pattern = EAN_R[digit];
    for (let b = 0; b < pattern.length; b++) {
      bars.push(pattern[b] === '1');
    }
  }

  // End guard: 101
  bars.push(true, false, true);

  const formattedCode = `${full13[0]} ${full13.slice(1, 7)} ${full13.slice(7)}`;
  const result = { bars, formattedCode };

  if (ean13Cache.size > 2000) ean13Cache.clear();
  ean13Cache.set(code, result);
  return result;
}

/**
 * Converts a boolean bar array into a single contiguous SVG path string
 * Drops 100+ separate <rect> nodes down to 1 single <path> node (99% DOM reduction!)
 */
export function getBarcodeSvgPath(bars: boolean[], height: number = 100): string {
  const cacheKey = `${bars.length}_${height}_${bars.slice(0, 10).join('')}`;
  const cached = svgPathCache.get(cacheKey);
  if (cached) return cached;

  let d = '';
  for (let i = 0; i < bars.length; i++) {
    if (bars[i]) {
      let run = 1;
      while (i + 1 < bars.length && bars[i + 1]) {
        run++;
        i++;
      }
      d += `M${i - run + 1} 0h${run}v${height}h-${run}Z `;
    }
  }

  if (svgPathCache.size > 1000) svgPathCache.clear();
  svgPathCache.set(cacheKey, d);
  return d;
}

/**
 * High-performance offscreen canvas renderer for exporting raster images
 */
export function renderBarcodeToDataUrl(
  code: string,
  type: 'code128' | 'ean13',
  showText: boolean = true,
  barColor: string = '#000000',
  scale: number = 2
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  
  let bars: boolean[] = [];
  let textToShow = code;

  try {
    if (type === 'ean13') {
      const res = generateEAN13Bars(code);
      bars = res.bars;
      textToShow = res.formattedCode;
    } else {
      bars = generateCode128Bars(code);
    }
  } catch {
    bars = generateCode128Bars(code);
  }

  const barCount = Math.max(1, bars.length);
  const widthPx = Math.max(240, barCount * 3) * scale;
  const heightPx = (showText ? 90 : 65) * scale;
  
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, widthPx, heightPx);

  const barUnitW = widthPx / barCount;
  const barH = showText ? heightPx * 0.72 : heightPx;

  ctx.fillStyle = barColor || '#000000';
  for (let i = 0; i < barCount; i++) {
    if (bars[i]) {
      ctx.fillRect(i * barUnitW, 0, barUnitW + 0.5, barH);
    }
  }

  if (showText && textToShow) {
    ctx.fillStyle = barColor || '#000000';
    ctx.font = `bold ${Math.round(13 * scale)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textToShow, widthPx / 2, heightPx * 0.86);
  }

  return canvas.toDataURL('image/png');
}
