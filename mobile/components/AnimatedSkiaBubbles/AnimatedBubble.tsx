/**
 * AnimatedBubble - Single animated bubble with circle + text
 *
 * Uses phase-offset staggering from a shared progress value.
 * Pattern proven in Confetti.tsx for 60fps performance.
 *
 * Note: Uses Paragraph API for text rendering as matchFont() fails on iOS
 */

import { memo, useMemo } from 'react';
import { Platform } from 'react-native';
import {
  Circle,
  Group,
  Skia,
  Paragraph,
  type SkFontMgr,
  type SkParagraph,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { AnimatedBubbleProps } from './types';

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

interface AnimatedBubbleInternalProps extends AnimatedBubbleProps {
  fontMgr: SkFontMgr;
  fontSize: number;
  subtextFontSize: number;
}

export const AnimatedBubble = memo(function AnimatedBubble({
  config,
  index,
  totalBubbles,
  progress,
  phaseOffset,
  flipProgress,
  fontMgr,
  fontSize,
  subtextFontSize,
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

  // Create all text paragraphs (memoized)
  const paragraphs = useMemo(() => {
    const mainText = createParagraph(fontMgr, config.frontText, fontSize, 900, '#ffffff');
    const subtext = config.frontSubtext
      ? createParagraph(fontMgr, config.frontSubtext, subtextFontSize, 700, '#ffffff')
      : null;
    const emoji = config.emoji
      ? createParagraph(fontMgr, config.emoji, 32, 400, '#ffffff')
      : null;

    return {
      mainText,
      mainTextWidth: mainText.getMaxIntrinsicWidth(),
      subtext,
      subtextWidth: subtext?.getMaxIntrinsicWidth() ?? 0,
      emoji,
      emojiWidth: emoji?.getMaxIntrinsicWidth() ?? 0,
    };
  }, [fontMgr, config.frontText, config.frontSubtext, config.emoji, fontSize, subtextFontSize]);

  // Vertical positioning based on content
  const hasEmoji = Boolean(config.emoji);
  const hasSubtext = Boolean(config.frontSubtext);

  // Calculate Y positions for text elements (adjusted for Paragraph vs Text baseline)
  const emojiY = config.y - 44;
  const mainTextY = hasEmoji
    ? config.y - 4
    : hasSubtext
      ? config.y - 16
      : config.y - 6;
  const subtextY = hasEmoji
    ? config.y + 14
    : config.y + 4;

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
      {paragraphs.emoji && (
        <Group opacity={opacity}>
          <Paragraph
            paragraph={paragraphs.emoji}
            x={config.x - paragraphs.emojiWidth / 2}
            y={emojiY}
            width={config.size}
          />
        </Group>
      )}

      {/* Main text */}
      <Group opacity={opacity}>
        <Paragraph
          paragraph={paragraphs.mainText}
          x={config.x - paragraphs.mainTextWidth / 2}
          y={mainTextY}
          width={config.size}
        />
      </Group>

      {/* Subtext (if present) */}
      {paragraphs.subtext && (
        <Group opacity={opacity}>
          <Paragraph
            paragraph={paragraphs.subtext}
            x={config.x - paragraphs.subtextWidth / 2}
            y={subtextY}
            width={config.size}
          />
        </Group>
      )}
    </Group>
  );
});
