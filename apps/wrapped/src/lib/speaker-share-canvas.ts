/**
 * Canvas rendering utilities for Abgeordnete (speaker) Wrapped sharepic.
 */

import { getPartyTone } from './party-colors';
import {
  SIZE, MARGIN, drawField, drawBrandHeader, setFont, wrapLines, pill, preloadShareAssets,
  _resetLogoForTesting, _setLogoForTesting,
} from './share-kit';

// Re-exported so callers and tests keep one import site.
export { _resetLogoForTesting, _setLogoForTesting };

export interface SpeakerShareData {
  name: string;
  party: string;
  spiritAnimal: {
    emoji: string;
    name: string;
    title: string;
    reason: string;
  } | null;
  editionTitle?: string;
  editionId?: string;
  signatureWord: {
    word: string;
    count: number;
    ratio: number; // Usage ratio vs Bundestag average
  } | null;
}

// German articles for spirit animals (der/die/das)
const ANIMAL_ARTICLES: Record<string, string> = {
  // Masculine (der)
  'Elefant': 'der',
  'Adler': 'der',
  'Löwe': 'der',
  'Pfau': 'der',
  'Wolf': 'der',
  'Bär': 'der',
  'Papagei': 'der',
  'Kolibri': 'der',
  'Delfin': 'der',
  'Schwan': 'der',
  'Fuchs': 'der',
  'Igel': 'der',
  'Biber': 'der',
  'Hase': 'der',
  'Otter': 'der',
  'Tiger': 'der',
  // Feminine (die)
  'Eule': 'die',
  'Schildkröte': 'die',
  'Biene': 'die',
  'Krabbe': 'die',
  // Neuter (das)
  'Pferd': 'das',
  'Eichhörnchen': 'das',
};

function getAnimalArticle(animalName: string): string {
  return ANIMAL_ARTICLES[animalName] || 'der';
}

/** Logo and fonts: canvas drawing needs both loaded before the first render. */
export const preloadLogo = preloadShareAssets;

export function getResponsiveFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number
): number {
  let fontSize = startSize;
  while (fontSize > minSize) {
    setFont(ctx, 'heading', fontSize);
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 4;
  }
  return fontSize;
}

export function renderSpeakerShareImage(
  canvas: HTMLCanvasElement,
  data: SpeakerShareData
): void {
  const { name, party, spiritAnimal, signatureWord } = data;

  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Ink field, deep circle and pink square at the edges.
  const p = drawField(ctx, 'ink', 'orbit');
  drawBrandHeader(ctx, p, data.editionTitle ?? 'Bundestag Wrapped');

  const maxWidth = SIZE - MARGIN * 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  /** Two-colour uppercase line: runs keep their own case in the data, the image shows them as capitals. */
  const drawRuns = (runs: [string, string][], y: number, size: number) => {
    setFont(ctx, 'heading', size);
    let x = MARGIN;
    for (const [text, color] of runs) {
      ctx.fillStyle = color;
      ctx.fillText(text.toUpperCase(), x, y);
      x += ctx.measureText(text.toUpperCase()).width;
    }
  };
  const drawSmall = (text: string, y: number, lineHeight = 40): number => {
    setFont(ctx, 'text', 32, 600);
    ctx.fillStyle = p.muted;
    for (const line of wrapText(text, maxWidth)) {
      ctx.fillText(line, MARGIN, y);
      y += lineHeight;
    }
    return y;
  };
  const wrapText = (text: string, width: number) => wrapLines(ctx, text, width);

  // One font size for the animal and the signature sentences.
  let mainFontSize = 64;
  const animal = spiritAnimal;
  const article = animal ? getAnimalArticle(animal.name) : '';
  if (animal) {
    const line1Size = getResponsiveFontSize(ctx, `${name}, dein Spirit Animal`.toUpperCase(), maxWidth, 64, 36);
    const line2Size = getResponsiveFontSize(ctx, `ist ${article} ${animal.name}.`.toUpperCase(), maxWidth, 64, 36);
    mainFontSize = Math.min(line1Size, line2Size);
  }

  let y = 200;
  let signatureY: number;

  if (animal) {
    drawRuns([[`${name}, dein `, p.on], ['Spirit Animal', p.accent]], y + mainFontSize * 0.8, mainFontSize);
    y += mainFontSize + 8;
    drawRuns([[`ist ${article} `, p.on], [`${animal.name}.`, p.accent]], y + mainFontSize * 0.8, mainFontSize);
    y += mainFontSize + 20;
    y = drawSmall(`${animal.title}: ${animal.reason}`, y + 28);

    // Emoji on a white disc, party pill beside it.
    const discY = Math.max(y + 110, 540);
    ctx.beginPath();
    ctx.arc(SIZE - 250, discY, 135, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    setFont(ctx, 'text', 170, 400);
    ctx.textAlign = 'center';
    ctx.fillStyle = p.bg;
    ctx.fillText(animal.emoji, SIZE - 250, discY + 58);
    ctx.textAlign = 'left';
    pill(ctx, party, MARGIN, discY - 30, getPartyTone(party, 'light'), '#ffffff', 28);
    signatureY = discY + 175;
  } else {
    // No animal: the name is the heading.
    const upper = name.toUpperCase();
    const size = getResponsiveFontSize(ctx, upper, maxWidth, 110, 48);
    setFont(ctx, 'heading', size);
    ctx.fillStyle = p.accent;
    ctx.fillText(upper, MARGIN, y + size * 0.8);
    pill(ctx, party, MARGIN, y + size + 24, getPartyTone(party, 'light'), '#ffffff', 28);
    signatureY = 480;
  }

  if (signatureWord) {
    const word = signatureWord.word;
    const prefix = 'Dein Signaturwort ist ';
    setFont(ctx, 'heading', mainFontSize);
    const prefixWidth = ctx.measureText(prefix.toUpperCase()).width;
    const wordWidth = ctx.measureText(`${word}.`.toUpperCase()).width;
    let statsY: number;
    if (prefixWidth + wordWidth <= maxWidth) {
      drawRuns([[prefix, p.on], [`${word}.`, p.accent]], signatureY + mainFontSize * 0.8, mainFontSize);
      statsY = signatureY + mainFontSize + 40;
    } else {
      drawRuns([[prefix.trimEnd(), p.on]], signatureY + mainFontSize * 0.8, mainFontSize);
      drawRuns([[`${word}.`, p.accent]], signatureY + mainFontSize * 1.8 + 8, mainFontSize);
      statsY = signatureY + mainFontSize * 2 + 48;
    }
    drawSmall(`${signatureWord.count}× gesagt`, statsY);
  }

  // Footer CTA: question, then the answer with the URL as accent.
  setFont(ctx, 'text', 26, 600);
  ctx.fillStyle = p.on;
  ctx.fillText('Du willst auch dein Spirit Animal und Signaturwort kennen?', MARGIN, SIZE - 98);
  const answerWhite = 'Finde dein eigenes Wrapped auf ';
  setFont(ctx, 'text', 26, 800);
  ctx.fillText(answerWhite, MARGIN, SIZE - 58);
  const answerWidth = ctx.measureText(answerWhite).width;
  ctx.fillStyle = p.accent;
  ctx.fillText('bundestag-wrapped.de', MARGIN + answerWidth, SIZE - 58);
}

export function downloadSpeakerShareImage(
  canvas: HTMLCanvasElement,
  speakerName: string,
  editionId = 'edition',
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = speakerShareFilename(speakerName, editionId);
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export function speakerShareFilename(speakerName: string, editionId = 'edition'): string {
  const slug = speakerName
    .replace(/[Ää]/g, 'ae')
    .replace(/[Öö]/g, 'oe')
    .replace(/[Üü]/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'speaker';
  return `bundestag-wrapped-${editionId}-${slug}.png`;
}

export async function shareSpeakerImage(
  canvas: HTMLCanvasElement,
  speakerName: string,
  editionTitle = 'Bundestag Wrapped',
  editionId = 'edition',
  url?: string,
): Promise<boolean> {
  if (!navigator.share) return false;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      try {
        const file = new File(
          [blob],
          speakerShareFilename(speakerName, editionId),
          { type: 'image/png' }
        );
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${speakerName} – ${editionTitle}`,
            url,
          });
        } else {
          await navigator.share({
            title: `${speakerName} – ${editionTitle}`,
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
