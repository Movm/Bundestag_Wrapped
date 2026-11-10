/**
 * The story cover ("Start Sitzreihen"): 630 seats assemble into the Bundestag
 * hemicycle under a starry sky, then collapse into a pink wipe on "Starten".
 *
 * Framework-free on purpose. The same controller runs twice without ever
 * existing twice: an inline boot script mounts it at first paint (index.html),
 * and React's IntroSlide later adopts that very element (Web Animations keep
 * running across a DOM move). Only transform and opacity animate, all through
 * the Web Animations API, so motion stays on the compositor while the main
 * bundle parses.
 */
import { buildSeats, type Seat } from './seats';

export interface CoverController {
  readonly root: HTMLElement;
  /** Called on the "Starten" press itself (sound). */
  onPress: (() => void) | null;
  /** Called once the pink wipe covers the screen (or at once with reduced motion). */
  onStart: (() => void) | null;
  /** True between "Starten" and the end of the wipe. */
  readonly exiting: boolean;
  setYear(year: string | null): void;
  /** Plays the assembly again from the seed (after coming back to the cover). */
  replay(): void;
  /** Stops all motion while the cover is off screen; `resume` restarts the ambient layer. */
  pause(): void;
  resume(): void;
}

const EASE_IN = 'cubic-bezier(.2,1.25,.4,1)';
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Small deterministic PRNG: the same cover on every load and in every test. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const ROCKET = '<div style="position:relative;width:60px;height:24px;margin:-12px 0 0 -30px">'
  + '<i data-trail="0" style="left:-12px;top:8px;width:8px;height:8px;border-radius:50%;background:#ff4fa0"></i>'
  + '<i data-trail="1" style="left:-25px;top:9px;width:6px;height:6px;border-radius:50%;background:#b98cff"></i>'
  + '<i data-trail="2" style="left:-36px;top:10px;width:4px;height:4px;border-radius:50%;background:#fff"></i>'
  + '<i style="left:6px;top:-6px;width:24px;height:14px;border-radius:2px;background:#7b3ff2;transform:skewX(40deg)"></i>'
  + '<i style="left:6px;top:16px;width:24px;height:14px;border-radius:2px;background:#7b3ff2;transform:skewX(-40deg)"></i>'
  + '<i style="left:0;top:7px;width:62px;height:10px;border-radius:3px 999px 999px 3px;background:#fff"></i>'
  + '<i style="left:34px;top:9px;width:12px;height:6px;border-radius:999px;background:#ff4fa0"></i></div>';
const UFO = '<div data-wobble style="position:relative;width:46px;height:22px;margin:-11px 0 0 -23px">'
  + '<i style="left:14px;top:0;width:18px;height:12px;border-radius:999px 999px 0 0;background:#b98cff"></i>'
  + '<i style="left:0;top:10px;width:46px;height:10px;border-radius:999px;background:#ff4fa0"></i>'
  + '<i data-blink style="left:21px;top:13px;width:4px;height:4px;border-radius:50%;background:#fff"></i></div>';
const SAT = '<div style="position:relative;width:51px;height:9px;margin:-5px 0 0 -25px">'
  + '<i style="left:0;top:0;width:18px;height:9px;border-radius:1px;background:#7b3ff2"></i>'
  + '<i style="left:21px;top:0;width:9px;height:9px;border-radius:2px;background:#fff"></i>'
  + '<i data-blink style="left:23px;top:-7px;width:5px;height:5px;border-radius:50%;background:#ff4fa0"></i>'
  + '<i style="left:33px;top:0;width:18px;height:9px;border-radius:1px;background:#7b3ff2"></i></div>';

function markup(eagleSrc: string): string {
  return '<div class="cv-bg" aria-hidden="true">'
    + '<div class="cv-glow cv-glow--a"></div><div class="cv-glow cv-glow--b"></div><div class="cv-glow cv-glow--c"></div>'
    + '<div class="cv-stars"><canvas></canvas></div><div class="cv-stars"><canvas></canvas></div><div class="cv-stars"><canvas></canvas></div>'
    + '<div class="cv-shoot"></div><div class="cv-planet"></div>'
    + `<div class="cv-fly" data-fly="rocket">${ROCKET}</div><div class="cv-fly" data-fly="ufo">${UFO}</div><div class="cv-fly" data-fly="sat">${SAT}</div>`
    + '</div>'
    + '<div class="cv-main">'
    + `<div class="cv-stage" aria-hidden="true"><div class="cv-seed"></div><img class="cv-eagle" src="${eagleSrc}" alt="" width="506" height="316" decoding="async" fetchpriority="high"></div>`
    + '<div class="cv-title">'
    + '<h1 class="cv-h1"><span data-in="up" data-delay="1350">Bundestag</span> <span class="cv-pink" data-in="up" data-delay="1430">Wrapped</span> <span class="cv-year" data-in="pop" data-delay="1600" hidden></span></h1>'
    + `<button type="button" class="cv-start" data-in="up" data-delay="1650">Starten ${ARROW}</button>`
    + '</div></div>'
    + '<div class="cv-burst" aria-hidden="true"></div>';
}

const ENTRANCES: Record<string, Keyframe[]> = {
  up: [{ opacity: 0, transform: 'translateY(50px)' }, { opacity: 1, transform: 'none' }],
  float: [{ opacity: 0, transform: 'translateY(-30px) scale(.7) rotate(-8deg)' }, { opacity: 1, transform: 'none' }],
  pop: [{ opacity: 0, transform: 'rotate(-40deg) scale(0)' }, { opacity: 1, transform: 'rotate(-6deg) scale(1)' }],
};

/** Draws one star layer into its canvas, sized to the layer at device resolution. */
function drawStars(canvas: HTMLCanvasElement, rand: () => number, count: number, size: number, alpha: [number, number], colors: string[], glow: boolean) {
  const box = canvas.parentElement!.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(box.width * ratio));
  canvas.height = Math.max(1, Math.round(box.height * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(rand() * colors.length)];
    ctx.globalAlpha = alpha[0] + rand() * (alpha[1] - alpha[0]);
    ctx.fillStyle = color;
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 8; }
    ctx.beginPath();
    ctx.arc(rand() * box.width, rand() * box.height, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function createCover(root: HTMLElement, options: { eagleSrc: string; year: string | null }): CoverController {
  root.classList.add('cv');
  root.innerHTML = markup(options.eagleSrc);
  const stage = root.querySelector<HTMLElement>('.cv-stage')!;
  const seed = root.querySelector<HTMLElement>('.cv-seed')!;
  const burst = root.querySelector<HTMLElement>('.cv-burst')!;
  const startButton = root.querySelector<HTMLButtonElement>('.cv-start')!;
  const year = root.querySelector<HTMLElement>('.cv-year')!;
  const bg = root.querySelector<HTMLElement>('.cv-bg')!;
  const layers = [...root.querySelectorAll<HTMLElement>('.cv-stars')];

  const seats: Seat[] = buildSeats();
  const fragment = document.createDocumentFragment();
  const dots = seats.map(seat => {
    const dot = document.createElement('div');
    dot.className = 'cv-seat';
    dot.style.cssText = `left:${seat.x}%;top:${seat.y}%;background:${seat.color}`;
    fragment.appendChild(dot);
    return dot;
  });
  stage.insertBefore(fragment, seed);

  let story: Animation[] = []; // assembly, idle wave and exit: cancelled together
  let ambient: Animation[] = []; // background loops
  let timers: number[] = [];
  let exiting = false;
  let paused = false;
  /** After the wipe: the seats sit in the centre until the cover is shown again. */
  let collapsed = false;
  /** The wave is due but the cover was off screen; `resume` starts it. */
  let wavePending = false;

  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const animate = (list: Animation[], el: Element, keyframes: Keyframe[], opts: KeyframeAnimationOptions) => {
    const animation = el.animate(keyframes, opts);
    list.push(animation);
    return animation;
  };

  function paintStars() {
    const rand = random(2026);
    drawStars(layers[0].firstElementChild as HTMLCanvasElement, rand, 140, 1.5, [0.18, 0.38], ['#fff', '#b98cff'], false);
    drawStars(layers[1].firstElementChild as HTMLCanvasElement, rand, 60, 2, [0.35, 0.6], ['#fff', '#fff', '#b98cff'], false);
    drawStars(layers[2].firstElementChild as HTMLCanvasElement, rand, 18, 3, [0.55, 0.85], ['#fff', '#b98cff', '#ff4fa0'], true);
  }

  function geometry() {
    const box = stage.getBoundingClientRect();
    return { width: box.width, height: box.height, cx: box.width / 2, cy: box.height * 0.55, left: box.left, top: box.top };
  }

  /** Seed pulse, seats fly out of the centre into their rows, then the title rises. */
  function assemble() {
    const rand = random(630);
    const { width, height, cx, cy } = geometry();
    animate(story, seed, [
      { transform: 'scale(0)' }, { transform: 'scale(1.5)', offset: 0.25 }, { transform: 'scale(1)', offset: 0.42 },
      { transform: 'scale(1.6)', offset: 0.6 }, { transform: 'scale(1.1)', offset: 0.75 }, { transform: 'scale(2.4)', offset: 0.9 }, { transform: 'scale(0)' },
    ], { duration: 650, easing: 'ease-in-out', fill: 'forwards' });
    dots.forEach((dot, i) => {
      const seat = seats[i];
      const px = seat.x / 100 * width, py = seat.y / 100 * height;
      const angle = rand() * Math.PI * 2, distance = width * (0.15 + rand() * 0.45);
      const sx = cx + Math.cos(angle) * distance - px, sy = cy + Math.sin(angle) * distance * 0.7 - py;
      animate(story, dot, [
        { transform: `translate(${cx - px}px,${cy - py}px) scale(0)`, easing: 'cubic-bezier(.05,.9,.3,1)' },
        { transform: `translate(${sx}px,${sy}px) scale(1.3)`, offset: 0.34, easing: 'cubic-bezier(.65,0,.25,1)' },
        { transform: 'none' },
      ], { duration: 1300, delay: 500 + seat.t * 260 + seat.row * 14 + rand() * 40, fill: 'backwards' });
    });
    root.querySelectorAll<HTMLElement>('[data-in]').forEach(el => {
      animate(story, el, ENTRANCES[el.dataset.in!], { duration: 700, delay: Number(el.dataset.delay), easing: EASE_IN, fill: 'backwards' });
    });
    animate(story, root.querySelector('.cv-eagle')!, ENTRANCES.float, { duration: 700, delay: 1250, easing: EASE_IN, fill: 'backwards' });
    layers.forEach((layer, i) => animate(story, layer, [{ opacity: 0 }, { opacity: 1 }], { duration: 1200, delay: i * 250, easing: 'ease-out', fill: 'backwards' }));
    later(wave, 2200 + 1500);
  }

  /** A slow light wave through the rows every ten seconds: one looping animation per seat, created once. */
  function wave() {
    if (paused) { wavePending = true; return; }
    wavePending = false;
    dots.forEach((dot, i) => {
      const seat = seats[i];
      animate(story, dot, [
        { transform: 'none' }, { transform: 'scale(1.25)', offset: 0.07 }, { transform: 'none', offset: 0.14 }, { transform: 'none' },
      ], { duration: 10_000, delay: seat.t * 1800 + seat.row * 40, iterations: Infinity, easing: 'ease-in-out' });
    });
  }

  // ─── Ambient layer: glows, planet, shooting star, flyers, parallax ───────
  function blockedArea(pad: number) {
    const b = bg.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const title = root.querySelector('.cv-title')!.getBoundingClientRect();
    const ccx = s.left - b.left + s.width / 2, ccy = s.top - b.top + s.height * 0.96, radius = s.width * 0.52 + pad;
    const tl = title.left - b.left - 30, tr = title.right - b.left + 30, tt = title.top - b.top - 30, tb = title.bottom - b.top + 30;
    return (x: number, y: number) => Math.hypot(x - ccx, y - ccy) < radius || (x > tl && x < tr && y > tt && y < tb);
  }

  function freePath() {
    const w = bg.clientWidth, h = bg.clientHeight, m = 70, hit = blockedArea(50);
    const edge = (side: number): [number, number] => { const r = Math.random(); return ([[-m, r * h], [w + m, r * h], [r * w, -m], [r * w, h + m]] as [number, number][])[side]; };
    for (let attempt = 0; attempt < 80; attempt++) {
      const a = Math.floor(Math.random() * 4), b = Math.floor(Math.random() * 4);
      if (a === b) continue;
      const [x1, y1] = edge(a), [x2, y2] = edge(b);
      let clear = Math.hypot(x2 - x1, y2 - y1) > 300;
      for (let k = 0; k <= 24 && clear; k++) clear = !hit(x1 + (x2 - x1) * k / 24, y1 + (y2 - y1) * k / 24);
      if (clear) return { x1, y1, x2, y2 };
    }
    return null;
  }

  function fly(kind: string, speed: number, rotate: boolean, easing: string) {
    const el = root.querySelector(`[data-fly="${kind}"]`), path = freePath();
    if (!el || !path) return;
    const angle = rotate ? ` rotate(${Math.atan2(path.y2 - path.y1, path.x2 - path.x1)}rad)` : '';
    animate(ambient, el, [
      { opacity: 1, transform: `translate(${path.x1}px,${path.y1}px)${angle}` },
      { opacity: 1, transform: `translate(${path.x2}px,${path.y2}px)${angle}` },
    ], { duration: Math.hypot(path.x2 - path.x1, path.y2 - path.y1) / speed * 1000, easing });
  }

  function shootingStar() {
    const w = bg.clientWidth, h = bg.clientHeight, hit = blockedArea(30), d = 260 + Math.random() * 200, len = 160;
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = Math.random() * w, y = h * (0.04 + Math.random() * 0.7);
      let clear = true;
      for (let k = 0; k <= 8 && clear; k++) {
        const px = x + (d + len) * 0.91 * k / 8, py = y + (d + len) * 0.41 * k / 8;
        clear = !hit(px, py) && px <= w;
      }
      if (!clear) continue;
      animate(ambient, root.querySelector('.cv-shoot')!, [
        { opacity: 0, transform: `translate(${x}px,${y}px) rotate(24deg)` },
        { opacity: 1, offset: 0.25 },
        { opacity: 0, transform: `translate(${x + d * 0.91}px,${y + d * 0.41}px) rotate(24deg)` },
      ], { duration: 900, easing: 'cubic-bezier(.3,0,.7,1)' });
      return;
    }
  }

  let ambientTimers: number[] = [];
  const loop = (fn: () => void, min: number, max: number) => {
    const go = () => { fn(); ambientTimers.push(window.setTimeout(go, min + Math.random() * (max - min))); };
    ambientTimers.push(window.setTimeout(go, min * 0.4));
  };

  let pointerFrame = 0;
  const onPointerMove = (event: PointerEvent) => {
    if (pointerFrame) return;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      const mx = event.clientX / innerWidth - 0.5, my = event.clientY / innerHeight - 0.5;
      [6, 16, 34].forEach((f, i) => { layers[i].style.transform = `translate(${-mx * f}px,${-my * f}px)`; });
    });
  };

  function startAmbient() {
    if (reducedMotion() || ambient.length) return;
    const drift: Record<string, string> = { a: 'translate(-5vw,3vh) scale(1.1)', b: 'translate(7vw,6vh) scale(.9)', c: 'translate(6vw,-5vh) scale(1.15)' };
    const durations: Record<string, number> = { a: 17_000, b: 13_000, c: 19_000 };
    for (const key of ['a', 'b', 'c']) {
      animate(ambient, root.querySelector(`.cv-glow--${key}`)!, [{ transform: 'none' }, { transform: drift[key] }], { duration: durations[key], iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    }
    animate(ambient, root.querySelector('.cv-planet')!, [{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(-14px) rotate(6deg)' }], { duration: 7000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
    root.querySelectorAll<HTMLElement>('[data-trail]').forEach(el => animate(ambient, el, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0.25, transform: 'scale(.5)' }], { duration: 360, delay: Number(el.dataset.trail) * 120, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
    root.querySelectorAll('[data-blink]').forEach(el => animate(ambient, el, [{ opacity: 1 }, { opacity: 0.15 }], { duration: 700, iterations: Infinity, direction: 'alternate', easing: 'steps(2)' }));
    root.querySelectorAll('[data-wobble]').forEach(el => animate(ambient, el, [{ transform: 'translateY(-4px) rotate(-8deg)' }, { transform: 'translateY(4px) rotate(8deg)' }], { duration: 600, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }));
    loop(shootingStar, 5000, 10_000);
    loop(() => fly('rocket', 240, true, 'cubic-bezier(.4,0,.8,1)'), 9000, 15_000);
    loop(() => fly('ufo', 420, false, 'cubic-bezier(.7,0,.3,1)'), 15_000, 24_000);
    loop(() => fly('sat', 35, false, 'linear'), 24_000, 36_000);
    addEventListener('pointermove', onPointerMove, { passive: true });
  }

  function stopAmbient() {
    ambient.forEach(a => a.cancel());
    ambient = [];
    ambientTimers.forEach(clearTimeout);
    ambientTimers = [];
    removeEventListener('pointermove', onPointerMove);
  }

  function resetStory() {
    story.forEach(a => a.cancel());
    story = [];
    clearTimers();
  }

  /** Seats fall into the centre, the seed pops, a pink wipe covers the screen. */
  function exit() {
    if (exiting) return;
    controller.onPress?.();
    if (reducedMotion()) { controller.onStart?.(); return; }
    exiting = true;
    resetStory();
    const { width, height, cx, cy, left, top } = geometry();
    const rand = random(17);
    root.querySelectorAll<HTMLElement>('[data-in], .cv-eagle').forEach((el, i) => animate(story, el, [
      { opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(40px) scale(.96)' },
    ], { duration: 380, delay: i * 30, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' }));
    dots.forEach((dot, i) => {
      const seat = seats[i];
      const dx = cx - seat.x / 100 * width, dy = cy - seat.y / 100 * height;
      animate(story, dot, [
        { transform: 'none' },
        { transform: `translate(${-dx * 0.12}px,${-dy * 0.12}px) scale(1.4)`, offset: 0.3, easing: 'cubic-bezier(.7,0,.25,1)' },
        { transform: `translate(${dx}px,${dy}px) scale(.8)` },
      ], { duration: 1000, delay: (9 - seat.row) * 30 + Math.abs(seat.t - 0.5) * 160 + rand() * 50, fill: 'forwards' });
    });
    later(() => animate(story, seed, [{ transform: 'scale(0)' }, { transform: 'scale(3)', offset: 0.6 }, { transform: 'scale(2.2)' }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' }), 1200);
    const rootBox = root.getBoundingClientRect();
    const x = left - rootBox.left + cx, y = top - rootBox.top + cy;
    const reach = Math.hypot(Math.max(x, rootBox.width - x), Math.max(y, rootBox.height - y)) + 20;
    const base = burst.offsetWidth / 2;
    later(() => animate(story, burst, [
      { transform: `translate(${x}px,${y}px) scale(${width * 0.03 / base})` },
      { transform: `translate(${x}px,${y}px) scale(${reach / base})` },
    ], { duration: 750, easing: 'cubic-bezier(.75,0,.2,1)', fill: 'forwards' }), 1500);
    later(() => { exiting = false; collapsed = true; controller.onStart?.(); }, 2280);
  }

  const controller: CoverController = {
    root,
    onPress: null,
    onStart: null,
    get exiting() { return exiting; },
    setYear(value) { year.textContent = value ?? ''; year.hidden = !value; },
    replay() {
      exiting = false;
      collapsed = false;
      wavePending = false;
      resetStory();
      if (!reducedMotion()) assemble();
    },
    pause() {
      if (paused) return;
      paused = true;
      stopAmbient();
      story.forEach(a => a.pause());
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (collapsed) controller.replay();
      else story.forEach(a => a.play());
      if (wavePending) wave();
      startAmbient();
    },
  };

  startButton.addEventListener('click', exit);
  controller.setYear(options.year);
  paintStars();
  let resizeFrame = 0;
  addEventListener('resize', () => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(paintStars); });
  if (!reducedMotion()) assemble();
  startAmbient();
  return controller;
}
