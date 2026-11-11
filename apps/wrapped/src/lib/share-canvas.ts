import {
  SIZE, MARGIN, drawField, drawBrandHeader, drawFooterUrl, drawHeading, fitSize, setFont, wrapLines, roundedRect, preloadShareAssets,
} from './share-kit';
import { resultTitle } from './result-title';

export interface ShareImageData {
  correctCount: number;
  totalQuestions: number;
  userName?: string;
  editionTitle?: string;
  editionId?: string;
}

export type ShareCanvasVariant = 'score' | 'title';

/** Logo and fonts: canvas drawing needs both loaded before the first render. */
export const preloadLogo = preloadShareAssets;

export function renderShareImage(
  canvas: HTMLCanvasElement,
  data: ShareImageData,
  variant: ShareCanvasVariant = 'score'
): void {
  const { correctCount, totalQuestions, userName } = data;
  const result = resultTitle(correctCount, totalQuestions) ?? { title: '', line: '' };
  const name = userName?.trim();

  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Pink share field: ink text, ink circle and violet square at the edges.
  const p = drawField(ctx, 'pink', 'corner');
  drawBrandHeader(ctx, p, data.editionTitle ?? 'Bundestag Wrapped');

  // "Das Ergebnis von {Name}", then "{n} von {total} richtig". The score variant
  // puts the numbers on a big white plate; the title variant sets the result
  // title itself as the hero, over up to three lines.
  let y = 190;
  if (name) y = drawHeading(ctx, `Das Ergebnis von ${name}`, y, p.on, 44, 28) + 6;
  y = drawHeading(ctx, `${correctCount} von ${totalQuestions} richtig`, y, p.on, 64, 40) + 6;

  let lineY: number;
  if (variant === 'title') {
    const words = result.title.toUpperCase();
    let size = 150;
    let lines: string[] = [];
    const width = SIZE - MARGIN * 2;
    for (; size > 56; size -= 6) {
      setFont(ctx, 'wide', size);
      lines = wrapLines(ctx, words, width);
      if (lines.length <= 3 && lines.every(line => ctx.measureText(line).width <= width)) break;
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = p.on;
    y += 40;
    lines.forEach((line, i) => ctx.fillText(line, MARGIN, y + size * 0.82 + i * size * 0.98));
    lineY = y + lines.length * size * 0.98 + 40;
  } else {
    y = drawHeading(ctx, result.title, y, p.on, 64, 40);
    // Score on a white plate: huge wide numerals.
    const score = `${correctCount}/${totalQuestions}`;
    const scoreSize = fitSize(ctx, 'wide', score, SIZE - MARGIN * 2 - 80, 220, 100);
    const plateY = Math.max(y + 30, 470);
    const plateH = scoreSize + 70;
    roundedRect(ctx, MARGIN, plateY, SIZE - MARGIN * 2, plateH, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    setFont(ctx, 'wide', scoreSize);
    ctx.textAlign = 'center';
    ctx.fillStyle = p.on;
    ctx.fillText(score, SIZE / 2, plateY + 35 + scoreSize * 0.78);
    lineY = plateY + plateH + 30;
  }

  // Tagline
  setFont(ctx, 'heading', 38, 800);
  ctx.fillStyle = p.on;
  ctx.textAlign = 'left';
  wrapLines(ctx, result.line, SIZE - MARGIN * 2).slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, MARGIN, lineY + 36 + i * 48);
  });

  drawFooterUrl(ctx, p, 'Und wie gut kennst du den Bundestag? Spiel mit:');
}

function shareFilename(editionId = 'edition', userName?: string): string {
  const suffix = userName?.trim()
    ? `-${userName.trim().toLowerCase().replace(/\s+/g, '-')}`
    : '';
  return `bundestag-wrapped-${editionId}${suffix}.png`;
}

export function downloadShareImage(canvas: HTMLCanvasElement, userName?: string, editionId?: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = shareFilename(editionId, userName);
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Share image using Web Share API
 */
export async function shareImage(canvas: HTMLCanvasElement, editionTitle = 'Bundestag Wrapped', editionId?: string, url?: string): Promise<boolean> {
  // Check if Web Share API is available
  if (!navigator.share) {
    return false;
  }

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      try {
        const file = new File([blob], shareFilename(editionId), { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Mein ${editionTitle}`,
            url,
          });
        } else {
          await navigator.share({
            title: `Mein ${editionTitle}`,
            url,
          });
        }
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}
