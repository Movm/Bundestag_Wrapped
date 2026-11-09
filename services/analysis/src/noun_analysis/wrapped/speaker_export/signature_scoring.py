"""Log-odds scoring for signature words (Monroe, Colaresi & Quinn 2008).

Compares a speaker's use of a term with a reference group (party or Bundestag,
speaker excluded) using the "informative Dirichlet prior" log-odds ratio. The
prior keeps every count strictly positive, so a reference count of zero needs
no special case, and the z-score (delta / standard error) ranks a word by how
reliable the difference is, not by how large a ratio a tiny denominator allows.

The prior is deliberately moderate (see PRIOR_STRENGTH).
Reliability therefore comes from the z-score and the displayed ratio is the
95% lower confidence bound of the rate ratio ("at least N times").
"""

import math
from typing import NamedTuple

# Total pseudo-count of the prior spread over the vocabulary. Too small and a
# term with a zero reference count gets almost no prior mass, so its variance
# term 1/alpha explodes and it can never be significant; too large and the
# prior swamps the speaker's own few thousand tokens. A single speaker's
# typical (4+ letter) token total is 2k-15k; 5000 sits in between.
PRIOR_STRENGTH = 5000.0

# |z| >= 1.96 is the two-sided 95% threshold.
MIN_Z_SCORE = 1.96


class TermScore(NamedTuple):
    z_score: float
    ratio: float  # ratio of prior-smoothed relative frequencies (point estimate)
    ratio_low: float  # 95% lower confidence bound of that ratio, for the "N×" label


def log_odds_score(
    speaker_count: int,
    speaker_total: int,
    reference_count: int,
    reference_total: int,
    corpus_count: int,
    corpus_total: int,
    prior_strength: float = PRIOR_STRENGTH,
) -> TermScore:
    """Score one term for the speaker against a reference group.

    corpus_count/corpus_total define the prior (the term's overall rate); the
    term's prior mass is ``prior_strength * corpus_count / corpus_total`` and
    must be > 0, which holds whenever the speaker uses the term at all.
    """
    alpha = prior_strength * corpus_count / corpus_total
    speaker_hit = speaker_count + alpha
    reference_hit = reference_count + alpha
    speaker_miss = speaker_total + prior_strength - speaker_hit
    reference_miss = reference_total + prior_strength - reference_hit

    delta = math.log(speaker_hit / speaker_miss) - math.log(reference_hit / reference_miss)
    variance = 1.0 / speaker_hit + 1.0 / reference_hit
    ratio = (speaker_hit / (speaker_total + prior_strength)) / (
        reference_hit / (reference_total + prior_strength)
    )
    standard_error = math.sqrt(variance)
    return TermScore(
        delta / standard_error,
        ratio,
        math.exp(delta - MIN_Z_SCORE * standard_error),
    )
