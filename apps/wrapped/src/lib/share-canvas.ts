import {
  SIZE, MARGIN, drawField, drawBrandHeader, drawFooterUrl, drawHeading, fitSize, setFont, wrapLines, roundedRect, preloadShareAssets,
} from './share-kit';

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

function getResultMessage(correctCount: number, totalQuestions: number): { title: string; tagline: string } {
  // Normalize to 0-10 scale
  const score = Math.round((correctCount / totalQuestions) * 10);

  switch (score) {
    case 10: return {
      title: 'Legende!',
      tagline: 'Perfekt! Du könntest im Bundestag hospitieren.'
    };
    case 9: return {
      title: 'Legende!',
      tagline: 'Deine Eltern wären so stolz auf dich.'
    };
    case 8: return {
      title: 'Legende!',
      tagline: 'Fast makellos – da wackelt der Kanzlerstuhl.'
    };
    case 7: return {
      title: 'Demokratie-Star!',
      tagline: 'Mit dir würden wir in eine Koalition gehen.'
    };
    case 6: return {
      title: 'Demokratie-Star!',
      tagline: 'Solide! Die Fraktion wäre beeindruckt.'
    };
    case 5: return {
      title: 'Politik-Talent!',
      tagline: 'Die Hälfte ist geschafft, weiter so!'
    };
    case 4: return {
      title: 'Politik-Talent!',
      tagline: 'Du bist auf einem guten Weg, bleib dran!'
    };
    case 3: return {
      title: 'Rising Star!',
      tagline: 'Rom wurde auch nicht an einem Tag erbaut.'
    };
    case 2: return {
      title: 'Rising Star!',
      tagline: 'Jeder Profi hat mal klein angefangen.'
    };
    case 1: return {
      title: 'Rising Star!',
      tagline: 'Ein Punkt ist besser als kein Punkt!'
    };
    default: return {
      title: 'Rising Star!',
      tagline: "Nächstes Mal wird's besser, versprochen!"
    };
  }
}

export function renderShareImage(
  canvas: HTMLCanvasElement,
  data: ShareImageData,
  variant: ShareCanvasVariant = 'score'
): void {
  const { correctCount, totalQuestions, userName } = data;
  const result = getResultMessage(correctCount, totalQuestions);
  const name = userName?.trim();

  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Pink share field: ink text, ink circle and violet square at the edges.
  const p = drawField(ctx, 'pink', 'corner');
  drawBrandHeader(ctx, p, data.editionTitle ?? 'Bundestag Wrapped');

  // Lead line, then (score variant) the result title as a huge heading.
  const line1 = variant === 'title'
    ? (name ? `${name}, du bist eine:` : 'Du bist eine:')
    : (name ? (name.length <= 14 ? `${name}, du bist` : `${name} ist`) : 'Du bist');
  let y = 190;
  y = drawHeading(ctx, line1, y, p.on, 64, 40) + 6;
  if (variant === 'score') y = drawHeading(ctx, result.title, y, p.on, 150, 70);

  // Score on a white plate: huge wide numerals.
  const score = `${correctCount}/${totalQuestions}`;
  const scoreSize = fitSize(ctx, 'wide', score, SIZE - MARGIN * 2 - 80, variant === 'title' ? 260 : 200, 100);
  const plateY = Math.max(y + 30, variant === 'title' ? 340 : 470);
  const plateH = scoreSize + 70;
  roundedRect(ctx, MARGIN, plateY, SIZE - MARGIN * 2, plateH, 40);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  setFont(ctx, 'wide', scoreSize);
  ctx.textAlign = 'center';
  ctx.fillStyle = p.on;
  ctx.fillText(score, SIZE / 2, plateY + 35 + scoreSize * 0.78);

  // Tagline
  setFont(ctx, 'heading', 38, 800);
  ctx.fillStyle = p.on;
  ctx.textAlign = 'left';
  wrapLines(ctx, result.tagline, SIZE - MARGIN * 2).slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, MARGIN, plateY + plateH + 66 + i * 48);
  });

  drawFooterUrl(ctx, p, 'Wie gut kennst du den Bundestag? Teste dein Wissen auf');
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
