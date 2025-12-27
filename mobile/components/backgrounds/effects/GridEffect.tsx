/**
 * GridEffect - Geometric grid pattern (Skia Canvas)
 *
 * Used for: gender (balanced, structured)
 * Creates a structured, data-driven feel with grid cells.
 *
 * Performance: Single Canvas for all grid lines and highlights
 */

import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import {
  Canvas,
  Line,
  Rect,
  Circle,
  vec,
  Blur,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import type { ThemeColors } from '../../../../src/shared/theme-backgrounds/types';

interface GridEffectProps {
  colors: ThemeColors;
  intensity?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_SIZE = 6;
const CELL_SIZE = SCREEN_WIDTH / GRID_SIZE;
const HIGHLIGHT_CELLS = 3;

// Helper to convert RGB string to rgba
function rgbToRgba(rgb: string, alpha: number): string {
  const [r, g, b] = rgb.split(',').map((s) => parseInt(s.trim(), 10));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Pre-generate highlight cell positions
const generateHighlightCells = () => {
  const cells: { row: number; col: number; phaseOffset: number }[] = [];
  const used = new Set<string>();

  while (cells.length < HIGHLIGHT_CELLS) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    const key = `${row}-${col}`;

    if (!used.has(key)) {
      used.add(key);
      cells.push({ row, col, phaseOffset: cells.length * 0.2 });
    }
  }

  return cells;
};

const HIGHLIGHT_CELL_CONFIGS = generateHighlightCells();

export const GridEffect = memo(function GridEffect({
  colors,
  intensity = 1,
}: GridEffectProps) {
  const baseOpacity = 0.15 * intensity;

  // Single progress drives all animations
  const progress = useSharedValue(0);

  // Pre-compute colors
  const lineColor = useMemo(
    () => rgbToRgba(colors.primary, baseOpacity * 0.5),
    [colors.primary, baseOpacity]
  );

  const highlightColors = useMemo(() => [
    rgbToRgba(colors.primary, 0.5),
    rgbToRgba(colors.secondary, 0.5),
  ], [colors]);

  const pulseColor = useMemo(
    () => rgbToRgba(colors.glow, baseOpacity),
    [colors.glow, baseOpacity]
  );

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  return (
    <Canvas style={styles.canvas}>
      {/* Grid lines */}
      <GridLines lineColor={lineColor} />

      {/* Highlight cells */}
      {HIGHLIGHT_CELL_CONFIGS.map((cell, i) => (
        <HighlightCell
          key={i}
          config={cell}
          progress={progress}
          baseOpacity={baseOpacity}
          color={highlightColors[i % 2]}
        />
      ))}

      {/* Center pulse */}
      <CenterPulse progress={progress} baseOpacity={baseOpacity} color={pulseColor} />
    </Canvas>
  );
});

interface GridLinesProps {
  lineColor: string;
}

const GridLines = memo(function GridLines({ lineColor }: GridLinesProps) {
  // Generate all grid lines (static - no animation needed)
  const lines = useMemo(() => {
    const result: { p1: { x: number; y: number }; p2: { x: number; y: number } }[] = [];

    // Horizontal lines
    for (let i = 0; i <= GRID_SIZE; i++) {
      result.push({
        p1: { x: 0, y: i * CELL_SIZE },
        p2: { x: SCREEN_WIDTH, y: i * CELL_SIZE },
      });
    }

    // Vertical lines
    for (let i = 0; i <= GRID_SIZE; i++) {
      result.push({
        p1: { x: i * CELL_SIZE, y: 0 },
        p2: { x: i * CELL_SIZE, y: SCREEN_HEIGHT },
      });
    }

    return result;
  }, []);

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          p1={vec(line.p1.x, line.p1.y)}
          p2={vec(line.p2.x, line.p2.y)}
          color={lineColor}
          strokeWidth={1}
        />
      ))}
    </>
  );
});

interface HighlightCellProps {
  config: (typeof HIGHLIGHT_CELL_CONFIGS)[0];
  progress: { value: number };
  baseOpacity: number;
  color: string;
}

const HighlightCell = memo(function HighlightCell({
  config,
  progress,
  baseOpacity,
  color,
}: HighlightCellProps) {
  const x = config.col * CELL_SIZE;
  const y = config.row * CELL_SIZE;

  const opacity = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;

    // Fade in, hold, fade out pattern
    if (phase < 0.15) {
      return baseOpacity * 2 * (phase / 0.15);
    } else if (phase < 0.35) {
      return baseOpacity * 2 * (1 - (phase - 0.15) / 0.2 * 0.5);
    } else if (phase < 0.5) {
      return baseOpacity * (1 + (phase - 0.35) / 0.15 * 0.5);
    } else if (phase < 0.65) {
      return baseOpacity * 1.5 * (1 - (phase - 0.5) / 0.15);
    }
    return 0;
  }, [progress, baseOpacity]);

  const scale = useDerivedValue(() => {
    const phase = (progress.value + config.phaseOffset) % 1;

    if (phase < 0.2) {
      return 0.8 + 0.2 * (phase / 0.2);
    } else if (phase < 0.5) {
      return 1 - 0.05 * ((phase - 0.2) / 0.3);
    } else if (phase < 0.65) {
      return 0.95 + 0.1 * ((phase - 0.5) / 0.15);
    }
    return 0.8;
  }, [progress]);

  const size = useDerivedValue(() => CELL_SIZE * scale.value, [scale]);
  const offsetX = useDerivedValue(() => x + (CELL_SIZE - size.value) / 2, [size]);
  const offsetY = useDerivedValue(() => y + (CELL_SIZE - size.value) / 2, [size]);

  return (
    <Rect
      x={offsetX}
      y={offsetY}
      width={size}
      height={size}
      color={color}
      opacity={opacity}
    >
      <Blur blur={5} />
    </Rect>
  );
});

interface CenterPulseProps {
  progress: { value: number };
  baseOpacity: number;
  color: string;
}

const CenterPulse = memo(function CenterPulse({
  progress,
  baseOpacity,
  color,
}: CenterPulseProps) {
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;
  const baseRadius = CELL_SIZE;

  const radius = useDerivedValue(() => {
    const phase = progress.value;
    return baseRadius * (1 + 0.5 * Math.sin(phase * Math.PI * 2));
  }, [progress]);

  const opacity = useDerivedValue(() => {
    const phase = progress.value;
    return baseOpacity * (0.5 + 0.5 * Math.cos(phase * Math.PI * 2));
  }, [progress, baseOpacity]);

  return (
    <Circle
      cx={centerX}
      cy={centerY}
      r={radius}
      color={color}
      opacity={opacity}
      style="stroke"
      strokeWidth={2}
    />
  );
});

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
  },
});
