import pandas as pd

from noun_analysis.wrapped.queries import WrappedDataQueries


def test_signature_words_exclude_generic_political_filler_and_party_self_reference():
    data = WrappedDataQueries()
    data.metadata = {"parties": ["Union", "Other"]}
    data.signature_stopwords = {"schritt", "herausforderung"}
    data.exclude_multiword_signature_terms = True
    data.word_frequencies = {
        "nouns": pd.DataFrame([
            {"word": "schritt", "Union_count": 100, "Union_per1000": 4.0, "Other_count": 10, "Other_per1000": 1.0},
            {"word": "herausforderung", "Union_count": 90, "Union_per1000": 3.8, "Other_count": 10, "Other_per1000": 1.0},
            {"word": "alternative", "Union_count": 80, "Union_per1000": 3.6, "Other_count": 10, "Other_per1000": 1.0},
            {"word": "max muster", "Union_count": 75, "Union_per1000": 3.5, "Other_count": 10, "Other_per1000": 1.0},
            {"word": "wachstum", "Union_count": 70, "Union_per1000": 3.4, "Other_count": 10, "Other_per1000": 1.0},
            {"word": "marktwirtschaft", "Union_count": 60, "Union_per1000": 3.2, "Other_count": 10, "Other_per1000": 1.0},
        ]),
    }

    assert [word for word, _ratio in data.get_distinctive_words("Union", top_n=5)] == [
        "wachstum",
        "marktwirtschaft",
    ]
