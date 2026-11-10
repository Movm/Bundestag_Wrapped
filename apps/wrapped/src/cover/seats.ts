export interface Seat {
  /** Position in % of the stage (the stage keeps an aspect ratio of 1 : 0.52). */
  x: number;
  y: number;
  /** 0 → 1 from the left end of a row to the right end. */
  t: number;
  row: number;
  color: string;
}

const ROWS = 10;
const TOTAL = 630;
const STOPS = ['#ff4fa0', '#7b3ff2', '#b98cff', '#ffffff'].map(hex => [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16)));

function colorAt(t: number): string {
  const p = t * 3, i = Math.min(2, Math.floor(p)), f = p - i, a = STOPS[i], b = STOPS[i + 1];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')})`;
}

/** The hemicycle: ten concentric rows, seats spread by radius, coloured left to right. */
export function buildSeats(): Seat[] {
  const radii = Array.from({ length: ROWS }, (_, i) => 0.42 + i * 0.58 / (ROWS - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map(r => Math.round(TOTAL * r / sum));
  counts[ROWS - 1] += TOTAL - counts.reduce((a, b) => a + b, 0);
  const seats: Seat[] = [];
  radii.forEach((r, row) => {
    const n = counts[row];
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), angle = Math.PI * (1 - t);
      seats.push({
        x: +(50 + 48 * r * Math.cos(angle)).toFixed(2),
        y: +((0.5 - 0.48 * r * Math.sin(angle)) / 0.52 * 100).toFixed(2),
        t,
        row,
        color: colorAt(t),
      });
    }
  });
  return seats;
}
