/**
 * ShareCanvasSkia - Skia-based share image renderer
 *
 * Renders the quiz result sharepic using Skia Canvas.
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
import {
  BRAND_COLORS,
  BG_COLORS,
  getResultMessage,
  getHeroLines,
  getHeroLinesVariant2,
} from '../lib/share-canvas';

// Canvas dimensions (1:1 aspect ratio)
const SIZE = 540; // Rendering size, will scale up for export

type ShareCanvasVariant = 'score' | 'title';

interface ShareCanvasSkiaProps {
  correctCount: number;
  totalQuestions: number;
  userName?: string;
  variant?: ShareCanvasVariant;
}

// Font family for system fonts
const fontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });

/**
 * Create a paragraph for text rendering (works on iOS unlike matchFont)
 * iOS System font doesn't work with matchFont(), but Paragraph API handles it correctly
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
  p.layout(9999); // Wide layout for single-line measurement
  return p;
}

export const ShareCanvasSkia = memo(function ShareCanvasSkia({
  correctCount,
  totalQuestions,
  userName,
  variant = 'score',
}: ShareCanvasSkiaProps) {
  // Load logo image
  const logo = useImage(require('../assets/logo.png'));

  // Font manager for Paragraph API (works on iOS unlike matchFont)
  const fontMgr = useFonts({});

  // Get result message based on score
  const result = useMemo(
    () => getResultMessage(correctCount, totalQuestions),
    [correctCount, totalQuestions]
  );

  // Get hero text lines based on variant
  const { line1, line2 } = useMemo(
    () => variant === 'title'
      ? getHeroLinesVariant2(userName, result)
      : getHeroLines(userName, result),
    [userName, result, variant]
  );

  const scoreText = `${correctCount}/${totalQuestions}`;
  const centerX = SIZE / 2;

  // Create all text paragraphs (memoized for performance)
  const paragraphs = useMemo(() => {
    if (!fontMgr) return null;

    const header = createParagraph(fontMgr, 'BUNDESTAG WRAPPED 2025', 13, 600, 'rgba(255, 255, 255, 0.5)');
    const heroLine1 = createParagraph(fontMgr, line1, 40, 700, BRAND_COLORS.primary);
    const heroLine2 = line2 ? createParagraph(fontMgr, line2, 40, 700, BRAND_COLORS.light) : null;
    const score = createParagraph(fontMgr, scoreText, variant === 'title' ? 110 : 70, 900, '#ffffff');
    const tagline = createParagraph(fontMgr, result.tagline, 18, 400, 'rgba(255, 255, 255, 0.7)');
    const footer1 = createParagraph(fontMgr, 'Wie gut kennst du den Bundestag? Teste dein Wissen auf', 13, 600, 'rgba(255, 255, 255, 0.45)');
    const footer2 = createParagraph(fontMgr, 'bundestag-wrapped.de', 17, 700, BRAND_COLORS.light);

    return { header, heroLine1, heroLine2, score, tagline, footer1, footer2 };
  }, [fontMgr, line1, line2, scoreText, result.tagline, variant]);

  // Calculate widths for centering
  const widths = useMemo(() => {
    if (!paragraphs) return { line1: 0, line2: 0, score: 0, tagline: 0, footer1: 0, footer2: 0 };
    return {
      line1: paragraphs.heroLine1.getMaxIntrinsicWidth(),
      line2: paragraphs.heroLine2?.getMaxIntrinsicWidth() ?? 0,
      score: paragraphs.score.getMaxIntrinsicWidth(),
      tagline: paragraphs.tagline.getMaxIntrinsicWidth(),
      footer1: paragraphs.footer1.getMaxIntrinsicWidth(),
      footer2: paragraphs.footer2.getMaxIntrinsicWidth(),
    };
  }, [paragraphs]);

  // Don't render until paragraphs are ready
  if (!paragraphs) {
    return <Canvas style={styles.canvas} />;
  }

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

      {/* Decorative orbs */}
      <DecorativeOrbs size={SIZE} />

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
          y={32}
          width={SIZE}
        />
      </Group>

      {/* Hero Line 1 - centered */}
      <Paragraph
        paragraph={paragraphs.heroLine1}
        x={centerX - widths.line1 / 2}
        y={130}
        width={SIZE}
      />

      {/* Hero Line 2 - centered (only if line2 has content) */}
      {paragraphs.heroLine2 && (
        <Paragraph
          paragraph={paragraphs.heroLine2}
          x={centerX - widths.line2 / 2}
          y={175}
          width={SIZE}
        />
      )}

      {/* Score - centered */}
      <Paragraph
        paragraph={paragraphs.score}
        x={centerX - widths.score / 2}
        y={variant === 'title' ? 240 : 260}
        width={SIZE}
      />

      {/* Tagline - centered */}
      <Paragraph
        paragraph={paragraphs.tagline}
        x={centerX - widths.tagline / 2}
        y={variant === 'title' ? 360 : 380}
        width={SIZE}
      />

      {/* Footer - centered */}
      <Paragraph
        paragraph={paragraphs.footer1}
        x={centerX - widths.footer1 / 2}
        y={SIZE - 80}
        width={SIZE}
      />
      <Paragraph
        paragraph={paragraphs.footer2}
        x={centerX - widths.footer2 / 2}
        y={SIZE - 60}
        width={SIZE}
      />
    </Canvas>
  );
});

/**
 * Decorative gradient orbs for background
 */
const DecorativeOrbs = memo(function DecorativeOrbs({ size }: { size: number }) {
  return (
    <Group>
      {/* Large pink orb (top-right) */}
      <Circle cx={size * 0.82} cy={size * 0.15} r={140}>
        <RadialGradient
          c={vec(size * 0.82, size * 0.15)}
          r={140}
          colors={[`${BRAND_COLORS.primary}18`, `${BRAND_COLORS.secondary}0a`, 'transparent']}
        />
      </Circle>

      {/* Medium orb (bottom-left) */}
      <Circle cx={size * 0.15} cy={size * 0.78} r={110}>
        <RadialGradient
          c={vec(size * 0.15, size * 0.78)}
          r={110}
          colors={[`${BRAND_COLORS.light}14`, `${BRAND_COLORS.primary}08`, 'transparent']}
        />
      </Circle>

      {/* Small accent orb (mid-left) */}
      <Circle cx={size * 0.08} cy={size * 0.45} r={60}>
        <RadialGradient
          c={vec(size * 0.08, size * 0.45)}
          r={60}
          colors={[`${BRAND_COLORS.secondary}10`, 'transparent']}
        />
      </Circle>

      {/* Small accent orb (bottom-right) */}
      <Circle cx={size * 0.88} cy={size * 0.9} r={50}>
        <RadialGradient
          c={vec(size * 0.88, size * 0.9)}
          r={50}
          colors={[`${BRAND_COLORS.gradientStart}12`, 'transparent']}
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

export { SIZE as SHARE_CANVAS_SIZE };
export default ShareCanvasSkia;
