/**
 * News Ticker Component (Skia Canvas)
 *
 * GPU-accelerated scrolling ticker for topics 6-13.
 * Performance: Single Canvas + Single SharedValue (Confetti pattern).
 * Zero React re-renders during animation.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Dimensions, Platform } from 'react-native';
import {
  Canvas,
  Text,
  Circle,
  Group,
  RoundedRect,
  matchFont,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { getPartyBgColor } from '@/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TICKER_HEIGHT = 36;
const FONT_SIZE = 13;
const DOT_SIZE = 10;
const ITEM_GAP = 24;
const DOT_GAP = 4;
const SEPARATOR_GAP = 16;
const TEXT_Y = TICKER_HEIGHT / 2 + FONT_SIZE / 3;

// System font matching (created once at module level)
const fontFamily = Platform.select({ ios: 'Helvetica', default: 'sans-serif' });
const font = matchFont({ fontFamily, fontSize: FONT_SIZE });
const boldFont = matchFont({ fontFamily, fontSize: FONT_SIZE, fontWeight: 'bold' });

interface TickerTopic {
  topic: string;
  rank: number;
  topParties: Array<{ party: string }>;
}

interface TopicsTickerProps {
  topics: TickerTopic[];
}

// Pre-computed layout for a single ticker item
interface TickerItemLayout {
  rankText: string;
  topicName: string;
  rankX: number;
  topicX: number;
  dotsStartX: number;
  separatorX: number;
  partyColors: string[];
}

export const TopicsTicker = memo(function TopicsTicker({
  topics,
}: TopicsTickerProps) {
  // Animation progress (0 to 1, repeats infinitely)
  const progress = useSharedValue(0);

  // Pre-compute ALL layout data including colors (no runtime calculations)
  const { items, totalWidth } = useMemo(() => {
    let currentX = 0;
    const layoutItems: TickerItemLayout[] = [];

    for (const topic of topics) {
      const rankText = `#${topic.rank}`;
      const rankWidth = boldFont.measureText(rankText).width;
      const topicWidth = font.measureText(topic.topic).width;
      const dotsWidth = Math.min(topic.topParties.length, 3) * DOT_SIZE +
        (Math.min(topic.topParties.length, 3) - 1) * DOT_GAP;
      const itemWidth = rankWidth + 6 + topicWidth + 8 + dotsWidth;

      layoutItems.push({
        rankText,
        topicName: topic.topic,
        rankX: currentX,
        topicX: currentX + rankWidth + 6,
        dotsStartX: currentX + rankWidth + 6 + topicWidth + 12,
        separatorX: currentX + itemWidth + ITEM_GAP / 2,
        partyColors: topic.topParties.slice(0, 3).map(p => getPartyBgColor(p.party)),
      });

      currentX += itemWidth + ITEM_GAP + SEPARATOR_GAP;
    }

    return { items: layoutItems, totalWidth: currentX };
  }, [topics]);

  // Store totalWidth in ref to avoid dependency in worklets
  const totalWidthRef = useRef(totalWidth);
  totalWidthRef.current = totalWidth;

  // Start infinite scroll animation
  useEffect(() => {
    if (totalWidth === 0) return;

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: totalWidth * 25,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => cancelAnimation(progress);
  }, [totalWidth, progress]);

  // Single derived value for first copy transform (no chaining!)
  const transform1 = useDerivedValue(() => {
    const x = -progress.value * totalWidthRef.current;
    return [{ translateX: x }];
  }, []);

  // Single derived value for second copy transform
  const transform2 = useDerivedValue(() => {
    const x = -progress.value * totalWidthRef.current + totalWidthRef.current;
    return [{ translateX: x }];
  }, []);

  if (items.length === 0) return null;

  return (
    <Canvas style={styles.canvas}>
      {/* Background */}
      <RoundedRect
        x={0}
        y={0}
        width={SCREEN_WIDTH}
        height={TICKER_HEIGHT}
        r={0}
        color="rgba(0, 0, 0, 0.5)"
      />

      {/* First copy - all primitives flattened */}
      <Group transform={transform1}>
        {items.flatMap((item, idx) => [
          <Text
            key={`r1-${idx}`}
            x={item.rankX}
            y={TEXT_Y}
            text={item.rankText}
            font={boldFont}
            color="rgba(255, 255, 255, 0.6)"
          />,
          <Text
            key={`t1-${idx}`}
            x={item.topicX}
            y={TEXT_Y}
            text={item.topicName}
            font={font}
            color="white"
          />,
          ...item.partyColors.map((color, i) => (
            <Circle
              key={`d1-${idx}-${i}`}
              cx={item.dotsStartX + i * (DOT_SIZE + DOT_GAP) + DOT_SIZE / 2}
              cy={TICKER_HEIGHT / 2}
              r={DOT_SIZE / 2}
              color={color}
            />
          )),
          <Text
            key={`s1-${idx}`}
            x={item.separatorX}
            y={TEXT_Y}
            text="|"
            font={font}
            color="rgba(255, 255, 255, 0.2)"
          />,
        ])}
      </Group>

      {/* Second copy for seamless loop - all primitives flattened */}
      <Group transform={transform2}>
        {items.flatMap((item, idx) => [
          <Text
            key={`r2-${idx}`}
            x={item.rankX}
            y={TEXT_Y}
            text={item.rankText}
            font={boldFont}
            color="rgba(255, 255, 255, 0.6)"
          />,
          <Text
            key={`t2-${idx}`}
            x={item.topicX}
            y={TEXT_Y}
            text={item.topicName}
            font={font}
            color="white"
          />,
          ...item.partyColors.map((color, i) => (
            <Circle
              key={`d2-${idx}-${i}`}
              cx={item.dotsStartX + i * (DOT_SIZE + DOT_GAP) + DOT_SIZE / 2}
              cy={TICKER_HEIGHT / 2}
              r={DOT_SIZE / 2}
              color={color}
            />
          )),
          <Text
            key={`s2-${idx}`}
            x={item.separatorX}
            y={TEXT_Y}
            text="|"
            font={font}
            color="rgba(255, 255, 255, 0.2)"
          />,
        ])}
      </Group>
    </Canvas>
  );
});

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TICKER_HEIGHT,
  },
});
