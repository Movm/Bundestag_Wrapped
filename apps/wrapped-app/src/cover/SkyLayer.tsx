import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurStyle, Canvas, Circle, ClipOp, createPicture, Group, LinearGradient, PaintStyle, Picture, RadialGradient, RoundedRect, Skia } from '@shopify/react-native-skia';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import {
  buildStars, GLOW_POSITIONS, glowColors, glowMotion, GLOWS, type GlowSpec, planetGeometry, planetMotion, sampleShot,
  SHOOT, SKY, STAR_GLOW_SIGMA, STAR_LAYERS, starLayerOpacity,
} from './ambient';
import { type CoverLayout } from './coverLayout';
import { Flyers } from './Flyers';
import { type AmbientClocks } from './useAmbient';

type Size = { width: number; height: number };

/** One static Picture per star layer, recorded once per size (canvas `shadowBlur 8` = blur mask sigma 4 under the dot). */
function useStarPictures(size: Size) {
  return useMemo(() => {
    const layers = buildStars(size);
    const glow = Skia.MaskFilter.MakeBlur(BlurStyle.Normal, STAR_GLOW_SIGMA, true);
    return layers.map((stars, i) => createPicture(canvas => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      const blur = Skia.Paint();
      blur.setAntiAlias(true);
      blur.setMaskFilter(glow);
      for (const star of stars) {
        const color = Skia.Color(star.color);
        if (STAR_LAYERS[i].glow) {
          blur.setColor(color);
          blur.setAlphaf(star.alpha);
          canvas.drawCircle(star.x, star.y, star.r, blur);
        }
        paint.setColor(color);
        paint.setAlphaf(star.alpha);
        canvas.drawCircle(star.x, star.y, star.r, paint);
      }
    }, size));
  }, [size]);
}

/** `.cv-planet` in its own box: deep body, fixed inset shadow (−9, −7), then the pink ring on top. */
function usePlanetPicture(diameter: number) {
  return useMemo(() => {
    const geo = planetGeometry(diameter);
    const r = diameter / 2;
    return createPicture(canvas => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      // Inset shadow without blur: shadow colour where the body shifted by the offset does not reach.
      canvas.save();
      canvas.clipRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, diameter, diameter), r, r), ClipOp.Intersect, true);
      paint.setColor(Skia.Color(SKY.planetShadow));
      canvas.drawCircle(r, r, r, paint);
      paint.setColor(Skia.Color(SKY.deep));
      canvas.drawCircle(r + geo.shadowOffset.x, r + geo.shadowOffset.y, r, paint);
      canvas.restore();
      // Ring: an ellipse with a 2 px border inside its box, rotated −16° around the planet centre.
      const { ring, ringBorder } = geo;
      paint.setColor(Skia.Color(SKY.pink));
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(ringBorder);
      canvas.save();
      canvas.rotate(geo.ringRotate, r, r);
      canvas.drawOval(Skia.XYWHRect(ring.x + ringBorder / 2, ring.y + ringBorder / 2, ring.width - ringBorder, ring.height - ringBorder), paint);
      canvas.restore();
    }, { width: diameter, height: diameter });
  }, [diameter]);
}

function Glow({ glow, size, vw, vh, clock }: { glow: GlowSpec; size: Size; vw: number; vh: number; clock: SharedValue<number> }) {
  const cx = glow.left * size.width, cy = glow.top * size.height;
  const r = glow.size * Math.max(vw, vh) / 2;
  const colors = useMemo(() => glowColors(glow), [glow]);
  const transform = useDerivedValue(() => {
    const m = glowMotion(glow, clock.value, vw, vh);
    return [{ translateX: m.tx }, { translateY: m.ty }, { scale: m.scale }];
  });
  return (
    <Group transform={transform} origin={{ x: cx, y: cy }}>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={{ x: cx, y: cy }} r={r} colors={colors} positions={GLOW_POSITIONS} />
      </Circle>
    </Group>
  );
}

function StarLayer({ index, picture, assembly }: { index: number; picture: ReturnType<typeof createPicture>; assembly: SharedValue<number> }) {
  const opacity = useDerivedValue(() => starLayerOpacity(index, assembly.value));
  return (
    <Group opacity={opacity}>
      <Picture picture={picture} />
    </Group>
  );
}

const SHOOT_COLORS = ['rgba(255,255,255,0)', SKY.white];

function ShootingStar({ ambient }: { ambient: AmbientClocks }) {
  const sample = useDerivedValue(() => sampleShot(ambient.shots.value, ambient.clock.value));
  const opacity = useDerivedValue(() => sample.value?.opacity ?? 0);
  const transform = useDerivedValue(() => [
    { translateX: sample.value?.x ?? 0 }, { translateY: sample.value?.y ?? 0 }, { rotate: SHOOT.angle * Math.PI / 180 },
  ]);
  // CSS rotates around the centre of the 160 × 2 strip; radius 2 on a 2 px box resolves to 1.
  return (
    <Group opacity={opacity} transform={transform} origin={{ x: SHOOT.width / 2, y: SHOOT.height / 2 }}>
      <RoundedRect x={0} y={0} width={SHOOT.width} height={SHOOT.height} r={1}>
        <LinearGradient start={{ x: 0, y: 0 }} end={{ x: SHOOT.width, y: 0 }} colors={SHOOT_COLORS} />
      </RoundedRect>
    </Group>
  );
}

function Planet({ planet, clock }: { planet: CoverLayout['planet']; clock: SharedValue<number> }) {
  const picture = usePlanetPicture(planet.size);
  const transform = useDerivedValue(() => {
    const m = planetMotion(clock.value);
    return [{ translateX: planet.left }, { translateY: planet.top + m.ty }, { rotate: m.rotate * Math.PI / 180 }];
  });
  return (
    <Group transform={transform} origin={{ x: planet.size / 2, y: planet.size / 2 }}>
      <Picture picture={picture} />
    </Group>
  );
}

/**
 * `.cv-bg` of cover.ts: glows, three star layers, the shooting star, the planet and the flyers, in
 * that paint order, in one canvas behind the seats. With reduced motion the clock stays at −1: the
 * glows, stars and planet stand still (the web paints them, it just never animates them) and
 * nothing flies.
 */
export function SkyLayer({ size, window, planet, assembly, ambient }: {
  size: Size;
  window: Size;
  planet: CoverLayout['planet'];
  /** ms since the assembly started; the star layers fade in on it. */
  assembly: SharedValue<number>;
  ambient: AmbientClocks;
}) {
  const stars = useStarPictures(size);
  const vw = window.width / 100, vh = window.height / 100;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Canvas style={StyleSheet.absoluteFill}>
        {GLOWS.map((glow, i) => <Glow key={i} glow={glow} size={size} vw={vw} vh={vh} clock={ambient.clock} />)}
        {stars.map((picture, i) => <StarLayer key={i} index={i} picture={picture} assembly={assembly} />)}
        <ShootingStar ambient={ambient} />
        <Planet planet={planet} clock={ambient.clock} />
        <Flyers ambient={ambient} />
      </Canvas>
    </View>
  );
}
