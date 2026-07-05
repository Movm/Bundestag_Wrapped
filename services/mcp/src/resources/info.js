/**
 * MCP Resources for Bundestag API information
 */

import { config } from '../config.js';

/**
 * Server-level instructions.
 *
 * Unlike the `bundestag://system-prompt` resource (which a client must explicitly
 * read), this string is returned in the MCP `initialize` result and injected into
 * the model's system prompt by the client. Keep it concise and high-signal — it is
 * present in every context. Detailed workflows live in the system-prompt resource.
 */
export const SERVER_INSTRUCTIONS = `# Bundestag MCP — how to use these tools

Access to the German Bundestag's official documentation (DIP API) plus a semantic
(vector) search layer over document and speech full text.

## Golden rules
- **Current electoral period is Wahlperiode 21** (21st Bundestag, since 2025). Pass
  \`wahlperiode: 21\` for "current" questions; omit it to search across all periods
  (20 = 2021–2025, 19 = 2017–2021, … remain searchable).
- **Check size before fetching full text.** Plenarprotokolle run 50k–200k tokens.
  Call \`bundestag_estimate_size\` first, or use a \`*_text\` / \`*_sections\` search to
  pull only the passages you need.
- **List results are compact by default** (key fields + a \`responseSize\` estimate).
  Request \`fields: "full"\` only when you truly need raw DIP records. Page with \`cursor\`.
- **Faction filter needs the official name**: \`CDU/CSU\`, \`SPD\`, \`AfD\`,
  \`BÜNDNIS 90/DIE GRÜNEN\`, \`DIE LINKE\`. FDP and BSW are **not** in the 21st Bundestag.
- **Empty results?** Try umlaut-free spelling (ä→ae, ö→oe, ü→ue, ß→ss) and partial names.

## Which tool
| Goal | Use |
|------|-----|
| Concept/topic, exact wording unknown | \`bundestag_semantic_search\` |
| Passage inside document full text | \`bundestag_search_document_sections\` (semantic) — the DIP API has no full-text search |
| What an MP/party said | \`bundestag_search_speeches\` (semantic) — the DIP API has no full-text search |
| Full text of a *known* Drucksache/Protokoll | \`bundestag_search_drucksachen_text\` / \`bundestag_search_plenarprotokolle_text\` — retrieval by id/wahlperiode/date only, NOT text search |
| Documents by title / type / date / author | \`bundestag_search_drucksachen\` |
| A bill's lifecycle | \`bundestag_search_vorgaenge\` → \`bundestag_get_vorgang\` → \`bundestag_search_vorgangspositionen\` |
| A person and their activities | \`bundestag_search_personen\` → \`bundestag_search_aktivitaeten\` |
| One document by ID | \`bundestag_get_*\` (run \`bundestag_estimate_size\` first for full text) |
| Rhetoric / tone / topics | \`bundestag_speaker_profile\`, \`bundestag_compare_parties\` (two-step — see below), \`bundestag_analyze_tone\`, \`bundestag_classify_topics\` (need the NLP service — check \`bundestag_analysis_health\`) |

## Analysis tools are two-step — do both steps yourself
\`bundestag_speaker_profile\` and \`bundestag_compare_parties\` do **not** fetch data; they
analyse speeches you supply. Never ask the user for speeches — fetch them first:
- **Compare parties on a topic:** \`bundestag_search_speeches(query, limit: 100-200)\`, then
  pass its \`results\` straight into \`bundestag_compare_parties(speeches: results)\`.
- **Profile a speaker:** \`bundestag_search_speeches(speaker, limit: 50-100)\`, then pass its
  \`results\` into \`bundestag_speaker_profile(speaker_name, speeches: results)\`.

Search fields (\`speakerParty\`, \`speechType\`, \`firstName\`) are accepted and mapped
automatically — forward the \`results\` array verbatim, no reshaping needed.

Rule of thumb: **semantic** tools for any content/phrase/topic search (the DIP API has
no full-text search), **\`_text\`** tools only to *retrieve* full text of a known document
by id/wahlperiode/date, **metadata** search for structured filters. Read the \`bundestag://system-prompt\`
resource for detailed workflows, chaining recipes, and pitfalls.`;

/**
 * System prompt resource with usage instructions
 */
export const systemPromptResource = {
  uri: 'bundestag://system-prompt',
  name: 'Bundestag MCP System Prompt',
  description: 'Usage instructions and best practices for the Bundestag MCP server',
  mimeType: 'text/markdown',

  async handler() {
    return `# Bundestag MCP Server - AI Usage Guide

## Overview
This MCP server provides access to the German Bundestag's parliamentary documentation system (DIP API).
You can search and retrieve:
- **Drucksachen**: Bills, motions, inquiries, and other printed documents
- **Plenarprotokolle**: Verbatim transcripts of plenary sessions
- **Vorgänge**: Legislative proceedings (lifecycle of bills)
- **Personen**: Members of Parliament and other persons
- **Aktivitäten**: Parliamentary activities (speeches, questions)

## Best Practices

### 1. Start with Search
Always search first before fetching specific documents:
\`\`\`
bundestag_search_drucksachen({ query: "Klimaschutz", wahlperiode: 20 })
\`\`\`

### 2. Use Wahlperiode Filter
The current electoral period (21st Bundestag, 2025-) is \`wahlperiode: 21\`.
Filter by Wahlperiode for "current" questions; omit it to search across all periods
(20 = 2021-2025, 19 = 2017-2021, and earlier remain searchable).

### 3. Pagination
Results are paginated. Use the \`cursor\` from the response to fetch more:
\`\`\`
bundestag_search_drucksachen({ query: "...", cursor: "<cursor-from-previous>" })
\`\`\`

### 4. Document Types
Common Drucksache types:
- \`Gesetzentwurf\`: Draft law/bill
- \`Antrag\`: Motion
- \`Kleine Anfrage\`: Minor interpellation
- \`Große Anfrage\`: Major interpellation
- \`Beschlussempfehlung und Bericht\`: Committee recommendation

### 5. Full Text Search
Two approaches for full-text:
- Use \`includeFullText: true\` on get_drucksache/get_plenarprotokoll for single documents
- Use \`bundestag_search_drucksachen_text\` or \`bundestag_search_plenarprotokolle_text\` to search within content

### 6. Vorgangspositionen
Track detailed bill progress with \`bundestag_search_vorgangspositionen\`:
- Filter by \`vorgang_id\` to see all steps of a specific bill
- Shows committee referrals, votes, decisions, and other milestones

### 7. Linking Documents
Use Vorgänge to understand how documents relate:
1. Search for a Vorgang by topic
2. Get the Vorgang by ID - it lists all related Drucksachen
3. Fetch specific Drucksachen for details

## Example Workflows

### Find Recent Climate Legislation
1. \`bundestag_search_vorgaenge({ query: "Klimaschutz", vorgangstyp: "Gesetzgebung", wahlperiode: 20 })\`
2. Get a specific Vorgang to see all related documents
3. Fetch the Gesetzentwurf (draft law) for full details

### Find MP's Activities
1. \`bundestag_search_personen({ query: "Habeck" })\`
2. Use the person ID to search activities:
   \`bundestag_search_aktivitaeten({ person_id: <id>, wahlperiode: 20 })\`

### Find Recent Parliamentary Debates
1. \`bundestag_search_plenarprotokolle({ datum_start: "2024-01-01", wahlperiode: 20 })\`
2. Get specific protocol with full text for debate content

## Response Format
All search results include:
- \`totalResults\`: Total matching documents
- \`returnedResults\`: Documents in this response (respects \`limit\`)
- \`apiReturned\`: How many the DIP API returned before capping to \`limit\`
- \`fields\`: \`"compact"\` (default) or \`"full"\`
- \`responseSize\`: \`{ estimatedTokens, category }\` for this response
- \`cursor\`: Pagination cursor (if more results available)
- \`cached\`: Whether result was from cache
- \`results\`: Array of documents (compact projection by default; pass
  \`fields: "full"\` for the raw DIP records — can be very large)

## Caching
Results are cached for 5 minutes. Use \`useCache: false\` for fresh data.

## NLP Analysis Tools

The server includes tools for natural language processing of German parliamentary text.

### Speech Extraction
\`\`\`
bundestag_extract_speeches({ text: "<protocol full text>" })
\`\`\`
Parses Plenarprotokolle into individual speeches with speaker, party, and type.

### Text Analysis
\`\`\`
bundestag_analyze_text({ text: "...", include_tone: true, include_topics: true })
\`\`\`
Returns word frequencies (nouns, adjectives, verbs) and optional tone/topic scores.

### Tone Analysis
\`\`\`
bundestag_analyze_tone({ text: "..." })
\`\`\`
Returns 12 communication style metrics (0-100 scale):
- \`aggression\`: Aggressive language intensity
- \`collaboration\`: Collaborative vs confrontational
- \`solution_focus\`: Solution vs problem orientation
- \`demand_intensity\`: Demanding language (fordern, müssen)

### Topic Classification
\`\`\`
bundestag_classify_topics({ text: "..." })
\`\`\`
Returns per-1000-word scores for 13 policy areas:
migration, klima, wirtschaft, soziales, sicherheit, gesundheit,
europa, digital, bildung, finanzen, justiz, arbeit, mobilitaet

### Analysis Workflow Example
1. Get protocol with \`bundestag_get_plenarprotokoll({ id: X, includeFullText: true })\`
2. Check service with \`bundestag_analysis_health()\`
3. Extract speeches with \`bundestag_extract_speeches({ text: fullText })\`
4. Analyze tone with \`bundestag_analyze_tone({ text: fullText })\`
5. Classify topics with \`bundestag_classify_topics({ text: fullText })\`

## Tool Selection Guide

**When to use which search tool:**

| Need | Primary Tool | Fallback |
|------|--------------|----------|
| Find legislation by topic | \`bundestag_search_vorgaenge\` | \`bundestag_semantic_search\` |
| Find specific document by ID | \`bundestag_get_drucksache\` | - |
| Find what someone said | \`bundestag_search_speeches\` (vector) | \`bundestag_search_plenarprotokolle_text\` |
| Exploratory/broad search | \`bundestag_semantic_search\` | \`bundestag_search_drucksachen\` |
| Find a passage inside a document | \`bundestag_search_document_sections\` (vector) | \`bundestag_search_drucksachen_text\` (raw) |
| Analyze speaker rhetoric | \`bundestag_speaker_profile\` | \`bundestag_analyze_tone\` |
| Compare party positions | \`bundestag_compare_parties\` | multiple \`bundestag_analyze_tone\` |
| Track bill lifecycle | \`bundestag_search_vorgangspositionen\` | - |

## Context Window Management

**IMPORTANT:** Before fetching full text of large documents, check the size first:

\`\`\`
bundestag_estimate_size({ type: "plenarprotokoll", id: 12345 })
\`\`\`

This returns:
- Estimated token count
- Size category (tiny/small/medium/large/very_large/massive)
- Context usage percentage for your model
- Recommendation (safe to fetch / avoid full text)

**Size categories:**
| Category | Tokens | Action |
|----------|--------|--------|
| 🟢 tiny/small | <2k | Safe to fetch |
| 🟡 medium | 2k-8k | Consider if needed |
| 🟠 large | 8k-25k | Fetch only if essential |
| 🔴 very_large | 25k-50k | Avoid full text |
| ⛔ massive | >50k | Use text search instead |

**Plenarprotokolle are typically 50k-200k tokens!** Always check size first.

## Common Pitfalls

1. **Empty search results:** Try removing umlauts (ä→ae, ö→oe, ü→ue, ß→ss)
2. **Person search fails:** Use partial name, check for academic titles (Dr., Prof.)
3. **Semantic search unavailable:** Fall back to keyword search tools
4. **NLP tools fail:** Check \`bundestag_analysis_health\` first
5. **Faction names:** Use official names: "CDU/CSU", "BÜNDNIS 90/DIE GRÜNEN", "DIE LINKE". FDP and BSW are not in the 21st Bundestag (below 5% in 2025) — filtering by them only returns older periods.
6. **Context overflow:** Always use \`bundestag_estimate_size\` before fetching full protocol text
7. **Wrong period:** WP 21 is current (since 2025). Querying "current" data with \`wahlperiode: 20\` returns the previous Bundestag.

## Efficient Tool Chaining

**Get a speaker's rhetoric (do both steps automatically):**
1. \`bundestag_search_speeches\` (speaker=<name>, limit 50-100)
2. \`bundestag_speaker_profile\` (speaker_name=<name>, speeches = step 1's \`results\`)

**Compare parties on a topic (do both steps automatically):**
1. \`bundestag_search_speeches\` (query=<topic>, limit 100-200)
2. \`bundestag_compare_parties\` (speeches = step 1's \`results\`; speakerParty is mapped automatically)

**Track a bill completely:**
1. \`bundestag_search_vorgaenge\` (find the Vorgang)
2. \`bundestag_get_vorgang\` (get details)
3. \`bundestag_search_vorgangspositionen\` (get all steps)
4. \`bundestag_get_drucksache\` (for each linked document as needed)

**Analyze a debate:**
1. \`bundestag_get_plenarprotokoll\` (with includeFullText: true)
2. \`bundestag_extract_speeches\` (parse speeches)
3. \`bundestag_compare_parties\` (compare rhetoric)
4. \`bundestag_classify_topics\` (identify policy areas)
`;
  }
};

/**
 * Server info resource
 */
export const infoResource = {
  uri: 'bundestag://info',
  name: 'Server Information',
  description: 'Bundestag MCP server capabilities and version info',
  mimeType: 'application/json',

  async handler() {
    return {
      name: 'Bundestag MCP Server',
      version: '1.0.0',
      description: 'MCP server for German Bundestag parliamentary documentation (DIP API)',
      api: {
        name: 'DIP API',
        provider: 'Deutscher Bundestag',
        documentation: 'https://dip.bundestag.api.bund.dev/',
        baseUrl: config.dipApi.baseUrl
      },
      capabilities: {
        entities: [
          'drucksache',
          'drucksache-text',
          'plenarprotokoll',
          'plenarprotokoll-text',
          'vorgang',
          'vorgangsposition',
          'person',
          'aktivitaet'
        ],
        features: [
          'Full-text search',
          'Metadata search',
          'Date range filtering',
          'Wahlperiode filtering',
          'Pagination with cursors',
          'Full document text retrieval',
          'Proceeding position tracking',
          'Response caching',
          'Semantic search (Qdrant + Mistral)',
          'Speech extraction from protocols',
          'NLP word frequency analysis',
          'Communication style/tone analysis',
          'Political topic classification'
        ]
      },
      tools: [
        'bundestag_search_drucksachen',
        'bundestag_get_drucksache',
        'bundestag_search_drucksachen_text',
        'bundestag_search_plenarprotokolle',
        'bundestag_get_plenarprotokoll',
        'bundestag_search_plenarprotokolle_text',
        'bundestag_search_vorgaenge',
        'bundestag_get_vorgang',
        'bundestag_search_vorgangspositionen',
        'bundestag_search_personen',
        'bundestag_get_person',
        'bundestag_search_aktivitaeten',
        'bundestag_get_aktivitaet',
        'bundestag_semantic_search',
        'bundestag_search_speeches',
        'bundestag_search_document_sections',
        'bundestag_semantic_search_status',
        'bundestag_protocol_search_status',
        'bundestag_document_search_status',
        'bundestag_trigger_indexing',
        'bundestag_trigger_protocol_indexing',
        'bundestag_trigger_document_indexing',
        'bundestag_reindex_protocols',
        'bundestag_extract_speeches',
        'bundestag_analyze_text',
        'bundestag_analyze_tone',
        'bundestag_classify_topics',
        'bundestag_speaker_profile',
        'bundestag_compare_parties',
        'bundestag_analysis_health',
        'bundestag_estimate_size',
        'bundestag_cache_stats',
        'get_client_config'
      ],
      prompts: [
        'search-legislation',
        'track-proceeding',
        'mp-activity-report',
        'analyze-debate',
        'compare-factions',
        'find-statements',
        'topic-trends',
        'speaker-deep-dive'
      ]
    };
  }
};

/**
 * Wahlperioden (electoral periods) resource
 */
export const wahlperiodenResource = {
  uri: 'bundestag://wahlperioden',
  name: 'Electoral Periods',
  description: 'List of Bundestag electoral periods (Wahlperioden)',
  mimeType: 'application/json',

  async handler() {
    return {
      current: 21,
      periods: [
        { number: 21, years: '2025-', description: 'Current electoral period' },
        { number: 20, years: '2021-2025', description: 'Previous electoral period' },
        { number: 19, years: '2017-2021', description: '' },
        { number: 18, years: '2013-2017', description: '' },
        { number: 17, years: '2009-2013', description: '' },
        { number: 16, years: '2005-2009', description: '' },
        { number: 15, years: '2002-2005', description: '' },
        { number: 14, years: '1998-2002', description: '' },
        { number: 13, years: '1994-1998', description: '' },
        { number: 12, years: '1990-1994', description: 'First all-German Bundestag' }
      ],
      note: 'Earlier periods (1-11) are also available in the API'
    };
  }
};

/**
 * Document types resource
 */
export const drucksachetypenResource = {
  uri: 'bundestag://drucksachetypen',
  name: 'Document Types',
  description: 'Available Drucksache (document) types',
  mimeType: 'application/json',

  async handler() {
    return {
      types: config.entityTypes.drucksachetypen,
      descriptions: {
        'Gesetzentwurf': 'Draft law/bill introduced by government, Bundesrat, or parliamentary groups',
        'Antrag': 'Motion proposed by parliamentary groups',
        'Kleine Anfrage': 'Minor interpellation - written questions to the government',
        'Große Anfrage': 'Major interpellation - significant questions requiring debate',
        'Beschlussempfehlung und Bericht': 'Committee recommendation and report',
        'Unterrichtung': 'Government information/notification to parliament',
        'Entschließungsantrag': 'Resolution motion',
        'Änderungsantrag': 'Amendment proposal',
        'Bericht': 'Report',
        'Schriftliche Frage': 'Written question by individual MP'
      }
    };
  }
};

/**
 * Parliamentary factions resource
 */
export const factionenResource = {
  uri: 'bundestag://factions',
  name: 'Parliamentary Factions',
  description: 'List of Bundestag factions with official names and common aliases for API filtering',
  mimeType: 'application/json',

  async handler() {
    return {
      current_wahlperiode: 21,
      factions_in_current_wahlperiode: ['CDU/CSU', 'AfD', 'SPD', 'BÜNDNIS 90/DIE GRÜNEN', 'DIE LINKE'],
      factions: [
        {
          official: 'SPD',
          full_name: 'Sozialdemokratische Partei Deutschlands',
          aliases: ['Sozialdemokraten'],
          color: '#E3000F',
          position: 'center-left'
        },
        {
          official: 'CDU/CSU',
          full_name: 'Christlich Demokratische Union / Christlich-Soziale Union',
          aliases: ['Union', 'Christdemokraten', 'CDU', 'CSU'],
          color: '#000000',
          position: 'center-right'
        },
        {
          official: 'BÜNDNIS 90/DIE GRÜNEN',
          full_name: 'Bündnis 90/Die Grünen',
          aliases: ['Grüne', 'Die Grünen', 'B90/Grüne', 'Gruene'],
          color: '#1AA037',
          position: 'center-left'
        },
        {
          official: 'FDP',
          full_name: 'Freie Demokratische Partei',
          aliases: ['Liberale', 'Freie Demokraten'],
          color: '#FFEF00',
          position: 'center',
          note: 'Not in the 21st Bundestag (below 5% in 2025); present in WP 19-20'
        },
        {
          official: 'AfD',
          full_name: 'Alternative für Deutschland',
          aliases: ['Alternative für Deutschland'],
          color: '#0489DB',
          position: 'right'
        },
        {
          official: 'DIE LINKE',
          full_name: 'Die Linke',
          aliases: ['Linke', 'Linkspartei'],
          color: '#BE3075',
          position: 'left',
          note: 'Lost faction status in WP 20 (2024 split); regained full faction status in the 21st Bundestag (2025)'
        },
        {
          official: 'BSW',
          full_name: 'Bündnis Sahra Wagenknecht',
          aliases: ['Bündnis Sahra Wagenknecht', 'Wagenknecht'],
          color: '#731930',
          position: 'left-populist',
          note: 'Split from DIE LINKE in 2024; not in the 21st Bundestag (below 5% in 2025)'
        },
        {
          official: 'fraktionslos',
          full_name: 'Fraktionslose Abgeordnete',
          aliases: ['parteilos', 'unaffiliated', 'independent'],
          color: '#808080',
          note: 'MPs without faction membership'
        }
      ],
      usage_note: 'Always use the official name for API filtering (fraktion parameter). Aliases are for recognition and search fallback only.',
      api_tip: 'When searching by party, use bundestag_semantic_search with fraktion parameter set to official name'
    };
  }
};

// Export all resources
export const allResources = [
  systemPromptResource,
  infoResource,
  wahlperiodenResource,
  drucksachetypenResource,
  factionenResource
];
