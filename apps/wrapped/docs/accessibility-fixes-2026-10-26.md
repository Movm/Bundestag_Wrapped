# Accessibility and responsive layout fixes

This change implements the 26 October audit against the current edition-based web app. The audit used an older local branch; the implementation preserves annual routes, edition-scoped quiz/progress state and share output on current main.

## Behavior changes

- Both stories use native vertical scrolling with sections that can grow, plus Previous/Next controls and a section indicator. Quiz participation is optional. Only the active section participates in focus and the accessibility tree; the explicit reading mode exposes all sections in order.
- Intro/info slides no longer advance after four seconds. Quiz feedback and explanations remain inline until the user chooses to continue. Spatial navigation is immediate, and Motion respects the system motion preference.
- Shared native modal dialogs provide initial focus, background inertness, Tab/Shift+Tab containment, Escape and return focus for navigation, speech details and sharing.
- Flip-card details work with Enter, Space and a single tap, expose expanded state and hide the inactive face from assistive technology. Dense bubble layouts become flowing cards at narrow widths, short heights and with reduced motion. Lower-ranked topics remain in a static readable list.
- Search tabs support arrows and Home/End; results have labelled panels. Clear buttons have larger targets, populated search controls wrap, member results announce their count and can grow in normal document flow.
- The word-search tab adapts validated party-grouped edition assets into a searchable word index and keeps tab controls mounted while data loads. Speaker progress restores once instead of repeatedly jumping back to a previously saved section.
- Readable badge/card colors are separate from party/chart colors. Muted result text and the documentation contrasts identified in the audit are raised. The documentation heading wraps at 320px.
- Main story gains a skip link and main landmark. Card headings no longer skip from h2 to h4. Fixed story controls respect safe-area insets, inputs permit zoom and use at least 16px text, and the PWA supports both orientations.

## Regression checks

`pnpm --filter bundestag-wrapped test:a11y` runs the new Playwright suite. It exercises keyboard focus, persistent reading/quiz feedback, flip controls, native dialogs, tab semantics, result announcements, narrow search/docs and all available fixture slides at 320×568, 390×844, 844×390, 768×1024 and 1440×900. It also audits populated search and documentation with axe WCAG 2 A/AA and WCAG 2.2 AA rules.

`pnpm --filter bundestag-wrapped test:e2e` retains the existing edition, journey, persistence, profile, share and axe coverage. Playwright projects cover Chromium, Firefox and WebKit.

## Remaining device acceptance

Browser emulation and WebKit do not replace physical iPhone/Safari or Android/Chrome testing. Before claiming full device acceptance, verify software-keyboard behavior, dynamic URL bars, safe areas, enlarged OS text, installed PWA orientation, native share sheets, VoiceOver/TalkBack and desktop NVDA. Actual 200% text/400% browser zoom and forced-color interaction checks also remain separate manual acceptance items. This change is not a WCAG conformance certification.
