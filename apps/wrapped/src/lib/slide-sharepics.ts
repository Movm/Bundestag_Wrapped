/**
 * Unified slide sharepic renderers.
 * Renders various Bundestag Wrapped slides as shareable 1080x1080 canvas images.
 */

import { getPartyTone } from './party-colors';
import {
  SIZE, MARGIN, PALETTES, type FieldTone, type Palette, type ShapeSet,
  drawField, drawBrandHeader, drawFooterUrl, drawHeading, drawSubtitle, setFont, fitSize, pill, roundedRect, preloadShareAssets,
} from './share-kit';
import { moinConfig, genderConfig, vocabularyConfig, commonWordsConfig, toneAnalysisConfig, swiftieConfig } from './sharepic-configs';

// ============ TYPES ============

export interface MoinSpeaker {
  name: string;
  party: string;
  count: number;
}

export interface Zwischenrufer {
  name: string;
  party: string;
  count: number;
}

export interface DramaStats {
  topZwischenrufer: Zwischenrufer[];
}

export interface PartyGenderStats {
  party: string;
  femaleRatio: number;
}

export interface GenderAnalysis {
  byParty: PartyGenderStats[];
}

// ============ SHARED ============

/** Logo and fonts: canvas drawing needs both loaded before the first render. */
export const preloadLogo = preloadShareAssets;

interface Setup {
  ctx: CanvasRenderingContext2D;
  p: Palette;
}

/** Sizes the canvas, paints the flat field with shapes and draws the header. */
function setupCanvas(canvas: HTMLCanvasElement, tone: FieldTone, shapes: ShapeSet, editionTitle: string): Setup | null {
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const p = drawField(ctx, tone, shapes);
  drawBrandHeader(ctx, p, editionTitle);
  return { ctx, p };
}

/** Huge uppercase heading plus subtitle. Returns the y below them. */
function drawTitle(ctx: CanvasRenderingContext2D, p: Palette, title: string, subtitle: string, y = 170): number {
  const below = drawHeading(ctx, title, y, p.on, 110, 56);
  return drawSubtitle(ctx, subtitle, below + 12, p.muted) + 14;
}

/** Party colour for fills that carry white text. */
const partyFill = (party: string) => getPartyTone(party, 'light');
const INK = PALETTES.ink.bg;

/** White plate with label / bar / value rows; party colours are measured against light ground. */
function drawBarRows(
  ctx: CanvasRenderingContext2D,
  rows: { label: string; party: string; ratio: number; value: string }[],
  top: number,
  rowH: number,
  gap: number,
): void {
  const plateH = rows.length * rowH + Math.max(0, rows.length - 1) * gap + 70;
  roundedRect(ctx, MARGIN, top, SIZE - MARGIN * 2, plateH, 40);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const labelW = 210, valueW = 170;
  const barX = MARGIN + 35 + labelW;
  const barW = SIZE - MARGIN * 2 - 70 - labelW - valueW;
  ctx.textBaseline = 'alphabetic';
  rows.forEach((row, i) => {
    const y = top + 35 + i * (rowH + gap);
    setFont(ctx, 'wide', 26);
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    ctx.fillText(row.label, MARGIN + 35, y + rowH / 2 + 9);
    roundedRect(ctx, barX, y, barW, rowH, rowH / 2);
    ctx.fillStyle = '#ece8f2';
    ctx.fill();
    roundedRect(ctx, barX, y, Math.max(barW * row.ratio, rowH), rowH, rowH / 2);
    ctx.fillStyle = partyFill(row.party);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.fillStyle = INK;
    ctx.fillText(row.value, SIZE - MARGIN - 35, y + rowH / 2 + 9);
  });
  ctx.textAlign = 'left';
}

// ============ MOIN SLIDE ============

export function renderMoinSharepic(
  canvas: HTMLCanvasElement,
  speakers: MoinSpeaker[],
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'ink', 'orbit', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  let y = drawTitle(ctx, p, moinConfig.title, moinConfig.subtitle);

  // Stair-stepped rank cards: the leader is the biggest, the rest step in.
  const heights = [180, 140, 120, 120];
  speakers.slice(0, 4).forEach((speaker, i) => {
    const h = heights[i];
    const x = MARGIN + i * 34;
    const w = SIZE - MARGIN * 2 - i * 34;
    roundedRect(ctx, x, y, w, h, 36);
    ctx.fillStyle = i === 0 ? p.accent : '#ffffff';
    ctx.fill();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    setFont(ctx, 'wide', h * 0.6);
    ctx.fillText(String(i + 1), x + 34, y + h * 0.74);
    const textX = x + 34 + h * 0.6 + 34;
    const name = speaker.name.toUpperCase();
    const nameSize = fitSize(ctx, 'wide', name, w - (textX - x) - 240, i === 0 ? 40 : 34, 20);
    setFont(ctx, 'wide', nameSize);
    ctx.fillText(name, textX, y + h * 0.42);
    pill(ctx, speaker.party, textX, y + h * 0.52, partyFill(speaker.party), '#ffffff', 22);
    ctx.textAlign = 'right';
    setFont(ctx, 'wide', i === 0 ? 38 : 30);
    ctx.fillStyle = INK;
    ctx.fillText(`${speaker.count}× Moin`, x + w - 30, y + h * 0.52 + 36);
    ctx.textAlign = 'left';
    y += h + 16;
  });

  drawFooterUrl(ctx, p);
}

// ============ DRAMA SLIDE ============

export function renderDramaSharepic(
  canvas: HTMLCanvasElement,
  drama: DramaStats,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'ink', 'corner', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  const leader = drama.topZwischenrufer?.[0];
  if (!leader) return;

  const y = drawTitle(ctx, p, 'Drama im Bundestag', 'Wer ruft am meisten dazwischen?');

  const count = leader.count.toLocaleString('de-DE');
  const size = fitSize(ctx, 'wide', count, SIZE - MARGIN * 2, 300, 120);
  setFont(ctx, 'wide', size);
  ctx.textAlign = 'left';
  ctx.fillStyle = p.accent;
  ctx.fillText(count, MARGIN, y + 20 + size * 0.8);
  const bottom = y + 20 + size;

  setFont(ctx, 'heading', 52);
  ctx.fillStyle = p.on;
  ctx.fillText('ZWISCHENRUFE', MARGIN, bottom + 60);

  const name = leader.name.toUpperCase();
  const nameSize = fitSize(ctx, 'heading', name, SIZE - MARGIN * 2, 60, 32);
  setFont(ctx, 'heading', nameSize);
  ctx.fillText(name, MARGIN, bottom + 60 + nameSize + 30);
  const pillY = bottom + 60 + nameSize + 56;
  const pillW = pill(ctx, leader.party, MARGIN, pillY, partyFill(leader.party), '#ffffff', 26);

  setFont(ctx, 'text', 24, 600);
  ctx.fillStyle = p.muted;
  ctx.fillText(`${leader.party}: ${count} Zwischenrufe`, MARGIN + pillW + 24, pillY + 34);

  drawFooterUrl(ctx, p);
}

// ============ GENDER SLIDE ============

export function renderGenderSharepic(
  canvas: HTMLCanvasElement,
  genderAnalysis: GenderAnalysis,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'pink', 'corner', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  const parties = (genderAnalysis.byParty || [])
    .filter((entry) => entry.party !== 'fraktionslos')
    .sort((a, b) => b.femaleRatio - a.femaleRatio);

  const y = drawTitle(ctx, p, genderConfig.title, genderConfig.subtitle);
  drawBarRows(ctx, parties.map(entry => ({ label: entry.party, party: entry.party, ratio: entry.femaleRatio / 100, value: `${entry.femaleRatio.toFixed(0)} %` })), y, 52, 14);

  drawFooterUrl(ctx, p, 'Mehr dazu auf');
}

// ============ VOCABULARY SLIDE ============

export interface SignatureWord {
  word: string;
  ratio: number;
}

export interface PartyStats {
  party: string;
  signatureWords: SignatureWord[];
}

export interface VocabularyData {
  parties: PartyStats[];
}

export function renderVocabularySharepic(
  canvas: HTMLCanvasElement,
  data: VocabularyData,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'violet', 'corner', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  const parties = data.parties
    .filter(entry => entry.party !== 'fraktionslos' && entry.signatureWords.length > 0)
    .slice(0, 5);

  let y = drawTitle(ctx, p, vocabularyConfig.title, vocabularyConfig.subtitle);

  // One row per party: party pill, then its signature word in huge capitals.
  const rowH = 96;
  parties.forEach((entry) => {
    const word = (entry.signatureWords[0]?.word || '—').toUpperCase();
    const pillW = pill(ctx, entry.party, MARGIN, y + 14, partyFill(entry.party), '#ffffff', 24);
    const size = fitSize(ctx, 'heading', word, SIZE - MARGIN * 2 - pillW - 30, 68, 30);
    setFont(ctx, 'heading', size);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = p.on;
    ctx.fillText(word, MARGIN + pillW + 30, y + 14 + 24 + size * 0.36);
    y += rowH;
  });

  drawFooterUrl(ctx, p);
}

// ============ SPEECHES SLIDE ============

export interface SpeechesParty {
  party: string;
  speeches: number;
  wortbeitraege: number;
}

export interface SpeechesData {
  parties: SpeechesParty[];
  totalSpeeches?: number;
}

export function renderSpeechesSharepic(
  canvas: HTMLCanvasElement,
  data: SpeechesData,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'ink', 'corner', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  const parties = data.parties
    .filter(entry => entry.party !== 'fraktionslos')
    .sort((a, b) => b.speeches - a.speeches)
    .slice(0, 5);

  const total = data.totalSpeeches || parties.reduce((sum, entry) => sum + entry.speeches, 0);
  const max = Math.max(1, ...parties.map(entry => entry.speeches));

  const y = drawTitle(ctx, p, 'Die Reden', `${total.toLocaleString('de-DE')} Reden im Bundestag`);
  drawBarRows(ctx, parties.map(entry => ({ label: entry.party, party: entry.party, ratio: entry.speeches / max, value: `${entry.speeches.toLocaleString('de-DE')}` })), y, 58, 16);

  drawFooterUrl(ctx, p);
}

// ============ COMMON WORDS SLIDE ============

export interface CommonWordsData {
  topics: string[];
}

const CHIP_STYLES = [
  { bg: '#ff4fa0', fg: INK },
  { bg: '#7b3ff2', fg: '#ffffff' },
  { bg: '#ffffff', fg: INK },
];

export function renderCommonWordsSharepic(
  canvas: HTMLCanvasElement,
  data: CommonWordsData,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'ink', 'orbit', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  const words = data.topics.slice(0, 12);
  let y = drawTitle(ctx, p, commonWordsConfig.title, commonWordsConfig.subtitle);

  // Word chips flow left to right; the first words are the biggest.
  let x = MARGIN;
  let rowH = 0;
  words.forEach((word, i) => {
    const size = i < 2 ? 54 : i < 5 ? 44 : 36;
    const style = CHIP_STYLES[i % CHIP_STYLES.length];
    setFont(ctx, 'wide', size);
    const w = ctx.measureText(word).width + size * 1.4;
    const h = size * 1.9;
    if (x + w > SIZE - MARGIN) { x = MARGIN; y += rowH + 16; rowH = 0; }
    roundedRect(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = style.bg;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = style.fg;
    ctx.fillText(word, x + size * 0.7, y + h / 2 + size * 0.35);
    x += w + 16;
    rowH = Math.max(rowH, h);
  });

  drawFooterUrl(ctx, p);
}

// ============ TONE ANALYSIS SLIDE ============

export interface PartyProfile {
  party: string;
  emoji: string;
  traits: string[];
  categoryName?: string;
}

export interface ToneAnalysisData {
  partyProfiles: Record<string, PartyProfile>;
}

const TONE_CARDS = [
  { bg: '#ffffff', fg: INK },
  { bg: '#ff4fa0', fg: INK },
  { bg: '#0e0a14', fg: '#ffffff' },
];

export function renderToneAnalysisSharepic(
  canvas: HTMLCanvasElement,
  data: ToneAnalysisData,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'violet', 'corner', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  const profiles = Object.values(data.partyProfiles)
    .filter(profile => profile.party !== 'fraktionslos')
    .slice(0, 6);

  const top = drawTitle(ctx, p, toneAnalysisConfig.title, toneAnalysisConfig.subtitle, 160);

  // 3 x 2 cards; party in wide capitals, communication style below.
  const gap = 20;
  const cardW = (SIZE - MARGIN * 2 - gap * 2) / 3;
  const cardH = 190;
  profiles.forEach((profile, i) => {
    const x = MARGIN + (i % 3) * (cardW + gap);
    const y = top + Math.floor(i / 3) * (cardH + gap);
    const style = TONE_CARDS[i % TONE_CARDS.length];
    roundedRect(ctx, x, y, cardW, cardH, 32);
    ctx.fillStyle = style.bg;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = style.fg;
    const party = profile.party.toUpperCase();
    setFont(ctx, 'wide', fitSize(ctx, 'wide', party, cardW - 48, 36, 20));
    ctx.fillText(party, x + 24, y + 66);
    const trait = profile.categoryName || profile.traits?.[0] || '';
    const traitSize = fitSize(ctx, 'text', trait, cardW - 48, 28, 18, 700);
    setFont(ctx, 'text', traitSize, 700);
    ctx.fillText(trait, x + 24, y + 120);
  });

  drawFooterUrl(ctx, p);
}

// ============ SWIFTIE SLIDE ============

export interface SwiftieData {
  name: string;
  party: string;
}

export function renderSwiftieSharepic(
  canvas: HTMLCanvasElement,
  data: SwiftieData,
  editionTitle = 'Bundestag Wrapped',
): void {
  const setup = setupCanvas(canvas, 'pink', 'corner', editionTitle);
  if (!setup) return;
  const { ctx, p } = setup;

  let y = drawHeading(ctx, swiftieConfig.title, 190, p.on, 120, 56);
  y = drawSubtitle(ctx, swiftieConfig.subtitle, y + 8, p.muted, 40) + 20;

  // Name on a white plate, party as pill.
  const name = data.name.toUpperCase();
  const plateH = 340;
  roundedRect(ctx, MARGIN, y, SIZE - MARGIN * 2, plateH, 40);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const size = fitSize(ctx, 'wide', name, SIZE - MARGIN * 2 - 80, 72, 34);
  setFont(ctx, 'wide', size);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  ctx.fillText(name, MARGIN + 40, y + 40 + size);
  pill(ctx, data.party, MARGIN + 40, y + 40 + size + 30, partyFill(data.party), '#ffffff', 28);
  setFont(ctx, 'text', 28, 600);
  ctx.fillStyle = INK;
  ctx.fillText('Erwähnte "Taylor Swift" und "Swifties"', MARGIN + 40, y + plateH - 84);
  ctx.fillText('in einer Rede über Cybersicherheit', MARGIN + 40, y + plateH - 40);

  drawFooterUrl(ctx, p);
}

// ============ DOWNLOAD/SHARE HELPERS ============

export function downloadSharepic(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export async function shareSharepic(
  canvas: HTMLCanvasElement,
  { title, filename, url }: { title: string; filename: string; url: string },
): Promise<boolean> {
  if (!navigator.share) return false;

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      try {
        const file = new File([blob], filename.endsWith('.png') ? filename : `${filename}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title,
            url,
          });
        } else {
          await navigator.share({ title, url });
        }
        resolve(true);
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}

// ============ UNIFIED DISPATCHER ============

export type SlideType =
  | 'moin'
  | 'drama'
  | 'gender'
  | 'vocabulary'
  | 'speeches'
  | 'commonWords'
  | 'toneAnalysis'
  | 'swiftie';

export type SlideData =
  | { type: 'moin'; speakers: MoinSpeaker[] }
  | { type: 'drama'; drama: DramaStats }
  | { type: 'gender'; genderAnalysis: GenderAnalysis }
  | { type: 'vocabulary'; data: VocabularyData }
  | { type: 'speeches'; data: SpeechesData }
  | { type: 'commonWords'; data: CommonWordsData }
  | { type: 'toneAnalysis'; data: ToneAnalysisData }
  | { type: 'swiftie'; data: SwiftieData };

export function renderSlideSharepic(
  canvas: HTMLCanvasElement,
  slideData: SlideData,
  editionTitle = 'Bundestag Wrapped',
): void {
  switch (slideData.type) {
    case 'moin':
      renderMoinSharepic(canvas, slideData.speakers, editionTitle);
      break;
    case 'drama':
      renderDramaSharepic(canvas, slideData.drama, editionTitle);
      break;
    case 'gender':
      renderGenderSharepic(canvas, slideData.genderAnalysis, editionTitle);
      break;
    case 'vocabulary':
      renderVocabularySharepic(canvas, slideData.data, editionTitle);
      break;
    case 'speeches':
      renderSpeechesSharepic(canvas, slideData.data, editionTitle);
      break;
    case 'commonWords':
      renderCommonWordsSharepic(canvas, slideData.data, editionTitle);
      break;
    case 'toneAnalysis':
      renderToneAnalysisSharepic(canvas, slideData.data, editionTitle);
      break;
    case 'swiftie':
      renderSwiftieSharepic(canvas, slideData.data, editionTitle);
      break;
  }
}
