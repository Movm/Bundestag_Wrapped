# Wrapped design system

Flat colour fields, huge uppercase type, geometric shapes and short springy entrances. The system targets WCAG 2.2 AA and 60 fps.
Everything lives in `src/design-system/`. A slide built from these parts gets colour, contrast, motion and responsiveness without per-slide decisions.

## Surfaces: a slide never picks its own background

`surfaces.ts` maps a slide id to a role, and the role to a surface:

| role | id pattern | surface |
|---|---|---|
| cover | `intro`, `finale` | ink |
| section | `intro-*` | deep |
| quiz | `quiz-*` (also edition-defined quizzes) | violet |
| info | `info-*` | pink |
| reveal | `reveal-*`, `chart-*`, everything else | ink |
| share | `share` | pink |

`SlideSection` writes `data-surface` on the section. Inside it, use **role colours only**:

| utility | meaning | contrast |
|---|---|---|
| `text-on` / `bg-surface` | text / background of the surface | ≥ 4.5:1 |
| `text-on-muted` | secondary text | ≥ 4.5:1 |
| `text-on-accent` | accent for text of any size | ≥ 4.5:1 |
| `text-display-accent` (`<Mark>`) | accent for large text only (≥ 24 px) | ≥ 3:1 |
| `bg-contrast text-on-contrast` | filled controls (buttons, pills) | ≥ 4.5:1 |
| `bg-track` | inactive marks (progress, rails) | ≥ 3:1 |

Brand colours (`bg-wr-pink`, `text-wr-ink`, …) are only for fixed-colour pieces such as chips and tiles, which bring their own text colour.
**Never place pink text on violet (1.8:1).**

A `<Block tone="white|violet|pink|card|ink">` re-scopes the roles, so content inside a white card automatically uses dark text.

Party colours: `getPartyTone(party, 'light' | 'dark')` returns a colour that stays readable at ≥ 4.5:1. The values are pinned in `lib/party-tone.test.ts`. Do not use `PARTY_COLORS` for text.

## Building blocks

- `Slide` is the frame of every slide: gutters, max-width 80rem, vertical centring, an optional `footer` row (note left, action right) and `shapes`. It staggers the entrance of its direct `motion` children.
- `Enter`: wraps any child in an entrance (`rise`, `slide`, `stamp`, `pop`, `grow`, `fade`).
- Type:
  - `Display`: `hero|xl|lg|md|sm`, `face="heading|wide"`, uppercase headline.
  - `Mark`: highlighted word. `<Mark block>` gives an inverted plate.
  - `Eyebrow`: pill label.
  - `Lead`: body copy.
  - `Note`: footnote. Add `ds-note--plate` when it may sit on shapes.
  - `BigNumber`.
  - `.ds-statement`: the big sentence on info and section slides.
- `ActionButton`: pill button, `contrast` or `outline`.
- Data:
  - `RankCard`: stair-stepped rank cards with `step` 0–3.
  - `Delta`: a ▲/▼ badge with spoken text.
  - `DivergingBars`: above or below average, rendered as a real table.
  - `ChipCloud`: word stickers.
  - `Block`: the only card.
- `Shapes`: decoration presets (`cover`, `orbit`, `band`, `ring`, `corner`). Shapes only sit at the edges and are aria-hidden.
- `ProgressSegments`: at most 10 segments. The fill moves with transform, and the live region reads "Folie X von Y".

## Quizzes: one engine, many layouts

`quiz/engine.ts` (`useQuizEngine`) owns state, sound, scoring and the announced result ("… Richtige Antwort: X").
Layouts in `quiz/layouts/` only render it. They are registered in `quiz/registry.tsx` together with their constraints (`fits`).

`<Quiz>` picks the layout:
1. The explicit `layout` prop, if it fits the options.
2. Otherwise a deterministic rotation over the layouts that fit, seeded by the slide id, so neighbouring quizzes look different.
3. `tiles` fits everything and is the fallback.

Every answer is a `<QuizChoice>`:
- It is a native button.
- After answering it gets `aria-disabled` and keeps focus.
- The status is written as a word ("richtig" / "falsch"), not only shown as a colour.
- The result card is a polite status region. It never moves focus and never opens a modal.

To add a layout:
1. Write the component.
2. Add it to `QUIZ_LAYOUTS` and to the registry, with `fits`.
3. Add a case to `quiz/layouts.test.ts`.

## Motion rules (60 fps)

- Animate only `opacity` and `transform`. Bars use `scaleX`, never `width`.
- Never animate `width`, `height`, `top`/`left`, `filter`, `box-shadow` or `backdrop-filter`. Don't use infinite loops.
- Entrances run once per slide visit (`IN_VIEW`). The shell's `MotionConfig reducedMotion="user"` removes the transforms for people who ask for reduced motion.

## Responsiveness

- Sizes use `clamp(rem, rem + min(vw, vh), rem)`. Text zoom works, and landscape phones don't blow up the type.
- Grids use `repeat(auto-fit, minmax(min(100%, Xrem), 1fr))` or collapse at `30rem` / `40rem`.
- Long German words hyphenate (`hyphens: auto` under `lang="de"`). The cover wordmark is excluded.
- Check every slide at 320×568, 390×844, 844×390, 768×1024, 1440×900 and 1920×1080 with `e2e/responsive.spec.ts`. That spec fails on horizontal overflow and clipped text.

## Fonts

Fonts are tokens: `--font-heading` (Noto Sans), `--font-sans` (Roboto) and `--font-wide` (Archivo, expanded, used for numbers, answers and labels). All three are self-hosted in `public/fonts`. To swap a family, change the token only.
