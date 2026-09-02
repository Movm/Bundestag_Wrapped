import type { Page, Route } from 'playwright/test';

const assets = { wrapped: 'wrapped.json', speakerIndex: 'speakers/index.json', speakersBase: 'speakers', speeches: 'speeches.json', words: 'words.json', wordRankings: 'word_rankings.json', topicRankings: 'topic_rankings.json' };

function party(name: string, word: string, signatureWords: string[]) {
  return { party: name, speeches: 10, wortbeitraege: 2, totalWords: 1000, uniqueSpeakers: 4, topWords: [{ word, count: 10 }], signatureWords: signatureWords.map((value, index) => ({ word: value, ratio: 4 - index / 10 })), keyTopics: [{ word, count: 10, ratio: 1 }], avgSpeechLength: 100, descriptiveness: 1, topSpeaker: { name: `${name} Sprecher`, speeches: 3 } };
}

function wrapped(editionId: string, includeSpeechMetric: boolean) {
  const parties = [party('Partei Alpha', 'alpha', ['alpha', 'birke', 'ceder', 'delta']), party('Partei Beta', 'beta', ['echo', 'fichte', 'gamma', 'helix']), party('Partei Gamma', 'gamma', ['iris', 'jupiter', 'kiesel', 'lima']), party('Partei Delta', 'delta', ['mango', 'nova', 'opal', 'pixel'])];
  const speakers = ['Alex Alpha', 'Bea Beta', 'Chris Gamma', 'Dana Delta'];
  const named = speakers.map((name, index) => ({ name, party: parties[index].party, count: 4 - index }));
  const byWords = speakers.map((name, index) => ({ name, party: parties[index].party, totalWords: 400 - index * 10, speeches: 4 - index }));
  return {
    metadata: { generatedAt: '2042-01-01T00:00:00Z', totalSpeeches: 10, redenCount: 8, wortbeitraegeCount: 2, totalWords: 1000, partyCount: 4, speakerCount: 4, wahlperiode: 99, sitzungen: 1 },
    parties,
    drama: { topZwischenrufer: named, mostInterrupted: named, applauseChampions: parties.map((entry, index) => ({ party: entry.party, count: 4 - index })), loudestHecklers: parties.map((entry, index) => ({ party: entry.party, count: 4 - index })), zwischenrufStats: { total: 10, positive: 3, negative: 3, neutral: 4, positivePercent: 30, negativePercent: 30, neutralPercent: 40, classification: { positive: 'positiv', negative: 'negativ', neutral: 'neutral' } } },
    topSpeakers: speakers.map((name, index) => ({ name, party: parties[index].party, speeches: 4 - index })),
    topBefragungResponders: speakers.map((name, index) => ({ name, party: parties[index].party, responses: index })),
    topSpeakersByWords: includeSpeechMetric ? byWords : [],
    topSpeakersByAvgWords: byWords.map((entry) => ({ ...entry, avgWords: entry.totalWords / entry.speeches })),
    hotTopics: ['Thema Alpha', 'Thema Beta', 'Thema Gamma', 'Thema Delta'],
    toneAnalysis: null,
    topicAnalysis: { byParty: Object.fromEntries(parties.map((entry, index) => [entry.party, { [`Thema ${index}`]: index + 1 }])), overall: { 'Thema Alpha': 4, 'Thema Beta': 3, 'Thema Gamma': 2, 'Thema Delta': 1 }, topTopics: ['Thema Alpha', 'Thema Beta', 'Thema Gamma', 'Thema Delta'].map((topic, index) => ({ topic, score: 4 - index, rank: index + 1 })) },
    funFacts: [{ emoji: '🧪', value: editionId, label: 'Fixture', category: 'general' }],
    genderAnalysis: { distribution: { male: 2, female: 2, unknown: 0, femalePercent: 50 }, byParty: parties.map((entry, index) => ({ party: entry.party, male: 1, female: index + 1, femaleRatio: 40 + index })), topFemaleSpeakersReden: [], topMaleSpeakersReden: [], interruptionPatterns: { maleInterruptions: 1, femaleInterruptions: 1, maleInterrupted: 1, femaleInterrupted: 1 } },
    moinSpeakers: [], topQuestionAskers: [],
  };
}

function manifest(editionId: string, year: number, dataVersion: string) {
  return { schemaVersion: 1, editionId, year, title: `Fixture Wrapped ${year}`, status: year === 2025 ? 'published' : 'preview', period: { start: `${year}-01-01`, end: `${year}-12-31`, timezone: 'Europe/Berlin', wahlperioden: [99] }, dataVersion, generatedAt: '2042-01-01T00:00:00Z', coverage: { protocolCount: 1, firstProtocolDate: `${year}-01-01`, lastProtocolDate: `${year}-01-01`, complete: false }, assets, content: 'content.json', checksums: 'checksums.json' };
}

function speaker(name: string, party: string) {
  return {
    name, party, slug: 'shared-speaker', academicTitle: null, speeches: 4, wortbeitraege: 1, befragungResponses: 0, totalWords: 400, avgWords: 100, minWords: 50, maxWords: 150,
    rankings: { speechRank: 1, wordsRank: 1, partySpeechRank: 1, partyWordsRank: 1, partySize: 1, totalSpeakers: 1, percentile: 100, verbosityRank: null, verbosityTotal: null, partyVerbosityRank: null, longestSpeechRank: 1 },
    drama: { interruptionsGiven: 0, interruptionsReceived: 0, interrupterRank: null, interruptedRank: null },
    words: { topWords: [{ word: 'fixture', count: 4 }] }, comparison: { speakerAvgWords: 100, partyAvgWords: 100, parliamentAvgWords: 100, vsParty: 0, vsParliament: 0 }, funFacts: [], signatureQuiz: null, signatureAdjectiveQuiz: null, spiritAnimal: null, toneProfile: null, topics: null,
  };
}

const editions = {
  '2025': { manifest: manifest('2025', 2025, 'fixture-a'), content: { editionId: '2025', year: 2025 }, wrapped: wrapped('2025', true), speakerIndex: { speakers: [{ slug: 'shared-speaker', name: 'Alex Ausgabe Eins', party: 'Partei Alpha', speeches: 4, wortbeitraege: 1, words: 400 }] }, speaker: speaker('Alex Ausgabe Eins', 'Partei Alpha'), speeches: { speeches: [{ speaker: 'Alex Ausgabe Eins', party: 'Partei Alpha', category: 'rede', words: 400, text: 'Fixture-Rede 2025' }] } },
  '2026': { manifest: manifest('2026', 2026, 'fixture-b'), content: { editionId: '2026', year: 2026 }, wrapped: wrapped('2026', false), speakerIndex: { speakers: [{ slug: 'shared-speaker', name: 'Bea Ausgabe Zwei', party: 'Partei Beta', speeches: 5, wortbeitraege: 2, words: 500 }] }, speaker: speaker('Bea Ausgabe Zwei', 'Partei Beta'), speeches: { speeches: [{ speaker: 'Bea Ausgabe Zwei', party: 'Partei Beta', category: 'rede', words: 500, text: 'Fixture-Rede 2026' }] } },
};

function respond(route: Route, payload: unknown) {
  return route.fulfill({ json: payload });
}

/** Routes edition bootstrap requests to small, deterministic browser fixtures. */
export async function installEditionFixtures(page: Page) {
  await page.route('**/data/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/data/editions.json') return respond(route, { schemaVersion: 1, currentEdition: '2025', editions: Object.entries(editions).map(([id, edition]) => ({ id, year: edition.manifest.year, status: edition.manifest.status, manifestUrl: `/data/fixtures/${id}/manifest.json` })) });
    const match = path.match(/^\/data\/fixtures\/(2025|2026)\/(.+)$/);
    if (!match) return route.continue();
    const [, editionId, asset] = match;
    const fixture = editions[editionId as keyof typeof editions];
    if (asset === 'manifest.json') return respond(route, fixture.manifest);
    if (asset === 'content.json') return respond(route, fixture.content);
    if (asset === 'wrapped.json') return respond(route, fixture.wrapped);
    if (asset === 'speakers/index.json') return respond(route, fixture.speakerIndex);
    if (asset === 'speakers/shared-speaker.json') return respond(route, fixture.speaker);
    if (asset === 'speeches.json') return respond(route, fixture.speeches);
    return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'fixture asset missing' }) });
  });
}
