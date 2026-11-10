# Edition-specific quiz configuration

`content.json` may optionally contain a versioned `quiz` object. Its `groups`
array is the sole source of truth for which quiz groups are active and in which
order they appear. Omitting it preserves the data-derived legacy story exactly,
which is how the frozen 2025 edition continues to work.

```json
{
  "editionId": "2026-test",
  "year": 2026,
  "quiz": {
    "version": 1,
    "groups": [
      { "id": "quiz-drama" },
      { "id": "quiz-topics", "text": { "question": "Welche Frage soll hier stehen?" } },
      {
        "id": "quiz-bonus",
        "question": {
          "id": "quiz-bonus",
          "type": "prediction",
          "question": "Welche Testantwort ist richtig?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "A",
          "explanation": "Beispiel- und keine Produktionsfrage."
        }
      }
    ]
  }
}
```

The example hides every group not listed, swaps the former topics and drama
groups, overrides the topics text, and adds a new question using the existing
`prediction` format. A configured question replaces the generated question for
the same group; `text.question` and `text.explanation` change only copy. Group
and question IDs must match, be unique, start with `quiz-`, and have distinct
options containing the correct answer. Pass the quiz object (not the enclosing
`content.json`) to `generate-edition --quiz-config path/to/quiz.json`; it is
validated and checksummed along with the immutable edition artifacts.

## Choosing a quiz layout

Every group may pin how its quiz looks via `text.layout` (or `question.layout` for a fully custom question):
`stack`, `tiles`, `fan`, `gap`, `quadrants`, `stickers` or `swipe`. `gap` also needs `text.gapSentence`, a sentence
with `{answer}` where the answer goes, e.g. `"Platz 1 ist jetzt {answer}."`. Without a layout, or when the pinned one
does not fit the options, the design system rotates through the fitting layouts (see `docs/design-system.md`).
