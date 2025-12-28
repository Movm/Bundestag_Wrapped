/**
 * AnimatedBubble - Single animated bubble with circle + text
 *
 * Uses phase-offset staggering from a shared progress value.
 * Pattern proven in Confetti.tsx for 60fps performance.
 */

import { memo, useMemo } from 'react';
import { Platform } from 'react-native';
import {
  Circle,
  Group,
  Text,
  matchFont,
  Skia,
  Paragraph,
  type SkFont,
  type SkFontMgr,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { AnimatedBubbleProps } from './types';

const fontFamily = Platform.select({ ios: 'System', default: 'sans-serif' });

interface AnimatedBubbleInternalProps extends AnimatedBubbleProps {
  fonts: {
    main: SkFont;
    subtext: SkFont;
  };
  fontMgr: SkFontMgr | null;
}

export const AnimatedBubble = memo(function AnimatedBubble({
  config,
  index,
  totalBubbles,
  progress,
  phaseOffset,
  flipProgress,
  fonts,
  fontMgr,
}: AnimatedBubbleInternalProps) {
  // Phase-adjusted progress for staggered entrance
  // Each bubble starts animating at different progress values
  // Empty deps: index/phaseOffset/totalBubbles are stable props, not SharedValues
  const adjustedProgress = useDerivedValue(() => {
    const delay = index * phaseOffset;
    const animationWindow = 1 - (totalBubbles - 1) * phaseOffset;

    if (progress.value <= delay) return 0;
    if (progress.value >= delay + animationWindow) return 1;

    return (progress.value - delay) / animationWindow;
  }, []);

  // Scale animation: ease-out cubic for smooth growth
  const scale = useDerivedValue(() => {
    const p = adjustedProgress.value;
    // Ease-out cubic: starts fast, slows down at end
    return 1 - Math.pow(1 - p, 3);
  }, []);

  // Opacity: quick fade-in (fully visible by 50% of animation)
  // Fades out FAST when flipping (first 20% of flip) so native can take over
  const opacity = useDerivedValue(() => {
    const entranceOpacity = Math.min(adjustedProgress.value * 2, 1);
    const flipValue = flipProgress?.value ?? 0;
    // Fade out quickly in first 20% of flip animation
    const flipFade = Math.min(flipValue * 5, 1);
    return entranceOpacity * (1 - flipFade);
  }, []);

  // Animated radius
  const radius = useDerivedValue(() => {
    return (config.size / 2) * scale.value;
  }, [config.size]);

  // Pre-calculate text widths for centering (memoized to avoid recalc on re-render)
  const textMeasurements = useMemo(() => ({
    mainTextWidth: fonts.main.measureText(config.frontText).width,
    subtextWidth: config.frontSubtext
      ? fonts.subtext.measureText(config.frontSubtext).width
      : 0,
  }), [fonts, config.frontText, config.frontSubtext]);
  const { mainTextWidth, subtextWidth } = textMeasurements;

  // Build emoji paragraph if needed (uses system font fallback for emoji)
  const emojiParagraph = useMemo(() => {
    if (!config.emoji || !fontMgr) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const para = Skia.ParagraphBuilder.Make({}, fontMgr as any);
    para.pushStyle({
      color: Skia.Color('#ffffff'),
      fontFamilies: [fontFamily!],
      fontSize: 32,
      fontStyle: { weight: 400 },
    });
    para.addText(config.emoji);
    para.pop();
    const p = para.build();
    p.layout(config.size);
    return p;
  }, [fontMgr, config.emoji, config.size]);

  // Calculate emoji width for centering
  const emojiWidth = emojiParagraph?.getMaxIntrinsicWidth() ?? 0;

  // Vertical positioning based on content
  const hasEmoji = Boolean(config.emoji);
  const hasSubtext = Boolean(config.frontSubtext);

  // Calculate Y positions for text elements
  const emojiY = config.y - 28;
  const mainTextY = hasEmoji
    ? config.y + 12
    : hasSubtext
      ? config.y - 2
      : config.y + 10;
  const subtextY = hasEmoji
    ? config.y + 28
    : config.y + 16;

  return (
    <Group>
      {/* Animated Circle */}
      <Circle
        cx={config.x}
        cy={config.y}
        r={radius}
        color={config.color}
        opacity={opacity}
      />

      {/* Emoji (if present) */}
      {emojiParagraph && (
        <Group opacity={opacity}>
          <Paragraph
            paragraph={emojiParagraph}
            x={config.x - emojiWidth / 2}
            y={emojiY}
            width={config.size}
          />
        </Group>
      )}

      {/* Main text with shadow */}
      <Group opacity={opacity}>
        {/* Shadow */}
        <Text
          x={config.x - mainTextWidth / 2 + 0.5}
          y={mainTextY + 1}
          text={config.frontText}
          font={fonts.main}
          color="rgba(0,0,0,0.25)"
        />
        {/* Text */}
        <Text
          x={config.x - mainTextWidth / 2}
          y={mainTextY}
          text={config.frontText}
          font={fonts.main}
          color="#ffffff"
        />
      </Group>

      {/* Subtext (if present) */}
      {config.frontSubtext && (
        <Group opacity={opacity}>
          {/* Shadow */}
          <Text
            x={config.x - subtextWidth / 2 + 0.5}
            y={subtextY + 1}
            text={config.frontSubtext}
            font={fonts.subtext}
            color="rgba(0,0,0,0.25)"
          />
          {/* Text */}
          <Text
            x={config.x - subtextWidth / 2}
            y={subtextY}
            text={config.frontSubtext}
            font={fonts.subtext}
            color="#ffffff"
          />
        </Group>
      )}
    </Group>
  );
});
