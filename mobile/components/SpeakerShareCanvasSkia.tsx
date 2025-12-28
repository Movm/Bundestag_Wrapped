/**
 * SpeakerShareCanvasSkia - Skia-based speaker share image renderer
 *
 * Renders the speaker-wrapped sharepic using Skia Canvas.
 * This replaces the need for a server-side OG image API.
 */

import { memo, useMemo } from 'react';
import {
  Canvas,
  Rect,
  LinearGradient,
  vec,
  RadialGradient,
  Circle,
  Group,
  Image,
  useImage,
  Skia,
  Paragraph,
  useFonts,
  type SkFontMgr,
  type SkParagraph,
} from '@shopify/react-native-skia';
import { StyleSheet, Platform } from 'react-native';
import { getPartyColor } from '@/shared';
import { BRAND_COLORS, BG_COLORS } from '../lib/share-canvas';

// Canvas dimensions (1:1 aspect ratio)
const SIZE = 540;

// German articles for spirit animals
const ANIMAL_ARTICLES: Record<string, string> = {
  'Elefant': 'der', 'Adler': 'der', 'Löwe': 'der', 'Pfau': 'der',
  'Wolf': 'der', 'Bär': 'der', 'Papagei': 'der', 'Kolibri': 'der',
  'Delfin': 'der', 'Schwan': 'der', 'Fuchs': 'der', 'Igel': 'der',
  'Biber': 'der', 'Hase': 'der', 'Otter': 'der', 'Tiger': 'der',
  'Eule': 'die', 'Schildkröte': 'die', 'Biene': 'die', 'Krabbe': 'die',
  'Pferd': 'das', 'Eichhörnchen': 'das',
};

function getAnimalArticle(name: string): string {
  return ANIMAL_ARTICLES[name] || 'der';
}

interface SpiritAnimal {
  emoji: string;
  name: string;
  title: string;
  reason: string;
}

interface SignatureWord {
  word: string;
  count: number;
  score: number;
  ratio: number; // Usage ratio vs Bundestag average
}

interface SpeakerShareCanvasSkiaProps {
  name: string;
  party: string;
  spiritAnimal: SpiritAnimal | null;
  signatureWord: SignatureWord | null;
}

// Font family for system fonts
const fontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });

/**
 * Create a paragraph for text rendering (works on iOS unlike matchFont)
 */
function createParagraph(
  fontMgr: SkFontMgr,
  text: string,
  fontSize: number,
  fontWeight: number,
  color: string
): SkParagraph {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const para = Skia.ParagraphBuilder.Make({}, fontMgr as any);
  para.pushStyle({
    color: Skia.Color(color),
    fontFamilies: [fontFamily!],
    fontSize,
    fontStyle: { weight: fontWeight },
  });
  para.addText(text);
  para.pop();
  const p = para.build();
  p.layout(9999);
  return p;
}

export const SpeakerShareCanvasSkia = memo(function SpeakerShareCanvasSkia({
  name,
  party,
  spiritAnimal,
  signatureWord,
}: SpeakerShareCanvasSkiaProps) {
  const logo = useImage(require('../assets/logo.png'));
  const partyColor = getPartyColor(party);
  const fontMgr = useFonts({});

  const centerX = SIZE / 2;
  const leftX = 35;
  const maxWidth = SIZE - leftX * 2;

  // Determine layout based on what data we have
  const hasAnimal = !!spiritAnimal;
  const hasSignature = !!signatureWord;

  // Build text content
  const spiritLine1 = hasAnimal ? `${name}, dein Spirit Animal` : '';
  const spiritLine2 = hasAnimal
    ? `ist ${getAnimalArticle(spiritAnimal!.name)} ${spiritAnimal!.name}.`
    : '';
  const spiritSubtitle = hasAnimal
    ? `${spiritAnimal!.title}: ${spiritAnimal!.reason}`
    : '';

  const signatureLine = hasSignature
    ? `Dein Signaturwort ist ${signatureWord!.word}.`
    : '';
  const signatureSubtitle = hasSignature
    ? `${signatureWord!.count}× gesagt`
    : '';

  // Create all paragraphs
  const paragraphs = useMemo(() => {
    if (!fontMgr) return null;

    // Create test paragraphs to measure width
    const testLine1 = spiritLine1 ? createParagraph(fontMgr, spiritLine1, 28, 700, '#fff') : null;
    const testLine2 = spiritLine2 ? createParagraph(fontMgr, spiritLine2, 28, 700, '#fff') : null;
    const line1Width = testLine1?.getMaxIntrinsicWidth() ?? 0;
    const line2Width = testLine2?.getMaxIntrinsicWidth() ?? 0;
    const useSmallFont = line1Width > maxWidth || line2Width > maxWidth;
    const titleSize = useSmallFont ? 24 : 28;

    // Test signature width
    const testSignature = signatureLine ? createParagraph(fontMgr, signatureLine, titleSize, 700, '#fff') : null;
    const signatureWidth = testSignature?.getMaxIntrinsicWidth() ?? 0;
    const signatureNeedsTwoLines = signatureWidth > maxWidth;

    return {
      header: createParagraph(fontMgr, 'BUNDESTAG WRAPPED 2025', 12, 600, 'rgba(255, 255, 255, 0.5)'),
      spiritLine1: spiritLine1 ? createParagraph(fontMgr, spiritLine1, titleSize, 700, BRAND_COLORS.primary) : null,
      spiritLine2: spiritLine2 ? createParagraph(fontMgr, spiritLine2, titleSize, 700, BRAND_COLORS.light) : null,
      spiritSubtitle: spiritSubtitle ? createParagraph(fontMgr, spiritSubtitle.slice(0, 50) + (spiritSubtitle.length > 50 ? '...' : ''), 15, 400, 'rgba(255, 255, 255, 0.8)') : null,
      emoji: spiritAnimal?.emoji ? createParagraph(fontMgr, spiritAnimal.emoji, 120, 400, '#ffffff') : null,
      signaturePart1: signatureNeedsTwoLines ? createParagraph(fontMgr, 'Dein Signaturwort ist', titleSize, 700, '#ffffff') : null,
      signaturePart2: signatureNeedsTwoLines && signatureWord ? createParagraph(fontMgr, signatureWord.word + '.', titleSize, 700, BRAND_COLORS.light) : null,
      signatureFull: !signatureNeedsTwoLines && signatureLine ? createParagraph(fontMgr, signatureLine, titleSize, 700, BRAND_COLORS.light) : null,
      signatureSubtitle: signatureSubtitle ? createParagraph(fontMgr, signatureSubtitle, 15, 400, 'rgba(255, 255, 255, 0.8)') : null,
      nameFallback: createParagraph(fontMgr, name, 28, 700, BRAND_COLORS.light),
      footer1: createParagraph(fontMgr, 'Finde dein Wrapped auf', 11, 400, 'rgba(255, 255, 255, 0.6)'),
      footer2: createParagraph(fontMgr, 'bundestag-wrapped.de', 12, 700, BRAND_COLORS.light),
      useSmallFont,
      signatureNeedsTwoLines,
    };
  }, [fontMgr, spiritLine1, spiritLine2, spiritSubtitle, spiritAnimal, signatureLine, signatureWord, signatureSubtitle, name, maxWidth]);

  if (!paragraphs) {
    return <Canvas style={styles.canvas} />;
  }

  const { useSmallFont, signatureNeedsTwoLines } = paragraphs;

  return (
    <Canvas style={styles.canvas}>
      {/* Background gradient */}
      <Rect x={0} y={0} width={SIZE} height={SIZE}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, SIZE)}
          colors={[BG_COLORS.primary, BG_COLORS.elevated]}
        />
      </Rect>

      {/* Decorative orbs with party color */}
      <DecorativeOrbs size={SIZE} partyColor={partyColor} />

      {/* Header with logo */}
      <Group>
        {logo && (
          <Image
            image={logo}
            x={35}
            y={28}
            width={20}
            height={20}
          />
        )}
        <Paragraph
          paragraph={paragraphs.header}
          x={60}
          y={30}
          width={SIZE}
        />
      </Group>

      {/* Spirit Animal Section */}
      {hasAnimal && (
        <Group>
          {paragraphs.spiritLine1 && (
            <Paragraph
              paragraph={paragraphs.spiritLine1}
              x={leftX}
              y={80}
              width={SIZE}
            />
          )}
          {paragraphs.spiritLine2 && (
            <Paragraph
              paragraph={paragraphs.spiritLine2}
              x={leftX}
              y={useSmallFont ? 108 : 115}
              width={SIZE}
            />
          )}
          {paragraphs.spiritSubtitle && (
            <Paragraph
              paragraph={paragraphs.spiritSubtitle}
              x={leftX}
              y={useSmallFont ? 140 : 155}
              width={SIZE}
            />
          )}
          {paragraphs.emoji && (
            <Paragraph
              paragraph={paragraphs.emoji}
              x={centerX - 60}
              y={220}
              width={SIZE}
            />
          )}
        </Group>
      )}

      {/* Signature Word Section */}
      {hasSignature && (
        <Group>
          {signatureNeedsTwoLines ? (
            <>
              {paragraphs.signaturePart1 && (
                <Paragraph
                  paragraph={paragraphs.signaturePart1}
                  x={leftX}
                  y={hasAnimal ? 395 : 175}
                  width={SIZE}
                />
              )}
              {paragraphs.signaturePart2 && (
                <Paragraph
                  paragraph={paragraphs.signaturePart2}
                  x={leftX}
                  y={hasAnimal ? 425 : 205}
                  width={SIZE}
                />
              )}
              {paragraphs.signatureSubtitle && (
                <Paragraph
                  paragraph={paragraphs.signatureSubtitle}
                  x={leftX}
                  y={hasAnimal ? 460 : 245}
                  width={SIZE}
                />
              )}
            </>
          ) : (
            <>
              {paragraphs.signatureFull && (
                <Paragraph
                  paragraph={paragraphs.signatureFull}
                  x={leftX}
                  y={hasAnimal ? 395 : 175}
                  width={SIZE}
                />
              )}
              {paragraphs.signatureSubtitle && (
                <Paragraph
                  paragraph={paragraphs.signatureSubtitle}
                  x={leftX}
                  y={hasAnimal ? 430 : 210}
                  width={SIZE}
                />
              )}
            </>
          )}
        </Group>
      )}

      {/* Name only (when no animal or signature) */}
      {!hasAnimal && !hasSignature && (
        <Paragraph
          paragraph={paragraphs.nameFallback}
          x={leftX}
          y={175}
          width={SIZE}
        />
      )}

      {/* Footer */}
      <Group>
        <Paragraph
          paragraph={paragraphs.footer1}
          x={centerX - (paragraphs.footer1.getMaxIntrinsicWidth() / 2)}
          y={SIZE - 55}
          width={SIZE}
        />
        <Paragraph
          paragraph={paragraphs.footer2}
          x={centerX - (paragraphs.footer2.getMaxIntrinsicWidth() / 2)}
          y={SIZE - 38}
          width={SIZE}
        />
      </Group>
    </Canvas>
  );
});

/**
 * Decorative gradient orbs for background
 */
const DecorativeOrbs = memo(function DecorativeOrbs({
  size,
  partyColor,
}: {
  size: number;
  partyColor: string;
}) {
  return (
    <Group>
      {/* Large party-colored orb (top-right) */}
      <Circle cx={size * 0.82} cy={size * 0.15} r={140}>
        <RadialGradient
          c={vec(size * 0.82, size * 0.15)}
          r={140}
          colors={[`${partyColor}30`, `${BRAND_COLORS.secondary}0a`, 'transparent']}
        />
      </Circle>

      {/* Medium orb (bottom-left) */}
      <Circle cx={size * 0.15} cy={size * 0.78} r={110}>
        <RadialGradient
          c={vec(size * 0.15, size * 0.78)}
          r={110}
          colors={[`${partyColor}20`, `${BRAND_COLORS.primary}08`, 'transparent']}
        />
      </Circle>
    </Group>
  );
});

const styles = StyleSheet.create({
  canvas: {
    width: SIZE,
    height: SIZE,
  },
});

export { SIZE as SPEAKER_SHARE_CANVAS_SIZE };
export default SpeakerShareCanvasSkia;
