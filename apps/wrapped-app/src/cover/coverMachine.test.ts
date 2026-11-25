import { CONFIRM_TIMEOUT, type CoverEffect, type CoverEvent, type CoverState, initialCoverState, reduce } from './coverMachine';
import { COVER_TIMING } from './coverMath';

/** Feeds events in order and collects every effect, like the hook does. */
function run(state: CoverState, steps: [CoverEvent, number][]) {
  const effects: CoverEffect[] = [];
  for (const [event, now] of steps) {
    const result = reduce(state, event, now);
    state = result.state;
    effects.push(...result.effects);
  }
  return { state, effects };
}

const visible = (year: number | null = 2026, muted = false): CoverEvent => ({ type: 'web.cover', visible: true, year, muted });
const gone: CoverEvent = { type: 'web.cover', visible: false, year: 2026, muted: false };
const press: CoverEvent = { type: 'press' };
const tick: CoverEvent = { type: 'tick' };
const count = (effects: CoverEffect[], effect: CoverEffect) => effects.filter(e => e === effect).length;

describe('coverMachine', () => {
  const fresh = () => initialCoverState({ reducedMotion: false });

  it('starts showing, not web-ready, without a year', () => {
    expect(fresh()).toMatchObject({ phase: { name: 'showing' }, webReady: false, year: null });
  });

  it('press before the web is ready: wipe, then wait, then exactly one story.start on the first web.cover', () => {
    let r = run(fresh(), [[tick, 0], [press, 100]]);
    expect(r.state.phase).toEqual({ name: 'exiting', since: 100 });
    expect(r.effects).not.toContain('sendStoryStart');

    r = run(r.state, [[tick, 100 + COVER_TIMING.exitDone]]);
    expect(r.state.phase.name).toBe('handingOver');
    expect(r.effects).toEqual([]);

    // The pink screen waits for the web, however long the ticks run (inside the 12 s fallback).
    r = run(r.state, [[tick, 5000], [tick, 8000]]);
    expect(r.state.phase.name).toBe('handingOver');
    expect(r.effects).toEqual([]);

    r = run(r.state, [[visible(), 9000], [visible(2026, true), 9100], [tick, 9200]]);
    expect(count(r.effects, 'sendStoryStart')).toBe(1);
    expect(r.state.phase.name).toBe('handingOver');

    // The web confirms by hiding its cover.
    r = run(r.state, [[gone, 9300]]);
    expect(r.effects).toEqual(['fadeOut']);
    expect(r.state.phase.name).toBe('hidden');
  });

  it('press after the web is ready: story.start once the wipe is done, not before', () => {
    let r = run(fresh(), [[visible(), 0], [press, 1000], [tick, 1000 + COVER_TIMING.exitDone - 1]]);
    expect(r.effects).not.toContain('sendStoryStart');
    r = run(r.state, [[tick, 1000 + COVER_TIMING.exitDone]]);
    expect(r.effects).toEqual(['sendStoryStart']);
  });

  it('double press sends one story start, one sound, one haptic', () => {
    const r = run(fresh(), [[visible(), 0], [press, 500], [press, 520], [tick, 600], [press, 700], [tick, 500 + COVER_TIMING.exitDone], [press, 3000], [tick, 3100]]);
    expect(count(r.effects, 'sendStoryStart')).toBe(1);
    expect(count(r.effects, 'playStartSound')).toBe(1);
    expect(count(r.effects, 'haptic')).toBe(1);
  });

  it('web.cover visible false while showing fades out without a wipe', () => {
    const r = run(fresh(), [[visible(), 0], [tick, 100], [gone, 200]]);
    expect(r.effects).toEqual(['fadeOut']);
    expect(r.state.phase).toEqual({ name: 'hidden' });
  });

  it('no confirmation within 3000 ms after story.start resends instead of fading out', () => {
    let r = run(fresh(), [[visible(), 0], [press, 0], [tick, COVER_TIMING.exitDone]]);
    expect(r.effects).toContain('sendStoryStart');
    r = run(r.state, [[tick, COVER_TIMING.exitDone + 2999]]);
    expect(r.effects).toEqual([]);
    r = run(r.state, [[tick, COVER_TIMING.exitDone + 3000]]);
    expect(r.effects).toEqual(['sendStoryStart']);
    expect(r.state.phase.name).toBe('handingOver');
    // The confirmation of the resend hides the cover.
    expect(run(r.state, [[gone, 6000]]).effects).toEqual(['fadeOut']);
  });

  it('no web message at all: fades out after 12 000 ms', () => {
    let r = run(fresh(), [[tick, 0], [tick, 11_999]]);
    expect(r.effects).toEqual([]);
    r = run(r.state, [[tick, 12_000]]);
    expect(r.effects).toEqual(['fadeOut']);
    expect(r.state.phase.name).toBe('hidden');
    // Once "Los geht's" was pressed, the pink screen waits longer for the web: 30 000 ms, not 12 000.
    let pressed = run(fresh(), [[tick, 0], [press, 1000], [tick, 4000], [tick, 12_000]]);
    expect(pressed.effects).not.toContain('fadeOut');
    expect(pressed.state).toMatchObject({ phase: { name: 'handingOver', storyStartSent: false } });
    pressed = run(pressed.state, [[tick, 29_999]]);
    expect(pressed.effects).toEqual([]);
    pressed = run(pressed.state, [[tick, 30_000]]);
    expect(pressed.effects).toEqual(['fadeOut']);
    expect(pressed.state.phase.name).toBe('hidden');
    // The press also holds the cover while the wipe still runs.
    expect(run(fresh(), [[tick, 0], [press, 11_000], [tick, 12_000]]).state.phase.name).toBe('exiting');
    // A web that turns up inside the longer wait still gets its story.start.
    const late = run(fresh(), [[tick, 0], [press, 1000], [tick, 4000], [visible(), 20_000]]);
    expect(count(late.effects, 'sendStoryStart')).toBe(1);
    // Once the web has spoken, the fallback is off.
    expect(run(fresh(), [[tick, 0], [visible(), 100], [tick, 20_000]]).effects).toEqual([]);
  });

  it('a slow web after the fallback never brings the cover back, it just starts its story', () => {
    const gaveUp = run(fresh(), [[tick, 0], [tick, 12_000]]);
    expect(gaveUp.state).toMatchObject({ phase: { name: 'hidden' }, gaveUp: true });
    const late = run(gaveUp.state, [[visible(), 20_000]]);
    expect(late.state.phase.name).toBe('hidden');
    expect(late.effects).toEqual(['sendStoryStart']);
    expect(late.state.gaveUp).toBe(false);
    // The confirmation changes nothing, and later reports behave normally again (restart shows the cover).
    expect(run(late.state, [[gone, 20_500]]).effects).toEqual([]);
    expect(run(late.state, [[visible(), 30_000]]).effects).toEqual(['startAssembly']);
    // A late "no cover" report is also just absorbed.
    const none = run(gaveUp.state, [[gone, 20_000]]);
    expect(none.effects).toEqual([]);
    expect(none.state.phase.name).toBe('hidden');
    // Never for a web that spoke before the timeout.
    expect(run(fresh(), [[visible(), 0], [gone, 100]]).state.gaveUp).toBe(false);
  });

  it('visible true while hidden shows the cover again and restarts the assembly', () => {
    let r = run(fresh(), [[visible(), 0], [gone, 100]]);
    expect(r.state.phase.name).toBe('hidden');
    r = run(r.state, [[visible(2026), 5000]]);
    expect(r.effects).toEqual(['startAssembly']);
    expect(r.state).toMatchObject({ phase: { name: 'showing' }, webReady: true });
    // And "Los geht's" works again, once.
    r = run(r.state, [[press, 6000], [tick, 6000 + COVER_TIMING.exitDone]]);
    expect(count(r.effects, 'sendStoryStart')).toBe(1);
  });

  it('a wipe that ran out in the background hands over on appActive', () => {
    let r = run(fresh(), [[visible(), 0], [press, 1000]]);
    // No ticks while the app is in the background.
    r = run(r.state, [[{ type: 'appActive' }, 60_000]]);
    expect(r.effects).toEqual(['sendStoryStart']);
    expect(r.state.phase).toMatchObject({ name: 'handingOver', since: 60_000 });
    // The confirmation window starts at the hand-over, not at the press.
    expect(run(r.state, [[tick, 60_100]]).effects).toEqual([]);
    expect(run(r.state, [[tick, 63_000]]).effects).toEqual(['sendStoryStart']);
  });

  it('reduced motion: press sends story.start at once', () => {
    const r = run(initialCoverState({ reducedMotion: true }), [[visible(), 0], [press, 500]]);
    expect(r.effects).toEqual(['playStartSound', 'haptic', 'sendStoryStart']);
    expect(r.state.phase).toMatchObject({ name: 'handingOver', since: 500 });
  });

  it('muted: no start sound', () => {
    const r = run(fresh(), [[visible(2026, true), 0], [press, 100]]);
    expect(r.effects).toEqual(['haptic']);
  });

  it('keeps the year the web reports; null until it does', () => {
    let r = run(fresh(), [[tick, 0]]);
    expect(r.state.year).toBeNull();
    r = run(r.state, [[visible(2026), 10]]);
    expect(r.state.year).toBe(2026);
  });
  describe('a lost story.start (web still reports its cover as visible)', () => {
    const sent = () => run(fresh(), [[visible(), 0], [press, 100], [tick, 100 + COVER_TIMING.exitDone]]);

    it('does not hide at the confirm timeout: resends once', () => {
      const s = sent();
      expect(count(s.effects, 'sendStoryStart')).toBe(1);
      const t = 100 + COVER_TIMING.exitDone;
      const r = run(s.state, [[tick, t + CONFIRM_TIMEOUT]]);
      expect(r.state.phase).toMatchObject({ name: 'handingOver', resent: true, since: t + CONFIRM_TIMEOUT });
      expect(count(r.effects, 'sendStoryStart')).toBe(1);
      expect(r.effects).not.toContain('fadeOut');
    });

    it('a second silent timeout brings the cover back instead of hiding', () => {
      const t = 100 + COVER_TIMING.exitDone;
      const r = run(sent().state, [[tick, t + CONFIRM_TIMEOUT], [tick, t + 2 * CONFIRM_TIMEOUT]]);
      expect(r.state.phase).toEqual({ name: 'showing' });
      expect(r.state.webReady).toBe(true);
      expect(r.effects).toContain('startAssembly');
      expect(r.effects).not.toContain('fadeOut');
    });

    it('the resend is answered: the web leaves its cover and the cover hides', () => {
      const t = 100 + COVER_TIMING.exitDone;
      const r = run(sent().state, [[tick, t + CONFIRM_TIMEOUT], [gone, t + CONFIRM_TIMEOUT + 200]]);
      expect(r.state.phase.name).toBe('hidden');
    });

    it('still hides at the timeout when the web has left its cover (visible: false was lost)', () => {
      const t = 100 + COVER_TIMING.exitDone;
      const r = run(fresh(), [[visible(), 0], [press, 100], [tick, t], [{ ...gone }, t + 10]]);
      expect(r.state.phase.name).toBe('hidden');
    });
  });
});
