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
import {
  BRAND_COLORS,
  BG_COLORS,
  getResultMessage,
  getHeroLines,
} from '../lib/share-canvas';

// Canvas dimensions (1:1 aspect ratio)
const SIZE = 540; // Rendering size, will scale up for export

interface ShareCanvasSkiaProps {
  correctCount: number;
  totalQuestions: number;
  userName?: string;
}

// Font family for system fonts
const fontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });

export const ShareCanvasSkia = memo(function ShareCanvasSkia({
  correctCount,
  totalQuestions,
  userName,
}: ShareCanvasSkiaProps) {
  // Load logo image
  const logo = useImage(require('../assets/logo.png'));

  // Create fonts inside component to ensure Skia is initialized
  const fonts = useMemo(() => ({
    header: matchFont({ fontFamily, fontSize: 13, fontWeight: '600' }),
    heroBold: matchFont({ fontFamily, fontSize: 40, fontWeight: '700' }),
    score: matchFont({ fontFamily, fontSize: 70, fontWeight: '900' }),
    tagline: matchFont({ fontFamily, fontSize: 18, fontWeight: '400' }),
    footerSmall: matchFont({ fontFamily, fontSize: 13, fontWeight: '600' }),
    footerUrl: matchFont({ fontFamily, fontSize: 17, fontWeight: '700' }),
  }), []);

  // Get result message based on score
  const result = useMemo(
    () => getResultMessage(correctCount, totalQuestions),
    [correctCount, totalQuestions]
  );

  // Get hero text lines
  const { line1, line2 } = useMemo(
    () => getHeroLines(userName, result),
    [userName, result]
  );

  const centerX = SIZE / 2;

  // Measure text widths for centering
  const line1Width = fonts.heroBold.measureText(line1).width;
  const line2Width = fonts.heroBold.measureText(line2).width;
  const scoreText = `${correctCount}/${totalQuestions}`;
  const scoreWidth = fonts.score.measureText(scoreText).width;
  const taglineWidth = fonts.tagline.measureText(result.tagline).width;
  const footer1Width = fonts.footerSmall.measureText('Teste dein Wissen auf').width;
  const footer2Width = fonts.footerUrl.measureText('bundestag-wrapped.de').width;

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
        <Text
          x={60}
          y={45}
          text="BUNDESTAG WRAPPED 2025"
          font={fonts.header}
          color="rgba(255, 255, 255, 0.5)"
        />
      </Group>

      {/* Hero Line 1 - centered */}
      <Text
        x={centerX - line1Width / 2}
        y={160}
        text={line1}
        font={fonts.heroBold}
        color={BRAND_COLORS.primary}
      />

      {/* Hero Line 2 - centered */}
      <Text
        x={centerX - line2Width / 2}
        y={215}
        text={line2}
        font={fonts.heroBold}
        color={BRAND_COLORS.light}
      />

      {/* Score - centered */}
      <Text
        x={centerX - scoreWidth / 2}
        y={330}
        text={scoreText}
        font={fonts.score}
        color="#ffffff"
      />

      {/* Tagline - centered */}
      <Text
        x={centerX - taglineWidth / 2}
        y={385}
        text={result.tagline}
        font={fonts.tagline}
        color="rgba(255, 255, 255, 0.7)"
      />

      {/* Footer - centered */}
      <Text
        x={centerX - footer1Width / 2}
        y={SIZE - 70}
        text="Teste dein Wissen auf"
        font={fonts.footerSmall}
        color="rgba(255, 255, 255, 0.45)"
      />
      <Text
        x={centerX - footer2Width / 2}
        y={SIZE - 45}
        text="bundestag-wrapped.de"
        font={fonts.footerUrl}
        color={BRAND_COLORS.light}
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
