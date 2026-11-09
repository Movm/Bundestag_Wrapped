"""Tests for log-odds signature word scoring."""

import math
from collections import Counter
from types import SimpleNamespace

from noun_analysis.wrapped.speaker_export.signature_scoring import (
    MIN_Z_SCORE,
    log_odds_score,
)
from noun_analysis.wrapped.speaker_export.signatures import SignatureWordsMixin


def test_hand_computed_value():
    # prior_strength=100, corpus rate 1% -> alpha=1.
    # speaker: hit=10+1=11, miss=1000+100-11=1089
    # reference: hit=0+1=1, miss=10000+100-1=10099
    score = log_odds_score(10, 1000, 0, 10000, 100, 10000, prior_strength=100.0)
    delta = math.log(11 / 1089) - math.log(1 / 10099)
    assert math.isclose(score.z_score, delta / math.sqrt(1 / 11 + 1 / 1), rel_tol=1e-12)
    assert math.isclose(score.ratio, (11 / 1100) / (1 / 10100), rel_tol=1e-12)
    se = math.sqrt(1 / 11 + 1 / 1)
    assert math.isclose(score.ratio_low, math.exp(delta - 1.96 * se), rel_tol=1e-12)


def test_zero_reference_count_needs_no_special_case():
    # Word used only by this speaker in the whole corpus: finite, and not
    # significant (the prior mass is tiny, so the evidence is weak). The old
    # code emitted speaker_freq * 10 here, a per-mille frequency, not a ratio.
    score = log_odds_score(5, 3000, 0, 150000, 5, 5_000_000)
    assert math.isfinite(score.z_score)
    assert score.z_score < MIN_Z_SCORE

    # Same zero reference count, but the word exists elsewhere in the corpus:
    # now it is a clear signature word.
    seen_elsewhere = log_odds_score(20, 3000, 0, 150000, 200, 5_000_000)
    assert seen_elsewhere.z_score > MIN_Z_SCORE
    assert seen_elsewhere.ratio_low > 2


def test_rare_one_off_word_does_not_outrank_frequent_distinctive_word():
    # Word A: 5 uses by the speaker, party rest never uses it (the old artefact).
    rare = log_odds_score(5, 3000, 0, 150000, 5, 5_000_000)
    # Word B: 60 uses by the speaker, 5x the party rate (party: 360 in 150k).
    frequent = log_odds_score(60, 3000, 360, 150000, 420, 5_000_000)
    assert frequent.z_score > rare.z_score
    assert frequent.z_score > MIN_Z_SCORE


def test_single_party_mention_no_longer_explodes_ratio():
    # Old: 5/3000 vs 1/150000 -> 250x. The displayed figure is now a lower
    # bound, well below the point estimate, and the word ranks below a
    # frequent, genuinely distinctive one.
    score = log_odds_score(5, 3000, 1, 150000, 6, 5_000_000)
    assert score.ratio_low < score.ratio / 5
    assert score.z_score < log_odds_score(60, 3000, 360, 150000, 420, 5_000_000).z_score


def test_equal_rates_give_zero_z():
    score = log_odds_score(10, 1000, 100, 10000, 110, 11000)
    assert abs(score.z_score) < 1e-9
    assert math.isclose(score.ratio, 1.0, rel_tol=1e-9)


class _Exporter(SignatureWordsMixin):
    def __init__(self):
        self._stopwords = set()
        self._speaker_word_counts = {'s': Counter({'einmalig': 5, 'klimaschutz': 60})}
        self._speaker_total_words = {'s': 3000}
        self._speaker_adj_counts = {'s': Counter()}
        self._party_word_counts = {
            'P': Counter({'einmalig': 5, 'klimaschutz': 60 + 360, 'haushalt': 5000})
        }
        self._party_total_words = {'P': 153000}
        self._party_adj_counts = {'P': Counter()}
        self._bundestag_word_counts = Counter({'einmalig': 5, 'klimaschutz': 420, 'haushalt': 9000})
        self._bundestag_total_words = 5_000_000
        self._bundestag_adj_counts = Counter()


def test_mixin_ranks_frequent_distinctive_word_first_and_keeps_fields():
    rows = _Exporter()._get_speaker_signature_words('s', 'P')
    words = [r['word'] for r in rows]
    assert words[0] == 'klimaschutz'
    assert set(rows[0]) == {'word', 'count', 'ratioParty', 'ratioBundestag', 'zScore'}
    assert rows[0]['ratioParty'] < 10
