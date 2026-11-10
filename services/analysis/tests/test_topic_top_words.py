from noun_analysis.wrapped.export import ExportMixin


def test_topic_analysis_lists_the_words_that_carry_each_topic():
    data = ExportMixin.__new__(ExportMixin)
    data.all_speeches = [
        {"party": "A", "text": "Wachstum, Wachstum und Investitionen. Die Konjunktur lahmt."},
        {"party": "B", "text": "Mehr Investitionen in Wachstum."},
    ]
    words = data._build_topic_analysis_json()["topWords"]["wirtschaft"]
    assert words[0] == {"word": "wachstum", "count": 3}
    assert {"word": "konjunktur", "count": 1} in words
    assert len(words) <= 8


def test_topic_analysis_names_the_mps_who_talk_about_a_topic_most():
    data = ExportMixin.__new__(ExportMixin)
    filler = " ".join(["haus"] * 3000)
    data.all_speeches = [
        {"party": "A", "speaker": "Viel Wirtschaft", "text": filler + " wachstum wachstum wachstum konjunktur"},
        {"party": "B", "speaker": "Wenig Wirtschaft", "text": filler + " wachstum"},
        {"party": "B", "speaker": "Kurz", "text": "wachstum wachstum"},
    ]
    speakers = data._build_topic_analysis_json()["topSpeakers"]["wirtschaft"]
    assert [item["name"] for item in speakers] == ["Viel Wirtschaft", "Wenig Wirtschaft"]
    assert speakers[0]["vsAverage"] > 1 > speakers[1]["vsAverage"]


def test_government_speeches_do_not_rank_as_mps():
    data = ExportMixin.__new__(ExportMixin)
    filler = " ".join(["haus"] * 3000)
    data.all_speeches = [
        {"party": "A", "speaker": "Ministerin", "is_government": True, "text": filler + " wachstum wachstum"},
        {"party": "B", "speaker": "MdB", "text": filler + " wachstum"},
    ]
    names = [item["name"] for item in data._build_topic_analysis_json()["topSpeakers"]["wirtschaft"]]
    assert names == ["MdB"]
