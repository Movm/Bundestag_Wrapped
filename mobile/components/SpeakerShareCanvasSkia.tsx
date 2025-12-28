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
  Text,
  matchFont,
  LinearGradient,
  vec,
  RadialGradient,
  Circle,
  Group,
  Image,
  useImage,
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

export const SpeakerShareCanvasSkia = memo(function SpeakerShareCanvasSkia({
  name,
  party,
  spiritAnimal,
  signatureWord,
}: SpeakerShareCanvasSkiaProps) {
  const logo = useImage(require('../assets/logo.png'));
  const partyColor = getPartyColor(party);

  // Create fonts inside component to ensure Skia is initialized
  const fonts = useMemo(() => ({
    header: matchFont({ fontFamily, fontSize: 12, fontWeight: '600' }),
    title: matchFont({ fontFamily, fontSize: 28, fontWeight: '700' }),
    titleSmall: matchFont({ fontFamily, fontSize: 24, fontWeight: '700' }),
    subtitle: matchFont({ fontFamily, fontSize: 15, fontWeight: '400' }),
    emoji: matchFont({ fontFamily, fontSize: 120, fontWeight: '400' }),
    footer: matchFont({ fontFamily, fontSize: 11, fontWeight: '400' }),
    footerUrl: matchFont({ fontFamily, fontSize: 12, fontWeight: '700' }),
  }), []);

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

  // Measure texts for layout
  const spiritLine1Width = hasAnimal ? fonts.title.measureText(spiritLine1).width : 0;
  const spiritLine2Width = hasAnimal ? fonts.title.measureText(spiritLine2).width : 0;

  // Use smaller font if text is too wide
  const useSmallFont = spiritLine1Width > maxWidth || spiritLine2Width > maxWidth;
  const titleFont = useSmallFont ? fonts.titleSmall : fonts.title;

  const signatureWidth = hasSignature ? titleFont.measureText(signatureLine).width : 0;
  const signatureNeedsTwoLines = signatureWidth > maxWidth;

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
        <Text
          x={60}
          y={42}
          text="BUNDESTAG WRAPPED 2025"
          font={fonts.header}
          color="rgba(255, 255, 255, 0.5)"
        />
      </Group>

      {/* Spirit Animal Section */}
      {hasAnimal && (
        <Group>
          {/* Line 1: "Name, dein Spirit Animal" */}
          <Text
            x={leftX}
            y={105}
            text={spiritLine1}
            font={titleFont}
            color={BRAND_COLORS.primary}
          />

          {/* Line 2: "ist der/die/das AnimalName" */}
          <Text
            x={leftX}
            y={useSmallFont ? 135 : 140}
            text={spiritLine2}
            font={titleFont}
            color={BRAND_COLORS.light}
          />

          {/* Subtitle */}
          <Text
            x={leftX}
            y={useSmallFont ? 165 : 175}
            text={spiritSubtitle.slice(0, 50) + (spiritSubtitle.length > 50 ? '...' : '')}
            font={fonts.subtitle}
            color="rgba(255, 255, 255, 0.8)"
          />

          {/* Large emoji */}
          <Text
            x={centerX - 60}
            y={340}
            text={spiritAnimal!.emoji}
            font={fonts.emoji}
            color="#ffffff"
          />
        </Group>
      )}

      {/* Signature Word Section */}
      {hasSignature && (
        <Group>
          {signatureNeedsTwoLines ? (
            <>
              <Text
                x={leftX}
                y={hasAnimal ? 420 : 200}
                text="Dein Signaturwort ist"
                font={titleFont}
                color="#ffffff"
              />
              <Text
                x={leftX}
                y={hasAnimal ? 455 : 235}
                text={signatureWord!.word + '.'}
                font={titleFont}
                color={BRAND_COLORS.light}
              />
              <Text
                x={leftX}
                y={hasAnimal ? 485 : 270}
                text={signatureSubtitle}
                font={fonts.subtitle}
                color="rgba(255, 255, 255, 0.8)"
              />
            </>
          ) : (
            <>
              <Text
                x={leftX}
                y={hasAnimal ? 420 : 200}
                text={signatureLine}
                font={titleFont}
                color={BRAND_COLORS.light}
              />
              <Text
                x={leftX}
                y={hasAnimal ? 455 : 235}
                text={signatureSubtitle}
                font={fonts.subtitle}
                color="rgba(255, 255, 255, 0.8)"
              />
            </>
          )}
        </Group>
      )}

      {/* Name only (when no animal or signature) */}
      {!hasAnimal && !hasSignature && (
        <Text
          x={leftX}
          y={200}
          text={name}
          font={fonts.title}
          color={BRAND_COLORS.light}
        />
      )}

      {/* Footer */}
      <Group>
        <Text
          x={centerX - fonts.footer.measureText('Finde dein Wrapped auf').width / 2}
          y={SIZE - 45}
          text="Finde dein Wrapped auf"
          font={fonts.footer}
          color="rgba(255, 255, 255, 0.6)"
        />
        <Text
          x={centerX - fonts.footerUrl.measureText('bundestag-wrapped.de').width / 2}
          y={SIZE - 25}
          text="bundestag-wrapped.de"
          font={fonts.footerUrl}
          color={BRAND_COLORS.light}
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
