from noun_analysis.stopwords import is_content_word
from noun_analysis.wrapped.wrapped_loader import read_word_frequency_csv


def test_words_that_look_like_missing_values_stay_strings(tmp_path):
    csv_path = tmp_path / "nouns.csv"
    csv_path.write_text("word,total,SPD\nnull,12,3\nNA,4,1\nnan,2,\nKlima,40,\n", encoding="utf-8")

    df = read_word_frequency_csv(csv_path)

    assert df["word"].tolist() == ["null", "NA", "nan", "Klima"]
    assert all(isinstance(word, str) for word in df["word"])
    # Empty numeric cells are still missing, and the column stays numeric.
    assert df["SPD"].isna().tolist() == [False, False, True, True]
    assert df["total"].dtype.kind == "i"
    # The filter that crashed the weekly refresh accepts every row.
    assert df["word"].map(is_content_word).dtype == bool
