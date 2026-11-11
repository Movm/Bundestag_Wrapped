import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import preview2026 from '../../../../public/data/2026/preview-2026-11-10-match/wrapped.json';
import type { ChancellorAnalysis } from '@/generated/wrapped-contract-v1';
import { ChancellorFocusSlide, ChancellorIntroSlide, ChancellorSplitSlide, ChancellorTopicsSlide } from '.';

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

  it('answers with his split against the rest of the chamber', async () => {
    const text = await render(<ChancellorSplitSlide chancellor={chancellor} />);
    expect(text).toContain('Merz spricht etwas mehr über innen- als über außenpolitische Themen. Im Vergleich zum Rest des Bundestages dominiert aber die Außenpolitik.');
    expect([...container.querySelectorAll('.ds-io .sr-only')].map(row => row.textContent)).toEqual([
      'Merz: 56 % innen, 44 % außen',
      'Rest des Bundestages: 84 % innen, 16 % außen',
    ]);
  });

  it('says so plainly when he talks about foreign policy as often as the chamber', async () => {
    const text = await render(<ChancellorSplitSlide chancellor={{ ...chancellor, chamberForeignShare: 40 }} />);
    expect(text).toContain('Merz spricht etwas mehr über innen- als über außenpolitische Themen.');
    expect(text).not.toContain('dominiert');
  });

  it('ranks his three biggest topic areas next to his typical words', async () => {
    await render(<ChancellorTopicsSlide chancellor={chancellor} />);
    const labels = [...container.querySelectorAll('.ds-rank__label')].map(label => label.textContent);
    expect(labels).toEqual(['Platz 1: Europa/Außen', 'Platz 2: Wirtschaft', 'Platz 3: Soziales']);
    expect([...container.querySelectorAll('.ds-rank__detail')].map(detail => detail.textContent)).toEqual([
      'Außen · rund dreimal so oft wie im restlichen Bundestag',
      'Innen · 1,5-mal so oft',
      'Innen · seltener als der Rest',
    ]);
    expect([...container.querySelectorAll('.ds-chip')].map(chip => chip.textContent)).toEqual(['Kommission', 'Europa', 'Handel', 'Anstrengungen', 'Bürokratierückbau', 'Ukraine']);
  });

  it('turns to his focus: Europa, about three times as often as the chamber', async () => {
    const text = await render(<ChancellorFocusSlide chancellor={chancellor} />);
    expect(text).toContain('Oder ist er der Europa-Kanzler?');
    expect(text).toContain('Friedrich Merz spricht 3× so oft über das Thema Europa wie der Rest des Bundestages.');
    expect([...container.querySelectorAll('.ds-chip')].map(chip => chip.textContent)).toEqual(['Europa · 83×', 'Ukraine · 39×', 'Frieden · 20×']);
    expect(container.querySelectorAll('.ds-eu-ring__star')).toHaveLength(12);
  });

  it('only names the area when it barely stands out', async () => {
    const areas = chancellor.areas.map(area => ({ ...area, chamberPerThousand: area.perThousand }));
    const text = await render(<ChancellorFocusSlide chancellor={{ ...chancellor, areas }} />);
    expect(text).toContain('Sein Schwerpunkt:');
    expect(text).not.toContain('Kanzler?');
    expect(text).not.toContain('so oft');
  });
});
