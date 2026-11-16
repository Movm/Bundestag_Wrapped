import pytest

from noun_analysis.edition.gender_check import PARTIES, build_gender_check
from noun_analysis.wrapped.gender import GenderDetector

# Names the detector knows: Anna/Maria are female, Peter/Hans male.
FEMALE = [("Anna", f"Fa{i}") for i in range(30)]
MALE = [("Peter", f"Ma{i}") for i in range(30)]
CONFIG = {"word": "Männer", "topic": "klima"}


def _speech(first, last, party, text, protocol, category="rede"):
    return {"speaker": f"{first} {last}", "first_name": first, "last_name": last, "party": party, "text": text,
            "protocolId": protocol, "protocolDate": "2026-03-01", "speechPosition": "1", "category": category,
            "type": "rede", "words": len(text.split())}


def _speeches(female_text, male_text, female_extra="", male_extra=""):
    out = []
    n = 0
    for party in PARTIES:
        for i in range(30):
            n += 1
            out.append(_speech(*FEMALE[i], party, female_text + " " + female_extra, f"pf{n}"))
            out.append(_speech(*MALE[i], party, male_text + " " + male_extra, f"pm{n}"))
    return out


FILLER = "heute sprechen wir über viele Dinge hier im Parlament. "


def test_duels_standardise_and_report_consistency():
    # Women say "Männer" 3x per speech, men 1x.
    female = FILLER + "Männer Männer Männer klimaschutz. Pflegekräfte Pflegekräfte Pflegekräfte"
    male = FILLER + "Männer klimaschutz klimawandel. Verteidigung Verteidigung Verteidigung"
    result = build_gender_check(_speeches(female, male) + [_speech("Anna", "Fa0", "SPD", "Männer " * 50, "px", category="wortbeitrag")], CONFIG, set())
    assert result["speeches"] == {"male": 150, "female": 150}  # wortbeitrag is not counted
    duel = result["wordDuel"]
    assert duel["answer"] == "female" and duel["term"] == "Männer"
    assert duel["split"]["male"] + duel["split"]["female"] == 100 and 72 <= duel["split"]["female"] <= 76
    assert duel["consistentParties"] == 5 and duel["totalParties"] == 5
    assert [row["party"] for row in duel["parties"]] == list(PARTIES)
    assert duel["topSpeaker"]["count"] == 3
    assert result["topicDuel"]["answer"] == "male" and result["topicDuel"]["term"] == "klima"
    assert result["topics"][-1]["topic"] == "klima" or result["topics"][-1]["side"] == "male"


def test_party_mix_is_standardised():
    # Women say "Männer" twice per speech everywhere, men once, so the standardised factor is 2.0
    # whatever the party mix. Women are mostly in the long-speech SPD, men mostly in the short-speech AfD,
    # so a pooled rate would give a different answer.
    speeches = []
    for i in range(30):
        speeches.append(_speech(*FEMALE[i], "SPD", FILLER * 5 + "Männer Männer klimaschutz", f"a{i}"))
        speeches.append(_speech(*MALE[i], "AfD", FILLER + "Männer klimaschutz", f"d{i}"))
    for i in range(5):
        speeches.append(_speech(*MALE[i], "SPD", FILLER * 5 + "Männer klimaschutz", f"b{i}"))
        speeches.append(_speech(*FEMALE[i], "AfD", FILLER + "Männer Männer klimaschutz", f"c{i}"))
    for party in ("CDU/CSU", "GRÜNE", "DIE LINKE"):
        for i in range(30):
            speeches.append(_speech(*FEMALE[i], party, FILLER + "Männer Männer klimaschutz", f"{party}f{i}"))
            speeches.append(_speech(*MALE[i], party, FILLER + "Männer klimaschutz klimaschutz", f"{party}m{i}"))
    result = build_gender_check(speeches, CONFIG, set())
    duel = result["wordDuel"]
    assert duel["answer"] == "female" and 66 <= duel["split"]["female"] <= 68  # 2:1, whatever the party mix; pooled would be ~58
    assert duel["consistentParties"] == 5


def test_words_are_nouns_without_stopwords_or_address():
    female = FILLER + "Gewalt Gewalt Damen Damen Frauen Stopper Männer Männer klimaschutz klimaschutz"
    male = FILLER + "Brüssel Brüssel Damen Damen Frauen Stopper laufen laufen laufen Männer klimaschutz"
    speeches = []
    for party in PARTIES:
        for i in range(30):
            # One rare counter-example per party keeps both rates above zero.
            speeches.append(_speech(*FEMALE[i], party, female + (" Brüssel" if i == 0 else ""), f"{party}f{i}"))
            speeches.append(_speech(*MALE[i], party, male + (" Gewalt" if i == 0 else ""), f"{party}m{i}"))
    result = build_gender_check(speeches, CONFIG, {"stopper"})
    female_words = [w["word"] for w in result["words"]["female"]]
    male_words = [w["word"] for w in result["words"]["male"]]
    assert "Gewalt" in female_words and "Brüssel" in male_words
    for forbidden in ("Damen", "Stopper", "laufen", "Männer"):
        assert forbidden not in female_words + male_words
    gewalt = next(w for w in result["words"]["female"] if w["word"] == "Gewalt")
    assert gewalt["count"] == 5 * (30 * 2 + 1)
    assert gewalt["consistentParties"] == 5


def test_none_when_a_duel_is_not_consistent():
    # In four of five parties men say "Männer" more, in one women do more, but the pooled
    # result still favours women: consistentParties would be 1 -> unusable.
    speeches = []
    for party in PARTIES:
        heavy = party == "SPD"
        for i in range(30):
            speeches.append(_speech(*FEMALE[i], party, FILLER + ("Männer " * (9 if heavy else 1)) + "klimaschutz", f"{party}f{i}"))
            speeches.append(_speech(*MALE[i], party, FILLER + ("Männer " * (1 if heavy else 2)) + "klimaschutz", f"{party}m{i}"))
    assert build_gender_check(speeches, CONFIG, set()) is None


def test_detector_knows_the_fixture_names():
    detector = GenderDetector()
    assert detector.detect_speaker("Anna", "Fa0").gender == "female"
    assert detector.detect_speaker("Peter", "Ma0").gender == "male"
    with pytest.raises(ValueError):
        build_gender_check([], {"word": "Männer", "topic": "gibtsnicht"}, set())
