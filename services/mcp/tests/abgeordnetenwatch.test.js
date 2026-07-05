import { describe, it, expect } from 'vitest';
import { aggregateTally } from '../src/api/abgeordnetenwatch.js';
import { abgeordnetenwatchTools } from '../src/tools/abgeordnetenwatch.js';

describe('abgeordnetenwatch tools', () => {
  it('exposes the six transparency tools with the aw prefix', () => {
    const names = abgeordnetenwatchTools.map((t) => t.name);
    expect(names).toEqual([
      'abgeordnetenwatch_search_politicians',
      'abgeordnetenwatch_voting_record',
      'abgeordnetenwatch_sidejobs',
      'abgeordnetenwatch_search_polls',
      'abgeordnetenwatch_poll_tally',
      'abgeordnetenwatch_politician_profile'
    ]);
  });

  it('every tool has the fields the MCP registration requires', () => {
    for (const tool of abgeordnetenwatchTools) {
      expect(typeof tool.name).toBe('string');
      expect(tool.description.length).toBeGreaterThan(0);
      expect(typeof tool.inputSchema).toBe('object');
      expect(typeof tool.handler).toBe('function');
    }
  });

  it('voting_record / sidejobs / profile error cleanly without a selector', async () => {
    for (const name of ['abgeordnetenwatch_voting_record', 'abgeordnetenwatch_sidejobs', 'abgeordnetenwatch_politician_profile']) {
      const tool = abgeordnetenwatchTools.find((t) => t.name === name);
      const res = await tool.handler({});
      // Handlers never throw — they resolve to a structured "no selector" result.
      expect(res.error || res.found === false).toBeTruthy();
    }
  });
});

describe('aggregateTally', () => {
  it('counts totals and per-faction breakdown, ignoring unknown votes', () => {
    const rows = [
      { vote: 'yes', fraction: { label: 'SPD' } },
      { vote: 'yes', fraction: { label: 'SPD' } },
      { vote: 'no', fraction: { label: 'CDU/CSU' } },
      { vote: 'abstain', fraction: { label: 'SPD' } },
      { vote: 'no_show', fraction: null },
      { vote: 'garbage', fraction: { label: 'SPD' } } // ignored
    ];
    const { total, byFraction } = aggregateTally(rows);
    expect(total).toEqual({ yes: 2, no: 1, abstain: 1, no_show: 1 });

    const spd = byFraction.find((f) => f.fraction === 'SPD');
    expect(spd).toMatchObject({ yes: 2, no: 0, abstain: 1, no_show: 0 });
    // no_show with no fraction is bucketed as 'fraktionslos'
    expect(byFraction.find((f) => f.fraction === 'fraktionslos').no_show).toBe(1);
    // sorted by cast votes (yes+no) desc → SPD (2) before CDU/CSU (1)
    expect(byFraction[0].fraction).toBe('SPD');
  });

  it('returns empty counts for no rows', () => {
    expect(aggregateTally([])).toEqual({ total: { yes: 0, no: 0, abstain: 0, no_show: 0 }, byFraction: [] });
  });
});
