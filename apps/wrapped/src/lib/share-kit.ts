/**
 * Canvas kit for share images: flat ink/pink/violet fields, geometric shapes,
 * huge uppercase Noto Sans headings and wide Archivo numbers. Uses only basic
 * 2D calls (no rotate/translate) so it also runs against minimal test contexts.
 */
import { BRAND_COLORS } from './design-tokens';

export const SIZE = 1080;
export const MARGIN = 70;

export type FieldTone = 'ink' | 'pink' | 'violet';

export interface Palette {
  bg: string;
  on: string;
  muted: string;
  /** Accent for large text on this field. */
  accent: string;
  contrast: string;
  onContrast: string;
  shapeA: string;
  shapeB: string;
}

export const PALETTES: Record<FieldTone, Palette> = {
  ink: { bg: BRAND_COLORS.ink, on: '#ffffff', muted: '#cfccd3', accent: BRAND_COLORS.pink, contrast: '#ffffff', onContrast: BRAND_COLORS.ink, shapeA: BRAND_COLORS.deep, shapeB: BRAND_COLORS.pink },
  pink: { bg: BRAND_COLORS.pink, on: BRAND_COLORS.ink, muted: '#301427', accent: BRAND_COLORS.deep, contrast: BRAND_COLORS.ink, onContrast: '#ffffff', shapeA: BRAND_COLORS.violet, shapeB: BRAND_COLORS.ink },
  violet: { bg: BRAND_COLORS.violet, on: '#ffffff', muted: '#f4f0fe', accent: BRAND_COLORS.ink, contrast: BRAND_COLORS.ink, onContrast: '#ffffff', shapeA: BRAND_COLORS.ink, shapeB: BRAND_COLORS.pink },
};

/* ─── Fonts ─────────────────────────────────────────────────────────── */

const HEADING = '"Noto Sans", Roboto, "Segoe UI", sans-serif';
const WIDE = 'Archivo, "Noto Sans", "Segoe UI", sans-serif';
export type FontKind = 'heading' | 'wide' | 'text';

let fontsPromise: Promise<void> | null = null;

/** Canvas never triggers font loading itself: load explicitly, fall back to system fonts on failure. */
export function loadShareFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve();
  if (fontsPromise) return fontsPromise;
  const sample = 'AÄÖÜäöüß0123456789×%';
  const requests = ['900 125% 80px Archivo', '900 expanded 80px Archivo', '900 80px Archivo', '900 80px "Noto Sans"', '600 30px "Noto Sans"'];
  fontsPromise = Promise.all(requests.map(font => document.fonts.load(font, sample).catch(() => []))).then(() => undefined, () => undefined);
  return fontsPromise;
}

/** Sets font and, for the wide face, the expanded width (set after `font`, which resets it). */
export function setFont(ctx: CanvasRenderingContext2D, kind: FontKind, size: number, weight = 900): void {
  ctx.font = `${weight} ${size}px ${kind === 'wide' ? WIDE : HEADING}`;
  if ('fontStretch' in ctx) (ctx as CanvasRenderingContext2D & { fontStretch: string }).fontStretch = kind === 'wide' ? 'expanded' : 'normal';
}

/** Largest size in [min,start] (step 4) at which `text` fits `maxWidth`. */
export function fitSize(ctx: CanvasRenderingContext2D, kind: FontKind, text: string, maxWidth: number, start: number, min: number, weight = 900): number {
  let size = start;
  while (size > min) {
    setFont(ctx, kind, size, weight);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 4;
  }
  return size;
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

/* ─── Logo ──────────────────────────────────────────────────────────── */

let logoImage: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

function loadLogo(): Promise<HTMLImageElement> {
  if (logoImage) return Promise.resolve(logoImage);
  if (logoLoadPromise) return logoLoadPromise;
  logoLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { logoImage = img; resolve(img); };
    img.onerror = reject;
    img.src = '/logo.png';
  });
  return logoLoadPromise;
}

/** Everything a share image needs before drawing: logo and fonts. */
export function preloadShareAssets(): Promise<HTMLImageElement> {
  return Promise.all([loadLogo(), loadShareFonts()]).then(([img]) => img);
}

export function _resetLogoForTesting(): void { logoImage = null; logoLoadPromise = null; }
export function _setLogoForTesting(img: HTMLImageElement | null): void { logoImage = img; }

if (typeof window !== 'undefined') preloadShareAssets().catch(() => undefined);

/* ─── Shapes ────────────────────────────────────────────────────────── */

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, r);
  else { ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); }
}

/** Filled rectangle rotated by `deg` around its centre, drawn as a polygon. */
export function tiltedRect(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, deg: number, color: string): void {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a), sin = Math.sin(a);
  const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  ctx.beginPath();
  corners.forEach(([x, y], i) => {
    const px = cx + x * cos - y * sin, py = cy + x * sin + y * cos;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.fillStyle = color;
  ctx.fill();
}

function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export type ShapeSet = 'corner' | 'orbit';

/** Flat field plus two or three geometric shapes pushed to the edges. */
export function drawField(ctx: CanvasRenderingContext2D, tone: FieldTone, shapes: ShapeSet = 'corner'): Palette {
  const p = PALETTES[tone];
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, SIZE, SIZE);
  if (shapes === 'corner') {
    disc(ctx, SIZE * 0.98, SIZE * 0.02, 330, p.shapeA);
    tiltedRect(ctx, SIZE - 70, SIZE - 60, 190, 190, 18, p.shapeB);
  } else {
    disc(ctx, 40, 40, 300, p.shapeA);
    tiltedRect(ctx, SIZE - 20, SIZE - 20, 190, 190, 18, p.shapeB);
  }
  return p;
}

/* ─── Text pieces ───────────────────────────────────────────────────── */

export function pill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string, size = 26, kind: FontKind = 'wide'): number {
  setFont(ctx, kind, size, 800);
  const w = ctx.measureText(text).width + size * 1.6;
  const h = size * 1.9;
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = fg;
  ctx.fillText(text, x + size * 0.8, y + h / 2 + size * 0.35);
  return w;
}

/** Header: logo on a white plate plus the edition title as a contrast pill. */
export function drawBrandHeader(ctx: CanvasRenderingContext2D, p: Palette, editionTitle: string): void {
  const y = 50, h = 64, logoW = 78;
  roundedRect(ctx, MARGIN, y, logoW + 28, h, h / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (logoImage) {
    const logoH = (logoImage.height / logoImage.width) * logoW;
    ctx.drawImage(logoImage, MARGIN + 14, y + (h - logoH) / 2, logoW, logoH);
  }
  pill(ctx, editionTitle.toUpperCase(), MARGIN + logoW + 28 + 14, y + 2, p.contrast, p.onContrast, 24);
}

/** Footer: label in the field's text colour and the URL on a contrast pill. */
export function drawFooterUrl(ctx: CanvasRenderingContext2D, p: Palette, label = 'Teste dein Wissen auf'): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  setFont(ctx, 'text', 26, 600);
  ctx.fillStyle = p.on;
  ctx.fillText(label, MARGIN, SIZE - 100);
  pill(ctx, 'bundestag-wrapped.de', MARGIN, SIZE - 82, p.contrast, p.onContrast, 28);
}

/** Left-aligned huge uppercase heading, fitted to the content width. Returns the next y. */
export function drawHeading(ctx: CanvasRenderingContext2D, text: string, y: number, color: string, start = 120, min = 56): number {
  const upper = text.toUpperCase();
  const size = fitSize(ctx, 'heading', upper, SIZE - MARGIN * 2, start, min);
  setFont(ctx, 'heading', size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(upper, MARGIN, y + size * 0.8);
  return y + size;
}

export function drawSubtitle(ctx: CanvasRenderingContext2D, text: string, y: number, color: string, size = 32): number {
  setFont(ctx, 'text', size, 600);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(text, MARGIN, y + size);
  return y + size * 1.4;
}
