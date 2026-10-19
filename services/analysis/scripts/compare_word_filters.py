"""Compare word selection on the exported index; requires pandas, no spaCy model.

The index is a subset of the original noun CSV. Signature results therefore
illustrate the filter effect on this snapshot, not a complete analysis rerun.
"""
import json
from pathlib import Path
import sys
import types

import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / 'services/analysis/src/noun_analysis'
# Load only the query mixin and shared constants, avoiding NLP/API startup imports.
for name, path in [('word_comparison', SOURCE), ('word_comparison.wrapped', SOURCE / 'wrapped')]:
    package = types.ModuleType(name)
    package.__path__ = [str(path)]
    sys.modules[name] = package
from word_comparison.stopwords import is_content_word
from word_comparison.wrapped import queries


def compare():
    public = ROOT / 'apps/wrapped/public'
    index = json.loads((public / 'words_index.json').read_text())['words']
    wrapped = json.loads((public / 'wrapped.json').read_text())
    parties = [p['party'] for p in wrapped['parties']]
    rows = []
    for entry in index:
        row = {'word': entry['word']}
        for party in parties:
            values = entry['parties'].get(party, {})
            row[f'{party}_count'] = values.get('count', 0)
            row[f'{party}_per1000'] = values.get('per1000', 0)
        rows.append(row)
    data = queries.WrappedDataQueries()
    data.metadata = {'parties': parties}
    data.word_frequencies = {'nouns': pd.DataFrame(rows)}
    data.top_words = {p: {'nouns': sorted(
        [(r['word'], r[f'{p}_count']) for r in rows], key=lambda x: x[1], reverse=True
    )} for p in parties}
    original_filter = queries.is_content_word
    output = {'note': __doc__, 'parties': {}}
    for party in parties:
        result = {}
        for label, predicate in [('before', lambda word, word_type='nouns': True), ('after', original_filter)]:
            queries.is_content_word = predicate
            result[label] = {
                'signatureWords': data.get_distinctive_words(party),
                'keyTopics': data.get_key_topics(party, top_n=5),
                'topWords': [(w, c) for w, c in data.top_words[party]['nouns'] if predicate(w)][:7],
            }
        output['parties'][party] = result
    queries.is_content_word = original_filter
    output['hotTopics'] = {'before': wrapped['hotTopics'], 'after': data.get_hot_topics(15)}
    output['excludedWords'] = [r['word'] for r in rows if not is_content_word(r['word'])]
    # Regression checks: generic words must never enter signatures or topics,
    # even if they dominate the input or use capitalized display spelling.
    fixture = pd.DataFrame([
        {'word': word, 'A_count': 100, 'A_per1000': 10, 'B_count': 1, 'B_per1000': .1}
        for word in ['Dank', 'danke', 'Frage', 'Euro', 'Dankeschön', 'Klimaschutz']
    ])
    data.metadata = {'parties': ['A', 'B']}
    data.word_frequencies = {'nouns': fixture}
    assert [w for w, _ in data.get_distinctive_words('A')] == ['Klimaschutz']
    assert [w for w, _, _ in data.get_key_topics('A')] == ['Klimaschutz']
    assert not is_content_word(' DANK ')
    assert is_content_word('Klimaschutz')
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    compare()
