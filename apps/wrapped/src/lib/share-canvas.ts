import { BG_COLORS, BRAND_COLORS } from './design-tokens';

export interface ShareImageData {
  correctCount: number;
  totalQuestions: number;
  userName?: string;
}

export type ShareCanvasVariant = 'score' | 'title';

// Logo preloading
let logoImage: HTMLImageElement | null = null;
let logoLoadPromise: Promise<HTMLImageElement> | null = null;

export function preloadLogo(): Promise<HTMLImageElement> {
  if (logoImage) return Promise.resolve(logoImage);
  if (logoLoadPromise) return logoLoadPromise;

  logoLoadPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      resolve(img);
    };
    img.onerror = reject;
    img.src = '/logo.png';
  });

  return logoLoadPromise;
}

// Start preloading immediately
if (typeof window !== 'undefined') {
  preloadLogo();
}

function getResultMessage(correctCount: number, totalQuestions: number): { emoji: string; title: string; tagline: string } {
  // Normalize to 0-10 scale
  const score = Math.round((correctCount / totalQuestions) * 10);

  switch (score) {
    case 10: return {
      emoji: '🏆', title: 'Legende!',
      tagline: 'Perfekt! Du könntest im Bundestag hospitieren.'
    };
    case 9: return {
      emoji: '🏆', title: 'Legende!',
      tagline: 'Deine Eltern wären so stolz auf dich.'
    };
    case 8: return {
      emoji: '🏆', title: 'Legende!',
      tagline: 'Fast makellos – da wackelt der Kanzlerstuhl.'
    };
    case 7: return {
      emoji: '🌟', title: 'Demokratie-Star!',
      tagline: 'Mit dir würden wir in eine Koalition gehen.'
    };
    case 6: return {
      emoji: '🌟', title: 'Demokratie-Star!',
      tagline: 'Solide! Die Fraktion wäre beeindruckt.'
    };
    case 5: return {
      emoji: '🚀', title: 'Politik-Talent!',
      tagline: 'Die Hälfte ist geschafft, weiter so!'
    };
    case 4: return {
      emoji: '🚀', title: 'Politik-Talent!',
      tagline: 'Du bist auf einem guten Weg, bleib dran!'
    };
    case 3: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: 'Rom wurde auch nicht an einem Tag erbaut.'
    };
    case 2: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: 'Jeder Profi hat mal klein angefangen.'
    };
    case 1: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: 'Ein Punkt ist besser als kein Punkt!'
    };
    default: return {
      emoji: '✨', title: 'Rising Star!',
      tagline: "Nächstes Mal wird's besser, versprochen!"
    };
  }
}

function drawDecorativeOrbs(ctx: CanvasRenderingContext2D, size: number): void {
  // Large pink orb (top-right)
  const gradient1 = ctx.createRadialGradient(
    size * 0.82, size * 0.15, 0,
    size * 0.82, size * 0.15, 280
  );
  gradient1.addColorStop(0, `${BRAND_COLORS.primary}18`);
  gradient1.addColorStop(0.5, `${BRAND_COLORS.secondary}0a`);
  gradient1.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient1;
  ctx.beginPath();
  ctx.arc(size * 0.82, size * 0.15, 280, 0, Math.PI * 2);
  ctx.fill();

  // Medium orb (bottom-left)
  const gradient2 = ctx.createRadialGradient(
    size * 0.15, size * 0.78, 0,
    size * 0.15, size * 0.78, 220
  );
  gradient2.addColorStop(0, `${BRAND_COLORS.light}14`);
  gradient2.addColorStop(0.6, `${BRAND_COLORS.primary}08`);
  gradient2.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient2;
  ctx.beginPath();
  ctx.arc(size * 0.15, size * 0.78, 220, 0, Math.PI * 2);
  ctx.fill();

  // Small accent orb (mid-left)
  const gradient3 = ctx.createRadialGradient(
    size * 0.08, size * 0.45, 0,
    size * 0.08, size * 0.45, 120
  );
  gradient3.addColorStop(0, `${BRAND_COLORS.secondary}10`);
  gradient3.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient3;
  ctx.beginPath();
  ctx.arc(size * 0.08, size * 0.45, 120, 0, Math.PI * 2);
  ctx.fill();

  // Small accent orb (bottom-right)
  const gradient4 = ctx.createRadialGradient(
    size * 0.88, size * 0.9, 0,
    size * 0.88, size * 0.9, 100
  );
  gradient4.addColorStop(0, `${BRAND_COLORS.gradientStart}12`);
  gradient4.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient4;
  ctx.beginPath();
  ctx.arc(size * 0.88, size * 0.9, 100, 0, Math.PI * 2);
  ctx.fill();
}

export function renderShareImage(
  canvas: HTMLCanvasElement,
  data: ShareImageData,
  variant: ShareCanvasVariant = 'score'
): void {
  const { correctCount, totalQuestions, userName } = data;
  const result = getResultMessage(correctCount, totalQuestions);
  const name = userName?.trim();

  const SIZE = 1080;
  canvas.width = SIZE;
  canvas.height = SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, SIZE);
  bgGradient.addColorStop(0, BG_COLORS.primary);
  bgGradient.addColorStop(1, BG_COLORS.elevated);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Decorative gradient orbs
  drawDecorativeOrbs(ctx, SIZE);

  const centerX = SIZE / 2;

  // === COMPACT HEADER: Logo + "BUNDESTAG WRAPPED 2025" left-aligned ===
  const headerY = 80;
  const headerX = 70;
  const logoSize = 40;
  const headerText = 'BUNDESTAG WRAPPED 2025';

  if (logoImage) {
    const logoHeight = (logoImage.height / logoImage.width) * logoSize;
    ctx.shadowColor = BRAND_COLORS.primary;
    ctx.shadowBlur = 10;
    ctx.drawImage(logoImage, headerX, headerY - logoHeight / 2 - 4, logoSize, logoHeight);
    ctx.shadowBlur = 0;
  }

  ctx.font = '600 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(headerText, headerX + logoSize + 12, headerY);

  // === HERO: Two-line achievement text (same size, color, left-aligned) ===
  ctx.textAlign = 'left';
  ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // Shared gradient for both lines
  const heroGradient = ctx.createLinearGradient(0, 0, SIZE, 0);
  heroGradient.addColorStop(0, BRAND_COLORS.gradientStart);
  heroGradient.addColorStop(0.5, BRAND_COLORS.primary);
  heroGradient.addColorStop(1, BRAND_COLORS.light);
  ctx.fillStyle = heroGradient;

  // Calculate left X position (centered block)
  // Variant 'score': "Moritz, du bist" + "Polit-Legende! 🏆"
  // Variant 'title': "Moritz, du bist eine:" only (no second line)
  const line1Text = variant === 'title'
    ? (name ? `${name}, du bist eine:` : 'Du bist eine:')
    : (name ? (name.length <= 14 ? `${name}, du bist` : `${name} ist`) : 'Du bist');
  const line2Text = variant === 'title'
    ? '' // No second line in title variant
    : `${result.title} ${result.emoji}`;
  const maxWidth = line2Text
    ? Math.max(ctx.measureText(line1Text).width, ctx.measureText(line2Text).width)
    : ctx.measureText(line1Text).width;
  const heroX = centerX - maxWidth / 2;

  // Line 1: "Du bist" or "Moritz ist" or "Du bist eine:"
  const line1Y = 320;
  ctx.shadowColor = `${BRAND_COLORS.primary}60`;
  ctx.shadowBlur = 50;
  ctx.fillText(line1Text, heroX, line1Y);

  // Line 2: title + emoji (only for 'score' variant)
  if (line2Text) {
    const line2Y = 420;
    ctx.fillText(line2Text, heroX, line2Y);
  }
  ctx.shadowBlur = 0;

  // === SCORE (bold text, centered) ===
  ctx.textAlign = 'center';
  const scoreY = variant === 'title' ? 546 : 600; // 5% higher for 'title' variant
  const scoreFontSize = variant === 'title' ? 220 : 140; // larger for 'title' variant
  ctx.font = `900 ${scoreFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${correctCount}/${totalQuestions}`, centerX, scoreY);

  // === TAGLINE ===
  const taglineY = variant === 'title' ? 686 : 740; // 5% higher for 'title' variant
  ctx.font = 'italic 36px Georgia, "Times New Roman", serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(result.tagline, centerX, taglineY);

  // === FOOTER with CTA ===
  const footerY = SIZE - 140;

  ctx.font = '26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillText('Wie gut kennst du den Bundestag? Teste dein Wissen auf', centerX, footerY);

  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const urlGradient = ctx.createLinearGradient(centerX - 200, 0, centerX + 200, 0);
  urlGradient.addColorStop(0, BRAND_COLORS.gradientStart);
  urlGradient.addColorStop(1, BRAND_COLORS.light);
  ctx.fillStyle = urlGradient;
  ctx.fillText('bundestag-wrapped.de', centerX, footerY + 45);
}

export function downloadShareImage(canvas: HTMLCanvasElement, userName?: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = userName?.trim()
      ? `bundestag-wrapped-2025-${userName.trim().toLowerCase().replace(/\s+/g, '-')}.png`
      : 'bundestag-wrapped-2025.png';
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * Share image using Web Share API
 */
export async function shareImage(canvas: HTMLCanvasElement): Promise<boolean> {
  // Check if Web Share API is available
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      try {
        const file = new File([blob], 'bundestag-wrapped-2025.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Mein Bundestag Wrapped 2025',
          });
          resolve(true);
        } else {
          resolve(false);
        }
      } catch {
        resolve(false);
      }
    }, 'image/png');
  });
}
