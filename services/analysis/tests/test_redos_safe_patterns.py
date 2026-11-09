"""Linear-time replacements for two regexes CodeQL flagged as polynomial ReDoS.

Each test pins the new implementation to the exact output of the old regex
on random inputs, and checks that the adversarial input finishes quickly. The answer-detection
regex only ever sees a 600-char window, so it gets the equivalence check only.
"""

import random
import re
import time

from noun_analysis.classification.context import classify_by_preceding_context
from noun_analysis.text_utils import strip_parenthetical_content


def _old_strip(text: str) -> str:
    cleaned = re.sub(r'\([^)]+\)', '', text)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


_OLD_ANSWER = re.compile(
    r'(herr|frau)\s+(staatsminister|staatssekretär|bundesminister)[^.]*sie haben das wort'
)


def test_strip_parenthetical_matches_old_regex():
    rng = random.Random(0)
    alphabet = ['(', ')', 'a', ' ', 'b', '\n']
    for _ in range(5000):
        text = ''.join(rng.choice(alphabet) for _ in range(rng.randint(0, 30)))
        assert strip_parenthetical_content(text) == _old_strip(text), repr(text)


def test_strip_parenthetical_examples():
    assert strip_parenthetical_content('Wir (Beifall bei der SPD) handeln.') == 'Wir handeln.'
    assert strip_parenthetical_content('a () b') == 'a () b'
    assert strip_parenthetical_content('(a (b) c)') == 'c)'
    assert strip_parenthetical_content('offen ( ohne Ende') == 'offen ( ohne Ende'


def test_strip_parenthetical_is_linear_on_unclosed_parens():
    start = time.perf_counter()
    strip_parenthetical_content('(' * 200_000)
    assert time.perf_counter() - start < 1.0


def _answer_context(sentence: str) -> str | None:
    # Positioned so the 600-char window covers the whole sentence.
    return classify_by_preceding_context(sentence, len(sentence))


def test_answer_detection_matches_old_regex():
    rng = random.Random(1)
    parts = ['herr ', 'frau ', 'staatsminister ', 'bundesminister ', 'staatssekretär ',
             'sie haben das wort', '. ', 'x ', '  ']
    for _ in range(5000):
        context = ''.join(rng.choice(parts) for _ in range(rng.randint(0, 12)))
        expected_answer = bool(_OLD_ANSWER.search(context))
        got = _answer_context(context)
        if expected_answer:
            assert got == 'fragestunde_antwort', repr(context)
        elif got == 'fragestunde_antwort':
            # Only the second, bounded pattern may also produce an answer.
            assert re.search(
                r'sie haben das wort[^.]{0,50}(staatsminister|staatssekretär|bundesminister)',
                context,
            ), repr(context)

