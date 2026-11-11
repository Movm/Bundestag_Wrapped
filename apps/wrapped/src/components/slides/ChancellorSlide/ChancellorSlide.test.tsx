import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import preview2026 from '../../../../public/data/2026/preview-2026-11-10-match/wrapped.json';
import type { ChancellorAnalysis } from '@/generated/wrapped-contract-v1';
import { ChancellorIntroSlide, ChancellorSplitSlide, ChancellorTopicsSlide, ChancellorWordsSlide } from '.';

// jsdom has no IntersectionObserver; slide entrances (whileInView) need one.
globalThis.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } root = null; rootMargin = ''; thresholds = []; } as unknown as typeof IntersectionObserver;

const chancellor = (preview2026 as { chancellor: ChancellorAnalysis }).chancellor;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

async function render(node: React.ReactNode) {
  await act(async () => root.render(node));
  return container.textContent ?? '';
}

describe('chancellor chapter on the 2026 preview data', () => {
  it('opens with the question and how much he said', async () => {
    const text = await render(<ChancellorIntroSlide chancellor={chancellor} year={2026} />);
    expect(text).toContain('Innen- oder Außen­kanzler?');
    expect(text).toContain('Friedrich Merz kommt 2026 auf acht Reden und 101 Antworten in der Regierungsbefragung. Zusammen 28.655 Wörter.');
  });

  it('answers with the split for him, the same period last year and the rest of the chamber', async () => {
    const text = await render(<ChancellorSplitSlide chancellor={chancellor} year={2026} />);
    expect(text).toContain('Innenkanzler. Knapp.');
    const rows = [...container.querySelectorAll('tbody tr')].map(row => row.querySelector('th')?.firstChild?.textContent + ': ' + row.querySelector('.sr-only')?.textContent);
    expect(rows).toEqual(['Merz 2026: 56 % innen, 44 % außen', 'Merz 2025: 53 % innen, 47 % außen', 'Restlicher Bundestag: 84 % innen, 16 % außen']);
    expect(text).toContain('Sein Außen-Anteil ist 2,8-mal so hoch wie im restlichen Bundestag.');
    expect(text).toContain('Gezählt: 109 Beiträge als Kanzler, 2025 im gleichen Zeitraum 41. Restlicher Bundestag');
  });

  it('ranks his topic areas against the chamber', async () => {
    await render(<ChancellorTopicsSlide chancellor={chancellor} />);
    const labels = [...container.querySelectorAll('.ds-rank__label')].map(label => label.textContent);
    expect(labels[0]).toBe('Platz 1: Europa/Außen');
    expect(container.querySelector('.ds-rank__detail')?.textContent).toBe('Außen · Rund dreimal so oft wie im restlichen Bundestag');
    expect(labels).toHaveLength(5);
  });

  it('shows his typical words and the top topic words per side', async () => {
    const text = await render(<ChancellorWordsSlide chancellor={chancellor} />);
    expect([...container.querySelectorAll('.ds-chip')].map(chip => chip.textContent)).toEqual(['Europäischen', 'Kommission', 'Europa', 'Landes', 'Union', 'Staaten']);
    expect(text).toContain('Vorn: „Europäischen“, mindestens 8,1-mal so oft wie im restlichen Bundestag.');
    expect(text).toContain('Außen am häufigsten: Europa (83‑mal), Ukraine (39‑mal), Frieden (20‑mal)');
    expect(text).toContain('Innen am häufigsten: Unternehmen (33‑mal), Gerechtigkeit (17‑mal), Wettbewerbsfähigkeit (16‑mal)');
  });

  it('leaves out the prior year when the edition has none', async () => {
    await render(<ChancellorSplitSlide chancellor={{ ...chancellor, previous: undefined }} year={2026} />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
  });
});
