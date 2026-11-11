import { expect, test, type Page } from 'playwright/test';
import { installEditionFixtures } from './fixtures';

/**
 * Decorative shapes must never make text unreadable. Every slide, phone sizes
 * and one desktop size: a text line box may only meet the painted area of a
 * shape (circle, hollow ring, rotated square or band) when the text colour
 * still has WCAG contrast against the shape colour (4.5:1, 3:1 for large
 * text). Text on its own plate or card is ignored. Runs once (chromium).
 */
const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 375, height: 667 },
  { width: 385, height: 666 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

test.skip(({ browserName }) => browserName !== 'chromium', 'Layout matrix runs on chromium only.');
test.describe.configure({ mode: 'parallel' });

async function openReadingMode(page: Page) {
  await page.goto('/2025');
  await expect(page.locator('[data-slide-id]').first()).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Foliennavigation', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('checkbox', { name: /Lesemodus/ }).check();
  await page.getByRole('button', { name: 'Navigation schließen' }).click();
}

for (const viewport of VIEWPORTS) {
  test(`shapes never cover text on ${viewport.width}×${viewport.height}`, async ({ page }) => {
    test.setTimeout(240_000);
    await installEditionFixtures(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(viewport);
    await openReadingMode(page);
    const ids = await page.$$eval('[data-slide-id]', sections => sections.map(section => section.getAttribute('data-slide-id')!));
    const problems: string[] = [];
    let slidesWithShapes = 0;
    for (const id of ids) {
      const section = page.locator(`[data-slide-id="${id}"]`);
      await section.evaluate(element => element.parentElement!.scrollTo({ top: (element as HTMLElement).offsetTop, behavior: 'instant' }));
      await expect(section).toHaveAttribute('data-slide-effects-active', 'true');
      await page.waitForTimeout(100);
      await page.evaluate(() => {
        for (const animation of document.getAnimations()) {
          if (animation.effect?.getTiming().iterations !== Infinity) {
            try { animation.finish(); } catch { /* browser-managed */ }
          }
        }
      });
      const result = await section.evaluate(element => {
        type Pt = [number, number];
        const shapes = [...element.querySelectorAll<HTMLElement>('.ds-shape')].filter(s => getComputedStyle(s).display !== 'none');
        if (!shapes.length) return { shapes: 0, hits: [] as string[] };
        const clip = element.getBoundingClientRect();
        // Painted polygon of a (possibly rotated) box, from its own layout size.
        const polygon = (s: HTMLElement): Pt[] => {
          const cs = getComputedStyle(s);
          const box = s.getBoundingClientRect();
          const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform);
          const rotate = cs.rotate === 'none' ? 0 : parseFloat(cs.rotate) * (Math.PI / 180);
          const angle = rotate + Math.atan2(m.b, m.a);
          const w = s.offsetWidth * Math.hypot(m.a, m.b);
          const h = s.offsetHeight * Math.hypot(m.c, m.d);
          const cx = box.left + box.width / 2;
          const cy = box.top + box.height / 2;
          return ([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as Pt[]).map(([x, y]) => [
            cx + x * Math.cos(angle) - y * Math.sin(angle),
            cy + x * Math.sin(angle) + y * Math.cos(angle),
          ]);
        };
        const sat = (a: Pt[], b: Pt[]) => {
          for (const poly of [a, b]) {
            for (let i = 0; i < poly.length; i++) {
              const [x1, y1] = poly[i];
              const [x2, y2] = poly[(i + 1) % poly.length];
              const nx = y1 - y2;
              const ny = x2 - x1;
              const proj = (p: Pt[]) => p.map(([x, y]) => x * nx + y * ny);
              const pa = proj(a);
              const pb = proj(b);
              if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
            }
          }
          return true;
        };
        const hitsShape = (s: HTMLElement, r: DOMRect) => {
          const cs = getComputedStyle(s);
          const visible = { left: Math.max(r.left, clip.left), right: Math.min(r.right, clip.right), top: Math.max(r.top, clip.top), bottom: Math.min(r.bottom, clip.bottom) };
          if (visible.right <= visible.left || visible.bottom <= visible.top) return false;
          const rect: Pt[] = [[r.left, r.top], [r.right, r.top], [r.right, r.bottom], [r.left, r.bottom]];
          if (cs.borderRadius.includes('%') || cs.borderRadius === '50%') {
            // Circle (filled) or ring (border only): nearest/farthest rect corner against the radii.
            const b = s.getBoundingClientRect();
            const cx = b.left + b.width / 2;
            const cy = b.top + b.height / 2;
            const outer = b.width / 2;
            const border = parseFloat(cs.borderTopWidth);
            const hollow = cs.backgroundColor === 'rgba(0, 0, 0, 0)' && border > 0;
            const inner = hollow ? outer - border : 0;
            const nx = Math.min(Math.max(cx, r.left), r.right);
            const ny = Math.min(Math.max(cy, r.top), r.bottom);
            const near = Math.hypot(nx - cx, ny - cy);
            const far = Math.max(...rect.map(([x, y]) => Math.hypot(x - cx, y - cy)));
            return near < outer && far > inner;
          }
          return sat(polygon(s), rect);
        };
        const channels = (value: string) => {
          const numbers = (value.match(/[\d.]+/g) ?? []).map(Number);
          // Chrome serialises some colours as `color(srgb r g b)` with 0–1 channels.
          return value.startsWith('color(') ? [...numbers.slice(0, 3).map(n => n * 255), numbers[3] ?? 1] : numbers.slice(0, 4);
        };
        const luminance = ([r, g, b]: number[]) => {
          const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
          return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        };
        const contrast = (a: number[], b: number[]) => {
          const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
          return (hi + 0.05) / (lo + 0.05);
        };
        const shapeColour = (s: HTMLElement) => {
          const cs = getComputedStyle(s);
          return channels(cs.backgroundColor)[3] === 0 ? channels(cs.borderTopColor) : channels(cs.backgroundColor);
        };
        const onOwnPlate = (host: HTMLElement) => {
          for (let el: HTMLElement | null = host; el && el !== element; el = el.parentElement) {
            const bg = channels(getComputedStyle(el).backgroundColor);
            if (bg.length >= 3 && (bg[3] ?? 1) > 0.5) return true;
          }
          return false;
        };
        const hits: string[] = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = (node.textContent ?? '').trim();
          const host = node.parentElement;
          if (!text || !host || host.closest('[aria-hidden="true"], .sr-only, .ds-shapes')) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if (onOwnPlate(host)) continue;
          const hostStyle = getComputedStyle(host);
          const textColour = channels(hostStyle.color);
          const large = parseFloat(hostStyle.fontSize) >= 24 || (parseFloat(hostStyle.fontSize) >= 18.66 && Number(hostStyle.fontWeight) >= 700);
          for (const r of range.getClientRects()) {
            if (!r.width || !r.height) continue;
            for (const s of shapes) {
              if (hitsShape(s, r) && contrast(textColour, shapeColour(s)) < (large ? 3 : 4.5)) hits.push(`"${text.slice(0, 40)}" × ${s.parentElement!.className.replace('ds-shapes ', '')} ${s.className.replace('ds-shape ', '')} on ${s.closest('[data-surface]')?.getAttribute('data-surface')}`);
            }
          }
        }
        return { shapes: shapes.length, hits: [...new Set(hits)] };
      });
      if (result.shapes) slidesWithShapes += 1;
      problems.push(...result.hits.map(hit => `${id}: ${hit}`));
    }
    expect(slidesWithShapes).toBeGreaterThan(5);
    expect(problems).toEqual([]);
  });
}
