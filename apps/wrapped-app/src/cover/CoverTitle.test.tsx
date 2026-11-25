import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { coverLayout } from './coverLayout';
import { CoverTitle, LINE_BLEED, LINE_HEIGHT } from './CoverTitle';

// Reanimated's own mock needs the native module; the title only needs plain Views and static styles.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    Easing: { linear: (t: number) => t },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: () => ({}),
    withDelay: (_ms: number, v: unknown) => v,
    withTiming: (v: unknown) => v,
  };
});

const layout = coverLayout({ width: 402, height: 874 }, { top: 62, bottom: 34 });
const clocks = { assembly: { value: 0 }, exit: { value: -1 } } as never;

const title = (year: number | null, onPress = jest.fn()) =>
  render(<CoverTitle layout={layout} year={year} clocks={clocks} reducedMotion={false} onPress={onPress} />);

describe('CoverTitle', () => {
  it('exposes the title as a header and the button as a button', async () => {
    const onPress = jest.fn();
    await title(2026, onPress);
    expect(screen.getByRole('header', { name: 'Bundestag Wrapped 2026' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Los geht’s' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('labels the header without a year until the year is known', async () => {
    await title(null);
    expect(screen.getByRole('header', { name: 'Bundestag Wrapped' })).toBeTruthy();
  });

  it('keeps the title lines at 0.84 of the size, with the clip-proof bleed cancelled by margins', async () => {
    await title(2026);
    const word = StyleSheet.flatten(screen.getByText('Bundestag').props.style);
    expect(word.lineHeight + 2 * word.marginVertical).toBeCloseTo(LINE_HEIGHT * layout.titleSize);
    expect(word.marginVertical).toBeCloseTo(-LINE_BLEED * layout.titleSize);
  });

  it('reserves the year pill from the first render (no layout shift when the year arrives)', async () => {
    const { rerender } = await title(null);
    expect(screen.getByText('2026', { includeHiddenElements: true })).toBeTruthy();
    await rerender(<CoverTitle layout={layout} year={2027} clocks={clocks} reducedMotion={false} onPress={jest.fn()} />);
    expect(screen.getByText('2027', { includeHiddenElements: true })).toBeTruthy();
  });
});
