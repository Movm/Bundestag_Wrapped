#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const API_BASE = 'https://www.abgeordnetenwatch.de/api/v2';
const WIKIDATA_API_BASE = 'https://www.wikidata.org/w/api.php';
const COMMONS_API_BASE = 'https://commons.wikimedia.org/w/api.php';
const DEFAULT_INDEX = path.resolve(__dirname, '../public/speakers/index.json');
const DEFAULT_OUT_DIR = path.resolve(__dirname, '../public/speaker-enrichment');
const BUNDESTAG_PARLIAMENT_ID = 5;
const API_BATCH_SIZE = 50;

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
  const args = {
    speakerIndex: DEFAULT_INDEX,
    outputDir: DEFAULT_OUT_DIR,
    recentVotes: 10,
    requestDelayMs: 2100,
    minimumCoverage: 0.9,
    minimumImageCoverage: 0.5,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--speaker-index') args.speakerIndex = path.resolve(argv[++index]);
    else if (arg === '--output-dir') args.outputDir = path.resolve(argv[++index]);
    else if (arg === '--parliament-period') args.parliamentPeriod = Number(argv[++index]);
    else if (arg === '--recent-votes') args.recentVotes = Number(argv[++index]);
    else if (arg === '--request-delay-ms') args.requestDelayMs = Number(argv[++index]);
    else if (arg === '--minimum-coverage') args.minimumCoverage = Number(argv[++index]);
    else if (arg === '--minimum-image-coverage') args.minimumImageCoverage = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isInteger(args.recentVotes) || args.recentVotes < 0) {
    throw new Error('--recent-votes must be a non-negative integer.');
  }
  if (!Number.isFinite(args.requestDelayMs) || args.requestDelayMs < 0) {
    throw new Error('--request-delay-ms must be a non-negative number.');
  }
  if (!Number.isFinite(args.minimumCoverage) || args.minimumCoverage < 0 || args.minimumCoverage > 1) {
    throw new Error('--minimum-coverage must be between 0 and 1.');
  }
  if (!Number.isFinite(args.minimumImageCoverage) || args.minimumImageCoverage < 0 || args.minimumImageCoverage > 1) {
    throw new Error('--minimum-image-coverage must be between 0 and 1.');
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

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createApiClient(requestDelayMs, baseUrl = API_BASE) {
  let lastRequestAt = 0;
  let requestQueue = Promise.resolve();

  async function reserveRequestSlot() {
    const reservation = requestQueue.then(async () => {
      const elapsed = Date.now() - lastRequestAt;
      if (elapsed < requestDelayMs) {
        await sleep(requestDelayMs - elapsed);
      }
      lastRequestAt = Date.now();
    });
    requestQueue = reservation.catch(() => {});
    await reservation;
  }

  return async function getJson(endpoint, params = {}, retries = 3) {
    await reserveRequestSlot();
    const resourceUrl = endpoint
      ? `${baseUrl.replace(/\/$/, '')}/${endpoint}`
      : baseUrl;
    const url = `${resourceUrl}${buildQuery(params)}`;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BundestagWrapped-Enrichment/1.0 (+https://github.com/Movm/Bundestag_Wrapped)',
        },
      });
    } catch (error) {
      if (retries <= 0) throw error;
      await sleep(5_000 * (4 - retries));
      return getJson(endpoint, params, retries - 1);
    }

    if (response.status === 429 && retries > 0) {
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : 60_000);
      return getJson(endpoint, params, retries - 1);
    }

    if (response.status >= 500 && retries > 0) {
      await sleep(5_000 * (4 - retries));
      return getJson(endpoint, params, retries - 1);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`${endpoint} failed with ${response.status}: ${body.slice(0, 180)}`);
    }

    try {
      return await response.json();
    } catch (error) {
      if (retries <= 0) throw error;
      await sleep(5_000 * (4 - retries));
      return getJson(endpoint, params, retries - 1);
    }
  };
}

async function getAllPages(getJson, endpoint, params = {}) {
  const pageSize = 1000;
  const firstBody = await getJson(endpoint, {
    ...params,
    range_start: 0,
    range_end: pageSize,
  });
  const firstPage = Array.isArray(firstBody.data) ? firstBody.data : [];
  const total = Number(firstBody.meta?.result?.total ?? firstPage.length);
  const remainingStarts = [];
  for (let rangeStart = pageSize; rangeStart < total; rangeStart += pageSize) {
    remainingStarts.push(rangeStart);
  }

  const remainingBodies = await Promise.all(
    remainingStarts.map((rangeStart) => getJson(endpoint, {
      ...params,
      range_start: rangeStart,
      range_end: pageSize,
    }))
  );

  return [firstBody, ...remainingBodies].flatMap((body) => (
    Array.isArray(body.data) ? body.data : []
  ));
}

function cleanText(value, fallback = null) {
  if (value == null) return fallback;
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

function cleanUrl(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.hostname !== 'www.abgeordnetenwatch.de') {
    throw new Error(`Unexpected Abgeordnetenwatch URL origin: ${url.origin}`);
  }
  return url.toString();
}

function cleanWikimediaUrl(value, allowedHosts) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol === 'http:' && allowedHosts.includes(url.hostname)) {
    url.protocol = 'https:';
  }
  if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname)) {
    throw new Error(`Unexpected Wikimedia URL: ${url.origin}`);
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  return url.toString();
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };
  return String(value ?? '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const hexadecimal = entity[1]?.toLowerCase() === 'x';
      const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function cleanHtmlText(value, fallback = null) {
  if (!value) return fallback;
  return cleanText(decodeHtmlEntities(String(value).replace(/<[^>]+>/g, ' ')), fallback);
}

function chunk(items, size = API_BATCH_SIZE) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getPoliticiansByIds(getJson, ids) {
  const uniqueIds = [...new Set(ids.filter(Number.isInteger))];
  const bodies = await Promise.all(chunk(uniqueIds).map((batch) => getJson('politicians', {
    'id[in]': `[${batch.join(',')}]`,
    range_start: 0,
    range_end: batch.length,
  })));
  return new Map(
    bodies
      .flatMap((body) => (Array.isArray(body.data) ? body.data : []))
      .map((politician) => [politician.id, politician])
  );
}

function getWikidataImageFilename(entity) {
  const claims = entity?.claims?.P18 ?? [];
  const claim = claims.find((candidate) => candidate.rank === 'preferred')
    ?? claims.find((candidate) => candidate.rank !== 'deprecated');
  const filename = claim?.mainsnak?.datavalue?.value;
  return typeof filename === 'string' && filename.trim() ? filename.trim() : null;
}

async function getWikidataImages(qids, requestDelayMs = 250) {
  const uniqueQids = [...new Set(qids.filter((qid) => /^Q[1-9]\d*$/.test(qid ?? '')))];
  const getJson = createApiClient(requestDelayMs, WIKIDATA_API_BASE);
  const bodies = await Promise.all(chunk(uniqueQids).map((batch) => getJson('', {
    action: 'wbgetentities',
    format: 'json',
    formatversion: 2,
    props: 'claims',
    ids: batch.join('|'),
  })));
  const images = new Map();
  for (const entity of bodies.flatMap((body) => Object.values(body.entities ?? {}))) {
    const filename = getWikidataImageFilename(entity);
    if (filename) images.set(entity.id, filename);
  }
  return images;
}

function mapCommonsImage(page) {
  const image = page?.imageinfo?.[0];
  if (!image?.url || !image.descriptionurl) return null;

  const metadata = image.extmetadata ?? {};
  const photographer = cleanHtmlText(metadata.Artist?.value);
  const license = cleanHtmlText(metadata.LicenseShortName?.value);
  const attributionRequired = metadata.AttributionRequired?.value === 'true';
  const licenseUrl = cleanWikimediaUrl(metadata.LicenseUrl?.value, ['creativecommons.org', 'www.gnu.org']);
  const creditParts = [photographer, 'Wikimedia Commons', license].filter(Boolean);

  return {
    url: cleanWikimediaUrl(image.url, ['upload.wikimedia.org']),
    ...(image.thumburl ? {
      thumbnailUrl: cleanWikimediaUrl(image.thumburl, ['upload.wikimedia.org']),
    } : {}),
    sourceUrl: cleanWikimediaUrl(image.descriptionurl, ['commons.wikimedia.org']),
    sourceLabel: 'Wikimedia Commons',
    ...(photographer ? { photographer } : {}),
    credit: creditParts.join(', '),
    ...(cleanHtmlText(metadata.DateTimeOriginal?.value) ? {
      takenAt: cleanHtmlText(metadata.DateTimeOriginal.value),
    } : {}),
    usageNotice: attributionRequired
      ? `Wikimedia Commons: ${license ?? 'freie Lizenz'}; Namensnennung gemäß Lizenz erforderlich.`
      : `Wikimedia Commons: ${license ?? 'Lizenzhinweise auf der Dateiseite beachten'}.`,
    ...(license ? { license } : {}),
    ...(licenseUrl ? { licenseUrl } : {}),
  };
}

function labelProfileImage(image, politicianName) {
  return {
    ...image,
    caption: `Porträt von ${politicianName}.`,
    alt: `Porträt von ${politicianName}.`,
  };
}

async function getCommonsImages(filenames, requestDelayMs = 250) {
  const uniqueFilenames = [...new Set(filenames.filter(Boolean))];
  const getJson = createApiClient(requestDelayMs, COMMONS_API_BASE);
  const bodies = await Promise.all(chunk(uniqueFilenames).map((batch) => getJson('', {
    action: 'query',
    format: 'json',
    formatversion: 2,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: 960,
    titles: batch.map((filename) => `File:${filename}`).join('|'),
  })));

  const images = new Map();
  for (const page of bodies.flatMap((body) => body.query?.pages ?? [])) {
    const filename = page.title?.replace(/^File:/, '');
    if (!filename) continue;
    const image = mapCommonsImage(page);
    if (image) images.set(filename, image);
  }
  return images;
}

function speakerSlug(name) {
  return String(name ?? '')
    .replace(/^(?:(?:Prof\.?|Dr\.?)\s+)+/i, '')
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'ae')
    .replace(/Ö/g, 'oe')
    .replace(/Ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortPersonKey(name) {
  const tokens = speakerSlug(name).split('-').filter((token) => token.length > 1);
  if (tokens.length < 2) return null;
  return `${tokens[0]}-${tokens[tokens.length - 1]}`;
}

function mapPolitician(mandate, politician = mandate.politician) {
  return {
    id: politician.id,
    url: cleanUrl(politician.abgeordnetenwatch_url),
    party: cleanText(politician.party?.label ?? mandate.fraction_membership?.[0]?.fraction?.label),
    yearOfBirth: politician.year_of_birth ?? null,
    education: cleanText(politician.education),
    residence: cleanText(politician.residence),
    occupation: cleanText(politician.occupation),
    questions: politician.statistic_questions ?? null,
    questionsAnswered: politician.statistic_questions_answered ?? null,
    bundestagAdministrationId: cleanText(politician.ext_id_bundestagsverwaltung),
    wikidataId: cleanText(politician.qid_wikidata),
  };
}

function mapMandate(mandate) {
  return {
    id: mandate.id,
    label: cleanText(mandate.label),
    parliamentPeriod: cleanText(mandate.parliament_period?.label),
    fraction: cleanText(mandate.fraction_membership?.[0]?.fraction?.label),
    constituency: cleanText(mandate.electoral_data?.constituency?.label),
    list: cleanText(mandate.electoral_data?.electoral_list?.label),
    listPosition: mandate.electoral_data?.list_position ?? null,
    constituencyResult: mandate.electoral_data?.constituency_result ?? null,
    mandateWon: mandate.electoral_data?.mandate_won ?? null,
    apiUrl: cleanUrl(mandate.api_url),
  };
}

function mapSidejob(sidejob) {
  return {
    id: sidejob.id,
    title: cleanText(sidejob.label, ''),
    organization: cleanText(sidejob.sidejob_organization?.label),
    category: sidejob.category ?? null,
    categoryLabel: SIDEJOB_CATEGORIES[String(sidejob.category)] ?? null,
    income: sidejob.income != null ? Number(sidejob.income) : null,
    incomeLevel: sidejob.income_level != null ? Number(sidejob.income_level) : null,
    interval: sidejob.interval ?? null,
    intervalLabel: INTERVAL_LABELS[String(sidejob.interval)] ?? null,
    city: cleanText(sidejob.field_city?.label),
    country: cleanText(sidejob.field_country?.label),
    topics: (sidejob.field_topics ?? []).map((topic) => cleanText(topic.label)).filter(Boolean),
    dataChangeDate: cleanText(sidejob.data_change_date),
    apiUrl: cleanUrl(sidejob.api_url),
  };
}

function mapVote(vote) {
  return {
    id: vote.id,
    pollId: vote.poll?.id ?? 0,
    pollLabel: cleanText(vote.poll?.label, ''),
    vote: cleanText(vote.vote, ''),
    reasonNoShow: cleanText(vote.reason_no_show ?? vote.reason_no_show_other),
    fraction: cleanText(vote.fraction?.label),
    url: cleanUrl(vote.poll?.abgeordnetenwatch_url),
  };
}

function groupByMandate(items) {
  const grouped = new Map();
  for (const item of items) {
    for (const mandate of item.mandates ?? (item.mandate ? [item.mandate] : [])) {
      const existing = grouped.get(mandate.id) ?? [];
      existing.push(item);
      grouped.set(mandate.id, existing);
    }
  }
  return grouped;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function resolveBundestagPeriod(getJson, configuredPeriod) {
  if (configuredPeriod) return configuredPeriod;

  const body = await getJson('parliament-periods', {
    parliament: BUNDESTAG_PARLIAMENT_ID,
    type: 'legislature',
    sort_by: 'id',
    sort_direction: 'desc',
    range_end: 1,
  });
  const period = body.data?.[0];
  if (!period?.id || !String(period.label).startsWith('Bundestag ')) {
    throw new Error('Could not resolve the current Bundestag parliament period.');
  }
  return period.id;
}

async function main() {
  const args = parseArgs(process.argv);
  const getJson = createApiClient(args.requestDelayMs);
  const speakerIndex = await readJson(args.speakerIndex, null);
  if (!Array.isArray(speakerIndex?.speakers)) {
    throw new Error(`Invalid speaker index: ${args.speakerIndex}`);
  }

  const parliamentPeriod = await resolveBundestagPeriod(getJson, args.parliamentPeriod);
  console.log(`Syncing Abgeordnetenwatch data for parliament period ${parliamentPeriod}...`);

  const mandates = await getAllPages(getJson, 'candidacies-mandates', {
    parliament_period: parliamentPeriod,
    type: 'mandate',
    current_on: 'now',
    sort_by: 'id',
    sort_direction: 'desc',
  });
  const sidejobs = await getAllPages(getJson, 'sidejobs', {
    'mandates[entity.parliament_period]': parliamentPeriod,
    sort_by: 'income',
    sort_direction: 'desc',
  });
  const votes = await getAllPages(getJson, 'votes', {
    'mandate[entity.parliament_period]': parliamentPeriod,
    sort_by: 'id',
    sort_direction: 'desc',
  });

  const politiciansById = await getPoliticiansByIds(
    getJson,
    mandates.map((mandate) => mandate.politician?.id)
  );
  const wikidataImagesByQid = await getWikidataImages(
    [...politiciansById.values()].map((politician) => politician.qid_wikidata)
  );
  const imageFilenames = [...new Set(
    [...politiciansById.values()]
      .map((politician) => wikidataImagesByQid.get(politician.qid_wikidata))
      .filter(Boolean)
  )];
  const commonsImagesByFilename = await getCommonsImages(
    imageFilenames
  );
  const profileImagesByPoliticianId = new Map();
  for (const politician of politiciansById.values()) {
    const filename = wikidataImagesByQid.get(politician.qid_wikidata);
    const image = commonsImagesByFilename.get(filename);
    if (image) {
      profileImagesByPoliticianId.set(
        politician.id,
        labelProfileImage(image, cleanText(politician.label, 'Mitglied des Bundestages'))
      );
    }
  }

  const mandatesBySlug = new Map();
  const mandatesByShortKey = new Map();
  for (const mandate of mandates) {
    const slug = speakerSlug(mandate.politician?.label);
    if (!slug) continue;
    if (mandatesBySlug.has(slug)) {
      throw new Error(`Ambiguous mandate match for slug ${slug}.`);
    }
    mandatesBySlug.set(slug, mandate);

    const shortKey = shortPersonKey(mandate.politician?.label);
    if (shortKey) {
      mandatesByShortKey.set(
        shortKey,
        mandatesByShortKey.has(shortKey) ? null : mandate
      );
    }
  }

  const sidejobsByMandate = groupByMandate(sidejobs);
  const votesByMandate = groupByMandate(votes);
  const updatedAt = new Date().toISOString().slice(0, 10);
  const unmatched = [];
  const fallbackMatches = [];
  let matched = 0;

  await fs.mkdir(args.outputDir, { recursive: true });
  for (const speaker of speakerIndex.speakers) {
    let mandate = mandatesBySlug.get(speaker.slug) ?? mandatesBySlug.get(speakerSlug(speaker.name));
    if (!mandate) {
      const shortKey = shortPersonKey(speaker.name);
      mandate = shortKey ? mandatesByShortKey.get(shortKey) : null;
      if (mandate) {
        fallbackMatches.push(`${speaker.name} -> ${mandate.politician.label}`);
      }
    }
    if (!mandate) {
      unmatched.push(`${speaker.name} (${speaker.slug})`);
      continue;
    }

    const outFile = path.resolve(args.outputDir, `${speaker.slug}.json`);
    if (!outFile.startsWith(`${args.outputDir}${path.sep}`)) {
      throw new Error(`Refusing to write outside ${args.outputDir}.`);
    }

    const existing = await readJson(outFile, {});
    const mandateSidejobs = sidejobsByMandate.get(mandate.id) ?? [];
    const mandateVotes = votesByMandate.get(mandate.id) ?? [];
    const politician = politiciansById.get(mandate.politician.id) ?? mandate.politician;
    const profileImage = profileImagesByPoliticianId.get(mandate.politician.id) ?? existing.profileImage;
    const existingProfile = existing.abgeordnetenwatch ?? {};
    const enrichment = {
      ...existing,
      ...(profileImage ? { profileImage } : {}),
      abgeordnetenwatch: {
        sourceLabel: 'Abgeordnetenwatch',
        sourceUrl: cleanUrl(mandate.politician.abgeordnetenwatch_url),
        license: 'CC0 1.0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/deed.de',
        updatedAt,
        politician: {
          ...(existingProfile.politician ?? {}),
          ...mapPolitician(mandate, politician),
        },
        mandate: {
          ...(existingProfile.mandate ?? {}),
          ...mapMandate(mandate),
        },
        sidejobs: mandateSidejobs.map(mapSidejob),
        votes: {
          total: mandateVotes.length,
          recent: mandateVotes.slice(0, args.recentVotes).map(mapVote),
        },
        notes: [
          'Abgeordnetenwatch stellt die API-Daten unter CC0 1.0 bereit.',
          'Nebentätigkeiten stammen aus Veröffentlichungen der Bundestagsverwaltung und werden von Abgeordnetenwatch aufbereitet.',
        ],
      },
    };

    await fs.writeFile(outFile, `${JSON.stringify(enrichment, null, 2)}\n`);
    matched += 1;
  }

  const coverage = matched / speakerIndex.speakers.length;
  const imageCoverage = profileImagesByPoliticianId.size / mandates.length;
  console.log(`Matched ${matched}/${speakerIndex.speakers.length} speaker profiles (${(coverage * 100).toFixed(1)}%).`);
  console.log(`Imported ${votes.length} votes and ${sidejobs.length} sidejobs across ${mandates.length} mandates.`);
  console.log(`Resolved ${profileImagesByPoliticianId.size}/${mandates.length} profile images through Wikidata and Wikimedia Commons.`);
  if (fallbackMatches.length > 0) {
    console.log(`Unique name fallbacks (${fallbackMatches.length}):\n${fallbackMatches.join('\n')}`);
  }
  if (unmatched.length > 0) {
    console.warn(`Unmatched profiles (${unmatched.length}):\n${unmatched.join('\n')}`);
  }
  if (coverage < args.minimumCoverage) {
    throw new Error(`Coverage ${(coverage * 100).toFixed(1)}% is below required ${(args.minimumCoverage * 100).toFixed(1)}%.`);
  }
  if (imageCoverage < args.minimumImageCoverage) {
    throw new Error(`Image coverage ${(imageCoverage * 100).toFixed(1)}% is below required ${(args.minimumImageCoverage * 100).toFixed(1)}%.`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  cleanHtmlText,
  getCommonsImages,
  getAllPages,
  getPoliticiansByIds,
  getWikidataImageFilename,
  groupByMandate,
  labelProfileImage,
  mapCommonsImage,
  shortPersonKey,
  speakerSlug,
};
