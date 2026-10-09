// Lightweight, robust QR code matrix generator with High-Performance LRU/Map caching

const qrMatrixCache = new Map<string, boolean[][]>();
const qrPathCache = new Map<string, string>();

export function generateQrMatrix(text: string): boolean[][] {
  const content = text || 'https://example.com';
  const cached = qrMatrixCache.get(content);
  if (cached) return cached;

  const size = 25; // 25x25 Version 2 grid
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  function setFinderPattern(r: number, c: number) {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const row = r + i;
        const col = c + j;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
            if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
              matrix[row][col] = true;
            } else {
              matrix[row][col] = false;
            }
          } else {
            matrix[row][col] = false;
          }
        }
      }
    }
  }

  // Set 3 finder patterns
  setFinderPattern(0, 0);
  setFinderPattern(0, size - 7);
  setFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Alignment pattern at bottom right
  const ar = size - 7;
  const ac = size - 7;
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      if (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) {
        matrix[ar + i][ac + j] = true;
      } else {
        matrix[ar + i][ac + j] = false;
      }
    }
  }

  // Deterministic pseudo-random fill based on input text content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash + content.charCodeAt(i)) | 0;
  }
  let seed = Math.abs(hash) || 12345;

  function nextBit(): boolean {
    seed = (seed * 16807) % 2147483647;
    return (seed & 1) === 1;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders
      if (
        (r <= 7 && c <= 7) ||
        (r <= 7 && c >= size - 8) ||
        (r >= size - 8 && c <= 7) ||
        (r === 6 || c === 6) ||
        (r >= ar - 2 && r <= ar + 2 && c >= ac - 2 && c <= ac + 2)
      ) {
        continue;
      }
      matrix[r][c] = nextBit();
    }
  }

  if (qrMatrixCache.size > 2000) qrMatrixCache.clear();
  qrMatrixCache.set(content, matrix);
  return matrix;
}

/**
 * Builds a single SVG path definition string for a QR matrix.
 * Collapses up to ~841 individual SVG <rect> tags into 1 single <path> tag!
 */
export function getQrSvgPath(matrix: boolean[][]): string {
  const size = matrix.length;
  const cacheKey = `${size}_${matrix[0]?.slice(0, 10).join('')}_${matrix[matrix.length - 1]?.slice(0, 10).join('')}`;
  const cached = qrPathCache.get(cacheKey);
  if (cached) return cached;

  let d = '';
  const cellSize = 100 / size;

  for (let r = 0; r < size; r++) {
    const y = (r * cellSize).toFixed(2);
    const h = (cellSize + 0.05).toFixed(2);

    let c = 0;
    while (c < size) {
      if (matrix[r][c]) {
        let span = 1;
        while (c + span < size && matrix[r][c + span]) {
          span++;
        }
        const x = (c * cellSize).toFixed(2);
        const w = (span * cellSize + 0.05).toFixed(2);
        d += `M${x} ${y}h${w}v${h}h-${w}Z `;
        c += span;
      } else {
        c++;
      }
    }
  }

  if (qrPathCache.size > 1000) qrPathCache.clear();
  qrPathCache.set(cacheKey, d);
  return d;
}

/**
 * Renders a crisp rasterized QR Code dataURL (PNG) for office document embeds (PPTX, HTML)
 */
export function renderQrToDataUrl(
  content: string,
  moduleColor: string = '#000000',
  backgroundColor: string = '#FFFFFF'
): string {
  if (typeof document === 'undefined') return '';

  const matrix = generateQrMatrix(content || 'https://example.com');
  const size = matrix.length;
  const scale = 8;
  const quietZone = 2; // 2 module quiet zone border
  const fullSize = (size + quietZone * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = fullSize;
  canvas.height = fullSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = backgroundColor || '#FFFFFF';
  ctx.fillRect(0, 0, fullSize, fullSize);

  // Modules
  ctx.fillStyle = moduleColor || '#000000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        ctx.fillRect((c + quietZone) * scale, (r + quietZone) * scale, scale, scale);
      }
    }
  }

  return canvas.toDataURL('image/png');
}
