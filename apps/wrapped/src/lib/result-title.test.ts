import { describe, expect, it } from 'vitest';
import { resultTitle } from './result-title';

describe('resultTitle', () => {
  it('uses the table for five questions', () => {
    expect([0, 1, 2, 3, 4, 5].map(correct => resultTitle(correct, 5)?.title)).toEqual([
      'Auf Entdeckungstour', 'Auf Entdeckungstour', 'Mit Blick fürs Plenum', 'Stammgast im Plenum', 'Parlamentsprofi', 'Parlamentsprofi',
    ]);
    expect(resultTitle(5, 5)?.line).toBe('Alles richtig. Du hast doch heimlich die Protokolle gelesen.');
  });

  it('maps other totals by share without wrong count words', () => {
    expect(resultTitle(1, 9)?.title).toBe('Auf Entdeckungstour');
    expect(resultTitle(3, 9)?.title).toBe('Mit Blick fürs Plenum');
    expect(resultTitle(5, 9)?.title).toBe('Stammgast im Plenum');
    expect(resultTitle(8, 9)).toEqual({ title: 'Parlamentsprofi', line: 'Fast alles gewusst. Was war bei der einen Frage los?' });
    expect(resultTitle(9, 9)?.line).toMatch(/^Alles richtig/);
    expect(resultTitle(1, 9)?.line).not.toMatch(/Ein Treffer/);
  });

  it('has no title without questions', () => {
    expect(resultTitle(0, 0)).toBeNull();
  });
});
