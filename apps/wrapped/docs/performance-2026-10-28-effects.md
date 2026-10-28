# Visibility and intro performance — 28 October 2026

## Change and cause

The intro rendered 80 additional particles above the shared background. Near-slide
preloading and reading mode also allowed offscreen decorative loops to continue.
The new effects context follows the selected slide and document visibility while
keeping the existing preloading window, accessible reading contents and local
quiz/flip state. Motion controls explicitly stop repeating animations; inactive
CSS animations pause and local particle layers unmount. Intro launch timers are
cancelled on deactivation. Reduced Motion starts immediately.

## Reproduction

Compare foundation `706cf77` with this change using the frozen-lockfile nginx
Docker image. Three sequential runs per version, actual 2025 corpus, Chrome
156.0.8078.73 headless, Apple M5/arm64, 390×844 DPR3, 4× CPU slowdown, seed 12345,
5 Mbit/s download and 80 ms latency, service workers blocked. No concurrent builds
or E2E during measurement. Commands:

```
PERF_URL=http://127.0.0.1:4176 PERF_LABEL=visible-effects-1 PERF_DOWNLOAD_MBPS=5 PERF_LATENCY_MS=80 node apps/wrapped/scripts/audit-performance.cjs
```

Repeat with labels 2 and 3. The audit prints the private directory containing raw
JSON and screenshots. Foundation and effects JSON are retained with the rollout
artifacts. These are rAF timing samples, not measurements of physically presented
frames or proof about a phone GPU.

## Results

Ranges below cover all three runs. Animation counts are end-of-sample snapshots,
including finite transitions and the global background, not just endless loops.

| Scenario | Running animations before → after | After p95 | After maximum |
| --- | --- | --- | --- |
| Intro idle | 121 → 41 | 16.7–16.8 ms | 16.8 ms |
| Intro Start | 128 → 52–53 | 16.7–16.8 ms | 16.8–50.1 ms |
| Topics | 59 → 54–57 | 16.7–16.8 ms | 16.8–33.3 ms |
| Speeches chart | 69 → 65 | 16.7–16.8 ms | 16.8 ms |
| Tone | 41 → 40 | 16.7–16.8 ms | 16.8 ms |

Intro offscreen snapshots fell from 85 after Start to 7–10. This metric can include
finite entrances or particles in the global layer; it is not equivalent to the
structural test for offscreen endless decoration. That test passes in reading
mode across Chromium, WebKit and Firefox. No story Long Tasks occurred. One of
three runs had a 50.1 ms Start gap and 33.3 ms Topics gap; the other two did not.
The baseline had one 33.3 ms Start gap. This demonstrates less animation work,
without claiming every frame improved or every gap was eliminated.

The search bottleneck remains: 9,310,171 gzip bytes / 24,026,173 decoded bytes,
about 14.9 seconds body transfer. The cold route had one 62–78 ms Long Task per
run, with 50–66.7 ms maximum frame gaps. Warm typing had no Long Tasks but isolated
33 ms gaps in two runs. Pagination stayed near 16.7 ms. Search indexing and
trace-based route/paint work remain the next priorities. The cold-search and
zero-Long-Task targets are not yet met.

## Regression coverage and limits

148 web unit tests, TypeScript, ESLint, production build and bundle budget pass.
All 96 browser cases pass against the nginx image: 32 each in Chromium, WebKit
and Firefox, covering reading mode, intro interruption/revisit, Reduced Motion,
keyboard/focus, quiz/flip persistence, tall layouts, search and edition isolation.
Initial JavaScript is 854.6 KiB and CSS 121.4 KiB, within the existing budgets.

Physical iPhone/Safari and mid-range Android acceptance is still outstanding.
Desktop CPU emulation does not emulate their GPU or memory limits. The initial
30–40-animation budget was exploratory: intro idle is 41, and transition snapshots
are higher. Frame timing and verified inactive loops take precedence over forcing
an arbitrary counter down.

## Production data correction

The first production reading-mode check on `8978ee8` found four remaining
endless animations in `MoinSlide/WavingCard`. Their conditional `repeat` values
had escaped the initial conversion, and the shared browser fixture had no Moin
speakers. The original green fixture test did not cover those populated cards.
The functional production smoke (search, navigation, preview protection, MCP/DIP/
Qdrant/spaCy) passed independently of this animation failure.

WavingCard now uses the same visibility-controlled Motion component for both
full and compact cards and their waving emoji. The reading-mode regression
fixture explicitly includes four Moin speakers and verifies that they rendered.
Against the original image this enhanced test fails with five running offscreen
loops in every browser; the correction must bring that count to zero. This is a
required acceptance gate before marking the visibility package complete.

The same review found 25 confetti loops on an inactive personal Wrapped share
slide. That component also now uses the shared visibility boundary. A separate
personal-story reading-mode regression checks that no share animation runs while
another slide is selected; it fails against the prior image. This extends the
correction beyond the annual story's data-dependent Moin case.
