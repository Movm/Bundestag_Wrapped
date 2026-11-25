/** The CSS layout of cover.css, evaluated for a window (1rem = 16). Safe-area insets add to top/bottom padding and to the planet top. */

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

export interface CoverLayout {
  minHeight: number;
  padding: { top: number; right: number; bottom: number; left: number };
  stageWidth: number;
  stageHeight: number;
  gapStageTitle: number;
  gapTitleButton: number;
  titleSize: number;
  button: { height: number; paddingX: number; fontSize: number };
  planet: { size: number; left: number; top: number };
}

export function coverLayout(window: { width: number; height: number }, insets: { top: number; bottom: number }): CoverLayout {
  'worklet';
  const W = window.width, H = window.height;
  const side = clamp(20, W * 0.05, 72);
  const content = W - 2 * side;
  const stageWidth = Math.min(1100, (H - 400) * 1.92, Math.max(content, 1.45 * W));
  const narrow = W <= 480;
  return {
    minHeight: 560,
    padding: {
      top: clamp(20, W * 0.03, 40) + insets.top,
      right: side,
      bottom: clamp(24, W * 0.03, 40) + insets.bottom,
      left: side,
    },
    stageWidth,
    stageHeight: stageWidth * 0.52,
    gapStageTitle: clamp(20, H * 0.035, 40),
    gapTitleButton: clamp(36, H * 0.06, 64),
    titleSize: clamp(40, Math.min(W * 0.13, H * 0.11), 112),
    button: narrow ? { height: 56, paddingX: 28, fontSize: 18 } : { height: 64, paddingX: 34, fontSize: 20 },
    planet: { size: clamp(52, W * 0.06, 96), left: clamp(28, W * 0.05, 80), top: clamp(24, H * 0.04, 48) + insets.top },
  };
}
