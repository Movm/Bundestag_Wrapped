import { type ReactNode } from 'react';
import { Circle, Group, RoundedRect, Skia } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { blinkOpacity, cssRadii, type Flight, type FlyerKind, FLYERS, flyerPivot, sampleFlight, SKY, trailMotion, wobbleMotion } from './ambient';
import { type AmbientClocks } from './useAmbient';

const DEG = Math.PI / 180;

/** A `<i>` of the markup: a rect at (x, y) with CSS radii (top-left, top-right, bottom-right, bottom-left). */
function rrect(x: number, y: number, width: number, height: number, radii: [number, number, number, number]) {
  const [tl, tr, br, bl] = cssRadii(width, height, radii);
  return {
    rect: Skia.XYWHRect(x, y, width, height),
    topLeft: { x: tl, y: tl },
    topRight: { x: tr, y: tr },
    bottomRight: { x: br, y: br },
    bottomLeft: { x: bl, y: bl },
  };
}

// Shapes in the coordinates of each markup root (its top-left is 0, 0), verbatim from cover.ts.
const ROCKET = {
  finTop: rrect(6, -6, 24, 14, [2, 2, 2, 2]),
  finBottom: rrect(6, 16, 24, 14, [2, 2, 2, 2]),
  body: rrect(0, 7, 62, 10, [3, 999, 999, 3]),
  window: rrect(34, 9, 12, 6, [999, 999, 999, 999]),
  /** `[data-trail]` dots: centre and radius. */
  trail: [
    { cx: -8, cy: 12, r: 4, color: SKY.pink },
    { cx: -22, cy: 12, r: 3, color: SKY.lilac },
    { cx: -34, cy: 12, r: 2, color: SKY.white },
  ],
};
const UFO = {
  dome: rrect(14, 0, 18, 12, [999, 999, 0, 0]),
  saucer: rrect(0, 10, 46, 10, [999, 999, 999, 999]),
  light: { cx: 23, cy: 15, r: 2 },
};
const SAT = {
  panelLeft: rrect(0, 0, 18, 9, [1, 1, 1, 1]),
  body: rrect(21, 0, 9, 9, [2, 2, 2, 2]),
  lamp: { cx: 25.5, cy: -4.5, r: 2.5 },
  panelRight: rrect(33, 0, 18, 9, [1, 1, 1, 1]),
};

/**
 * `.cv-fly`: opacity 1 only while a flight runs (no fill), `translate(x, y) rotate(angle)` around the
 * centre of the shrunk fly box; the markup root then sits at its negative margins.
 */
function Flyer({ kind, flights, clock, children }: { kind: FlyerKind; flights: SharedValue<Flight[]>; clock: SharedValue<number>; children: ReactNode }) {
  const spec = FLYERS[kind];
  const pivot = flyerPivot(spec);
  const sample = useDerivedValue(() => sampleFlight(kind, flights.value, clock.value));
  const opacity = useDerivedValue(() => (sample.value ? 1 : 0));
  const transform = useDerivedValue(() => {
    const s = sample.value;
    return [{ translateX: s?.x ?? 0 }, { translateY: s?.y ?? 0 }, { rotate: s?.angle ?? 0 }];
  });
  return (
    <Group opacity={opacity} transform={transform} origin={pivot}>
      <Group transform={[{ translateX: spec.root.marginLeft }, { translateY: spec.root.marginTop }]}>
        {children}
      </Group>
    </Group>
  );
}

function TrailDot({ index, clock }: { index: number; clock: SharedValue<number> }) {
  const dot = ROCKET.trail[index];
  const opacity = useDerivedValue(() => trailMotion(index, clock.value).opacity);
  const transform = useDerivedValue(() => [{ scale: trailMotion(index, clock.value).scale }]);
  return (
    <Group opacity={opacity} transform={transform} origin={{ x: dot.cx, y: dot.cy }}>
      <Circle cx={dot.cx} cy={dot.cy} r={dot.r} color={dot.color} />
    </Group>
  );
}

function Blink({ cx, cy, r, color, clock }: { cx: number; cy: number; r: number; color: string; clock: SharedValue<number> }) {
  const opacity = useDerivedValue(() => blinkOpacity(clock.value));
  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={opacity} />;
}

function Wobble({ clock, children }: { clock: SharedValue<number>; children: ReactNode }) {
  const transform = useDerivedValue(() => {
    const w = wobbleMotion(clock.value);
    return [{ translateY: w.ty }, { rotate: w.rotate * DEG }];
  });
  // Around the centre of the 46 × 22 UFO root.
  return <Group transform={transform} origin={{ x: 23, y: 11 }}>{children}</Group>;
}

/** Rocket, UFO and satellite (`data-fly`), in DOM order. Few nodes, all driven by the ambient clock. */
export function Flyers({ ambient }: { ambient: AmbientClocks }) {
  const { clock, flights } = ambient;
  return (
    <>
      <Flyer kind="rocket" flights={flights.rocket} clock={clock}>
        {ROCKET.trail.map((_, i) => <TrailDot key={i} index={i} clock={clock} />)}
        <Group transform={[{ skewX: 40 * DEG }]} origin={{ x: 18, y: 1 }}>
          <RoundedRect rect={ROCKET.finTop} color={SKY.violet} />
        </Group>
        <Group transform={[{ skewX: -40 * DEG }]} origin={{ x: 18, y: 23 }}>
          <RoundedRect rect={ROCKET.finBottom} color={SKY.violet} />
        </Group>
        <RoundedRect rect={ROCKET.body} color={SKY.white} />
        <RoundedRect rect={ROCKET.window} color={SKY.pink} />
      </Flyer>
      <Flyer kind="ufo" flights={flights.ufo} clock={clock}>
        <Wobble clock={clock}>
          <RoundedRect rect={UFO.dome} color={SKY.lilac} />
          <RoundedRect rect={UFO.saucer} color={SKY.pink} />
          <Blink {...UFO.light} color={SKY.white} clock={clock} />
        </Wobble>
      </Flyer>
      <Flyer kind="satellite" flights={flights.satellite} clock={clock}>
        <RoundedRect rect={SAT.panelLeft} color={SKY.violet} />
        <RoundedRect rect={SAT.body} color={SKY.white} />
        <Blink {...SAT.lamp} color={SKY.pink} clock={clock} />
        <RoundedRect rect={SAT.panelRight} color={SKY.violet} />
      </Flyer>
    </>
  );
}
