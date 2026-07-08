#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const API_BASE = 'https://www.abgeordnetenwatch.de/api/v2';
const OUT_DIR = path.resolve(__dirname, '../public/speaker-enrichment');

const SIDEJOB_CATEGORIES = {
  '29231': 'Beteiligung an Kapital- oder Personengesellschaften',
  '29647': 'Entgeltliche Tätigkeiten neben dem Mandat',
  '29229': 'Funktionen in Körperschaften und Anstalten des öffentlichen Rechts',
  '29228': 'Funktionen in Unternehmen',
  '29230': 'Funktionen in Vereinen, Verbänden und Stiftungen',
  '29232': 'Spenden/Zuwendungen für politische Tätigkeit',
  '29233': 'Vereinbarungen über künftige Tätigkeiten oder Vermögensvorteile',
  '29234': 'Berufliche Tätigkeit vor der Mitgliedschaft im Deutschen Bundestag',
};

const INTERVAL_LABELS = {
  '0': 'einmalig',
  '1': 'monatlich',
  '2': 'jährlich',
};

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--slug') args.slug = argv[++index];
    else if (arg === '--name') args.name = argv[++index];
    else if (arg === '--politician-id') args.politicianId = Number(argv[++index]);
    else if (arg === '--vote-limit') args.voteLimit = Number(argv[++index]);
    else if (arg === '--sidejob-limit') args.sidejobLimit = Number(argv[++index]);
  }
  return args;
}

function buildQuery(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const text = query.toString();
  return text ? `?${text}` : '';
}

async function getJson(endpoint, params = {}) {
  const response = await fetch(`${API_BASE}/${endpoint}${buildQuery(params)}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'BundestagWrapped-Enrichment/1.0 (+https://github.com/Movm/Bundestag_Wrapped)',
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`${endpoint} failed with ${response.status}: ${body.slice(0, 180)}`);
  }
  return response.json();
}

async function resolvePolitician({ name, politicianId }) {
  if (politicianId) {
    const body = await getJson(`politicians/${politicianId}`);
    return body.data;
  }
  if (!name) {
    throw new Error('Provide --name or --politician-id.');
  }
  const body = await getJson('politicians', { 'label[cn]': name, range_end: 5 });
  const matches = Array.isArray(body.data) ? body.data : [];
  const exact = matches.find((match) => match.label?.toLowerCase() === name.toLowerCase());
  const politician = exact ?? matches[0];
  if (!politician) throw new Error(`No Abgeordnetenwatch politician found for "${name}".`);
  if (!exact && matches.length > 1) {
    console.warn(`Using first fuzzy match "${politician.label}". Check identity manually.`);
  }
  return politician;
}

async function getCurrentMandate(politicianId) {
  const body = await getJson('candidacies-mandates', {
    politician: politicianId,
    current_on: 'now',
    type: 'mandate',
    sort_by: 'id',
    sort_direction: 'desc',
    range_end: 10,
  });
  return Array.isArray(body.data) ? body.data[0] ?? null : null;
}

function mapPolitician(politician) {
  return {
    id: politician.id,
    url: politician.abgeordnetenwatch_url,
    party: politician.party?.label ?? null,
    yearOfBirth: politician.year_of_birth ?? null,
    education: politician.education ?? null,
    residence: politician.residence ?? null,
    occupation: politician.occupation ?? null,
    questions: politician.statistic_questions != null ? Number(politician.statistic_questions) : null,
    questionsAnswered: politician.statistic_questions_answered != null
      ? Number(politician.statistic_questions_answered)
      : null,
    bundestagAdministrationId: politician.ext_id_bundestagsverwaltung ?? null,
    wikidataId: politician.qid_wikidata ?? null,
  };
}

function mapMandate(mandate) {
  if (!mandate) return null;
  return {
    id: mandate.id,
    label: mandate.label,
    parliamentPeriod: mandate.parliament_period?.label ?? null,
    fraction: mandate.fraction_membership?.[0]?.fraction?.label ?? null,
    constituency: mandate.electoral_data?.constituency?.label ?? null,
    list: mandate.electoral_data?.electoral_list?.label ?? null,
    listPosition: mandate.electoral_data?.list_position ?? null,
    constituencyResult: mandate.electoral_data?.constituency_result ?? null,
    mandateWon: mandate.electoral_data?.mandate_won ?? null,
    apiUrl: mandate.api_url ?? null,
  };
}

function mapSidejob(sidejob) {
  return {
    id: sidejob.id,
    title: sidejob.label ?? '',
    organization: sidejob.sidejob_organization?.label ?? null,
    category: sidejob.category ?? null,
    categoryLabel: SIDEJOB_CATEGORIES[String(sidejob.category)] ?? null,
    income: sidejob.income != null ? Number(sidejob.income) : null,
    incomeLevel: sidejob.income_level != null ? Number(sidejob.income_level) : null,
    interval: sidejob.interval ?? null,
    intervalLabel: INTERVAL_LABELS[String(sidejob.interval)] ?? null,
    city: sidejob.field_city?.label ?? null,
    country: sidejob.field_country?.label ?? null,
    topics: (sidejob.field_topics ?? []).map((topic) => topic.label).filter(Boolean),
    dataChangeDate: sidejob.data_change_date ?? null,
    apiUrl: sidejob.api_url ?? null,
  };
}

function mapVote(vote) {
  return {
    id: vote.id,
    pollId: vote.poll?.id ?? 0,
    pollLabel: vote.poll?.label ?? '',
    vote: vote.vote ?? '',
    reasonNoShow: vote.reason_no_show ?? vote.reason_no_show_other ?? null,
    fraction: vote.fraction?.label ?? null,
    url: vote.poll?.abgeordnetenwatch_url ?? null,
  };
}

async function readExisting(slug) {
  const file = path.join(OUT_DIR, `${slug}.json`);
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const voteLimit = args.voteLimit ?? 10;
  const sidejobLimit = args.sidejobLimit ?? 50;
  const politician = await resolvePolitician(args);
  const mandate = await getCurrentMandate(politician.id);

  const [sidejobsBody, votesBody] = mandate
    ? await Promise.all([
        getJson('sidejobs', {
          mandates: mandate.id,
          sort_by: 'income',
          sort_direction: 'desc',
          range_end: sidejobLimit,
        }),
        getJson('votes', {
          mandate: mandate.id,
          sort_by: 'id',
          sort_direction: 'desc',
          range_end: voteLimit,
        }),
      ])
    : [{ data: [] }, { data: [], meta: { result: { total: 0 } } }];

  const slug = args.slug ?? politician.label.toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const existing = await readExisting(slug);

  const enrichment = {
    ...existing,
    abgeordnetenwatch: {
      sourceLabel: 'Abgeordnetenwatch',
      sourceUrl: politician.abgeordnetenwatch_url,
      license: 'CC0 1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.de',
      updatedAt: new Date().toISOString().slice(0, 10),
      politician: mapPolitician(politician),
      mandate: mapMandate(mandate),
      sidejobs: (sidejobsBody.data ?? []).map(mapSidejob),
      votes: {
        total: votesBody.meta?.result?.total ?? votesBody.data?.length ?? 0,
        recent: (votesBody.data ?? []).map(mapVote),
      },
      notes: [
        'Abgeordnetenwatch stellt die API-Daten unter CC0 1.0 bereit.',
        'Nebentätigkeiten stammen aus Veröffentlichungen der Bundestagsverwaltung und werden von Abgeordnetenwatch aufbereitet.',
      ],
    },
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, `${slug}.json`), `${JSON.stringify(enrichment, null, 2)}\n`);
  console.log(`Imported Abgeordnetenwatch enrichment for ${politician.label} -> ${slug}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
