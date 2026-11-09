"""Signature word and adjective analysis mixin."""

from collections import Counter
from typing import TYPE_CHECKING

from .signature_scoring import MIN_Z_SCORE, log_odds_score

if TYPE_CHECKING:
    from collections.abc import Set


class SignatureWordsMixin:
    """Mixin for signature word and adjective analysis.

    Requires these instance attributes from the main class:
    - _speaker_word_counts: dict[str, Counter]
    - _speaker_total_words: dict[str, int]
    - _speaker_adj_counts: dict[str, Counter]
    - _party_word_counts: dict[str, Counter]
    - _party_total_words: dict[str, int]
    - _party_adj_counts: dict[str, Counter]
    - _bundestag_word_counts: Counter
    - _bundestag_adj_counts: Counter
    - _bundestag_total_words: int
    - _stopwords: Set[str]
    """

    _speaker_word_counts: dict[str, Counter]
    _speaker_total_words: dict[str, int]
    _speaker_adj_counts: dict[str, Counter]
    _party_word_counts: dict[str, Counter]
    _party_total_words: dict[str, int]
    _party_adj_counts: dict[str, Counter]
    _bundestag_word_counts: Counter
    _bundestag_adj_counts: Counter
    _bundestag_total_words: int
    _stopwords: "Set[str]"

    def _get_speaker_signature_words(self, speaker: str, party: str) -> list[dict]:
        """Find words this speaker uses more than their party average.

        Uses pre-computed word counts for O(1) lookup instead of re-tokenizing.
        Returns words with both party and Bundestag comparison ratios.
        """
        speaker_word_counts = self._speaker_word_counts.get(speaker)
        speaker_total_words = self._speaker_total_words.get(speaker, 0)

        if not speaker_word_counts or speaker_total_words == 0:
            return []

        # Get party counts (excluding this speaker) via subtraction
        party_word_counts = self._party_word_counts.get(party, Counter()) - speaker_word_counts
        party_total_words = self._party_total_words.get(party, 0) - speaker_total_words

        # Get Bundestag counts (excluding this speaker) via subtraction
        bundestag_word_counts = self._bundestag_word_counts - speaker_word_counts
        bundestag_total_words = self._bundestag_total_words - speaker_total_words

        if party_total_words <= 0 or bundestag_total_words <= 0:
            return []

        # Find signature words (high speaker ratio vs party)
        signature_words = []
        for word, speaker_count in speaker_word_counts.items():
            if word in self._stopwords or len(word) < 5:
                continue
            if speaker_count < 5:  # Minimum count
                continue

            party_count = party_word_counts.get(word, 0)
            bundestag_count = bundestag_word_counts.get(word, 0)
            corpus_count = self._bundestag_word_counts.get(word, 0)
            vs_party = log_odds_score(
                speaker_count, speaker_total_words, party_count, party_total_words,
                corpus_count, self._bundestag_total_words,
            )
            vs_bundestag = log_odds_score(
                speaker_count, speaker_total_words, bundestag_count, bundestag_total_words,
                corpus_count, self._bundestag_total_words,
            )

            if vs_party.z_score >= MIN_Z_SCORE and vs_party.ratio_low >= 2.0:
                signature_words.append({
                    'word': word,
                    'count': speaker_count,
                    'ratioParty': round(vs_party.ratio_low, 1),
                    'ratioBundestag': round(max(vs_bundestag.ratio_low, 1.0), 1),
                    'zScore': round(vs_party.z_score, 2),
                })

        # Rank by significance (z-score), not by raw ratio, and take top 5
        signature_words.sort(key=lambda x: x['zScore'], reverse=True)
        return signature_words[:5]

    def _get_speaker_signature_adjectives(self, speaker: str, party: str) -> list[dict]:
        """Find adjectives this speaker uses more than their party and Bundestag average.

        Uses pre-computed adjective counts for O(1) lookup instead of re-tokenizing.
        Returns adjectives with both party and Bundestag comparison ratios.
        """
        speaker_adj_counts = self._speaker_adj_counts.get(speaker)
        speaker_total_words = self._speaker_total_words.get(speaker, 0)

        if not speaker_adj_counts or speaker_total_words == 0:
            return []

        # Get party counts (excluding this speaker) via subtraction
        party_adj_counts = self._party_adj_counts.get(party, Counter()) - speaker_adj_counts
        party_total_words = self._party_total_words.get(party, 0) - speaker_total_words

        # Get Bundestag counts (excluding this speaker) via subtraction
        bundestag_adj_counts = self._bundestag_adj_counts - speaker_adj_counts
        bundestag_total_words = self._bundestag_total_words - speaker_total_words

        if party_total_words <= 0 or bundestag_total_words <= 0:
            return []

        # Find signature adjectives (high speaker ratio vs party)
        signature_adjectives = []
        for adj, speaker_count in speaker_adj_counts.items():
            if speaker_count < 3:  # Minimum count
                continue

            party_count = party_adj_counts.get(adj, 0)
            bundestag_count = bundestag_adj_counts.get(adj, 0)
            corpus_count = self._bundestag_adj_counts.get(adj, 0)
            vs_party = log_odds_score(
                speaker_count, speaker_total_words, party_count, party_total_words,
                corpus_count, self._bundestag_total_words,
            )
            vs_bundestag = log_odds_score(
                speaker_count, speaker_total_words, bundestag_count, bundestag_total_words,
                corpus_count, self._bundestag_total_words,
            )

            if vs_party.z_score >= MIN_Z_SCORE and vs_party.ratio_low >= 2.0:
                signature_adjectives.append({
                    'word': adj,
                    'count': speaker_count,
                    'ratioParty': round(vs_party.ratio_low, 1),
                    'ratioBundestag': round(max(vs_bundestag.ratio_low, 1.0), 1),
                    'zScore': round(vs_party.z_score, 2),
                })

        # Rank by significance (z-score), not by raw ratio, and take top 5
        signature_adjectives.sort(key=lambda x: x['zScore'], reverse=True)
        return signature_adjectives[:5]
