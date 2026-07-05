/**
 * MCP Tools for NLP Analysis
 *
 * These tools call the Python FastAPI analysis service to perform
 * NLP analysis on German parliamentary texts.
 */

import { z } from 'zod';
import * as analysisService from '../services/analysisService.js';
import * as api from '../api/bundestag.js';
import { analyzeSize } from '../utils/tokenEstimator.js';

// Cap per-speech text in compact mode: a full protocol yields ~180 speeches, so
// returning every full text would overflow the caller's context window.
const SPEECH_SNIPPET_CHARS = 300;

// =============================================================================
// Speech normalisation
// =============================================================================

/**
 * Normalise speech objects so the output of bundestag_search_speeches (and
 * bundestag_semantic_search) can be passed straight into the analysis tools.
 *
 * search_speeches returns `speakerParty` / `speechType` / `firstName` /
 * `lastName` / `acadTitle`, but the analysis service groups on `party` and reads
 * `speaker` / `type` / snake_case name fields. Without this mapping, a caller
 * that forwards search results verbatim would lose the party (so party grouping
 * silently produces nothing) — the friction that made the two-step workflow feel
 * broken. Accept every shape and fill the canonical fields.
 */
function normalizeSpeeches(speeches) {
  if (!Array.isArray(speeches)) return speeches;
  return speeches.map((s) => {
    const speaker = s.speaker
      || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ')
      || undefined;
    return {
      ...s,
      text: s.text,
      party: s.party || s.speakerParty || s.fraktion || undefined,
      speaker,
      type: s.type || s.speechType || undefined,
      category: s.category || undefined,
      first_name: s.first_name || s.firstName || undefined,
      last_name: s.last_name || s.lastName || undefined,
      acad_title: s.acad_title || s.acadTitle || undefined
    };
  });
}

// A speech object as it arrives from the search tools. Kept permissive
// (`.passthrough()`) so any field the search tools emit survives into
// normalizeSpeeches; `party` is optional here and resolved from aliases at
// runtime rather than hard-required by the schema. All optional fields are
// `.nullish()` because search_speeches emits explicit `null` (not absent) for
// e.g. acadTitle — `.optional()` alone would reject verbatim rows.
const incomingSpeechSchema = z.object({
  text: z.string().describe('Speech text'),
  party: z.string().nullish().describe('Party affiliation — or `speakerParty` straight from bundestag_search_speeches'),
  speaker: z.string().nullish().describe('Speaker name'),
  speakerParty: z.string().nullish().describe('Alias accepted from bundestag_search_speeches output'),
  speechType: z.string().nullish(),
  type: z.string().nullish(),
  category: z.string().nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  acadTitle: z.string().nullish(),
  acad_title: z.string().nullish()
}).passthrough();

// =============================================================================
// Speech Extraction Tool
// =============================================================================

export const extractSpeechesTool = {
  name: 'bundestag_extract_speeches',
  description: `Extract individual speeches from a Plenarprotokoll (plenary session transcript).

Provide EITHER a plenarprotokoll_id (the full transcript is fetched and parsed
server-side — the preferred path) OR raw protocol text. Parsing requires the COMPLETE
protocol structure: each speaker must be introduced by the presiding officer, so
snippets/excerpts return nothing. Always pass a whole protocol or its id.

Identifies speech boundaries via "Name (Party):" (MPs) and "Name, Role:" (government).
Returns per speech: speaker (+ academic title), party, speech type
(rede/befragung/fragestunde_antwort/…), word count and text. Text is a snippet by
default (fields:"compact"); use fields:"full" for the complete speech text.`,

  inputSchema: {
    plenarprotokoll_id: z.number().int().positive().optional()
      .describe('Plenarprotokoll ID — its full transcript is fetched and parsed server-side (preferred over pasting text). Get an id from bundestag_search_plenarprotokolle.'),
    text: z.string().min(100).optional()
      .describe('Full Plenarprotokoll text (alternative to plenarprotokoll_id). Must be a COMPLETE protocol, not an excerpt.'),
    limit: z.number().int().min(1).max(500).default(50)
      .describe('Max speeches to return (default 50). speech_count reports the total found.'),
    fields: z.enum(['compact', 'full']).default('compact')
      .describe('Response detail: "compact" (default — speech text truncated to a snippet) or "full" (complete speech text).')
  },

  async handler(params) {
    try {
      let text = params.text;
      if (params.plenarprotokoll_id) {
        const tr = await api.getPlenarprotokollText(params.plenarprotokoll_id, { useCache: true });
        text = typeof tr === 'string' ? tr : (tr?.text || '');
      }

      if (!text || text.trim().length < 100) {
        return {
          error: true,
          tool: 'bundestag_extract_speeches',
          message: params.plenarprotokoll_id
            ? `No transcript text available for Plenarprotokoll ${params.plenarprotokoll_id}.`
            : 'Provide a plenarprotokoll_id, or the full protocol text (>=100 chars). Excerpts do not parse — pass a complete protocol.'
        };
      }

      const result = await analysisService.extractSpeeches(text);
      const all = result.speeches || [];
      const useFull = params.fields === 'full';
      const limit = params.limit || 50;
      const capped = all.slice(0, limit);

      const speeches = capped.map((s) => {
        const full = typeof s.text === 'string' ? s.text : '';
        const truncated = !useFull && full.length > SPEECH_SNIPPET_CHARS;
        return {
          speaker: s.speaker,
          party: s.party,
          type: s.type,
          category: s.category,
          words: s.words,
          isGovernment: s.is_government,
          firstName: s.first_name,
          lastName: s.last_name,
          acadTitle: s.acad_title,
          text: truncated ? full.slice(0, SPEECH_SNIPPET_CHARS) + '…' : full,
          textLength: full.length,
          textTruncated: truncated
        };
      });

      const size = analyzeSize(JSON.stringify(speeches), { language: 'german' });
      const notes = [];
      if (all.length > capped.length) {
        notes.push(`Showing ${capped.length} of ${all.length} speeches (limit) — raise limit for more.`);
      }
      if (!useFull && speeches.some((s) => s.textTruncated)) {
        notes.push('Speech text truncated to a snippet; call with fields:"full" for complete text.');
      }

      return {
        success: true,
        source: params.plenarprotokoll_id ? { plenarprotokoll_id: params.plenarprotokoll_id } : { text: 'inline' },
        fields: useFull ? 'full' : 'compact',
        speech_count: result.speech_count ?? all.length,
        returned: speeches.length,
        responseSize: {
          estimatedTokens: size.estimatedTokens,
          category: size.category
        },
        ...(notes.length ? { note: notes.join(' ') } : {}),
        speeches
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        tool: 'bundestag_extract_speeches'
      };
    }
  }
};

// =============================================================================
// Text Analysis Tool
// =============================================================================

export const analyzeTextTool = {
  name: 'bundestag_analyze_text',
  description: `Analyze German text for word frequencies, tone, and topics using NLP.

Uses spaCy with the German de_core_news_lg model to:
- Extract and lemmatize nouns, adjectives, and verbs
- Filter German stopwords and parliamentary procedural terms
- Calculate word frequencies (per 1000 words)
- Analyze communication style (tone scores)
- Classify political topics

Returns top words by frequency with normalized rates for cross-text comparison.`,

  inputSchema: {
    text: z.string().min(10)
      .describe('German text to analyze'),
    include_tone: z.boolean().default(true)
      .describe('Include tone analysis scores (aggression, collaboration, etc.)'),
    include_topics: z.boolean().default(true)
      .describe('Include topic classification scores'),
    top_n: z.number().int().min(1).max(500).default(50)
      .describe('Number of top words to return per type')
  },

  async handler(params) {
    try {
      const result = await analysisService.analyzeText(params.text, {
        includeTone: params.include_tone,
        includeTopics: params.include_topics,
        topN: params.top_n
      });

      return {
        success: true,
        ...result
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        tool: 'bundestag_analyze_text'
      };
    }
  }
};

// =============================================================================
// Tone Analysis Tool
// =============================================================================

export const analyzeToneTool = {
  name: 'bundestag_analyze_tone',
  description: `Analyze German text for communication style and tone.

Returns 12 tone metrics on a 0-100 scale:

**Adjective-based (Scheme D):**
- affirmative: Positive vs critical adjective ratio
- aggression: Aggressive language intensity
- labeling: "Othering" language (ideologisch, radikal, etc.)

**Verb-based (Scheme D):**
- solution_focus: Solution-oriented vs problem-focused verbs
- collaboration: Collaborative vs confrontational language
- demand_intensity: Demanding verb usage (fordern, müssen)
- acknowledgment: Acknowledging language (anerkennen, würdigen)

**Extended (Scheme E):**
- authority: Obligation (müssen) vs possibility (können) modals
- future_orientation: Forward-looking vs backward-looking
- emotional_intensity: Intensifiers vs moderators
- inclusivity: Inclusive (wir) vs exclusive (sie) pronouns
- discriminatory: Per-mille rate of discriminatory terms`,

  inputSchema: {
    text: z.string().min(10)
      .describe('German text to analyze for tone')
  },

  async handler(params) {
    try {
      const result = await analysisService.analyzeTone(params.text);

      return {
        success: true,
        total_words: result.total_words,
        tone_scores: result.tone_scores
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        tool: 'bundestag_analyze_tone'
      };
    }
  }
};

// =============================================================================
// Topic Classification Tool
// =============================================================================

export const classifyTopicsTool = {
  name: 'bundestag_classify_topics',
  description: `Classify German text by political topic.

Detects focus on 13 policy areas using curated German keyword lexicons.
Returns per-1000-word frequency scores for each topic:

- **migration**: Asylum, refugees, integration, borders
- **klima**: Climate, environment, energy transition
- **wirtschaft**: Economy, trade, industry, growth
- **soziales**: Social policy, welfare, poverty
- **sicherheit**: Security, defense, police, terrorism
- **gesundheit**: Health, medicine, pandemic, care
- **europa**: EU, European integration, member states
- **digital**: Technology, digitalization, internet, data
- **bildung**: Education, schools, universities, research
- **finanzen**: Budget, taxes, debt, financial policy
- **justiz**: Law, courts, justice, constitutional
- **arbeit**: Employment, labor market, unions, wages
- **mobilitaet**: Transport, infrastructure, mobility

Higher scores indicate more focus on that topic.`,

  inputSchema: {
    text: z.string().min(10)
      .describe('German text to classify by topic')
  },

  async handler(params) {
    try {
      const result = await analysisService.classifyTopics(params.text);

      return {
        success: true,
        total_words: result.total_words,
        topic_scores: result.topic_scores
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        tool: 'bundestag_classify_topics'
      };
    }
  }
};

// =============================================================================
// Analysis Service Health Tool
// =============================================================================

export const analysisHealthTool = {
  name: 'bundestag_analysis_health',
  description: `Check the health status of the NLP analysis service.

Returns whether the Python FastAPI service is running and the spaCy
model is loaded. Use this to verify analysis capabilities are available
before calling other analysis tools.`,

  inputSchema: {},

  async handler() {
    try {
      const isUp = await analysisService.isAvailable();

      if (!isUp) {
        return {
          success: true,
          available: false,
          message: 'Analysis service is not running or not reachable'
        };
      }

      const health = await analysisService.getHealth();

      return {
        success: true,
        available: true,
        spacy_model: health.spacy_model,
        spacy_model_loaded: health.spacy_model_loaded
      };
    } catch (err) {
      return {
        success: true,
        available: false,
        message: err.message
      };
    }
  }
};

// =============================================================================
// Speaker Profile Tool
// =============================================================================

export const speakerProfileTool = {
  name: 'bundestag_speaker_profile',
  description: `Get a comprehensive profile for a Bundestag speaker based on their speeches.

Analyzes all speeches from a specific speaker to create a detailed profile including:

**Speech Statistics:**
- Total speeches, formal speeches (Reden), short contributions (Wortbeiträge)
- Responses in Q&A sessions (Befragung, Fragestunde)
- Total words spoken, average words per speech

**Vocabulary Analysis:**
- Top nouns, adjectives, and verbs used
- Signature words (characteristic vocabulary for this speaker)

**Communication Style:**
- Tone scores (aggression, collaboration, solution-focus, etc.)
- Topic focus (which policy areas they speak about most)

TWO-STEP TOOL — do both steps yourself, automatically, without asking the user for
speeches. When the user asks to profile/analyse a speaker's rhetoric:
1. Call bundestag_search_speeches(speaker="<name>", query="<topic or the name>", limit=50-100,
   fields="full") first. fields:"full" is REQUIRED — the default response truncates speech text
   to a snippet, and the analysis needs the complete text.
2. Pass that call's \`results\` array straight into this tool's \`speeches\` (the search
   fields speakerParty/speechType/firstName are accepted and mapped automatically).

Example:
1. const r = bundestag_search_speeches(speaker="Friedrich Merz", query="Friedrich Merz", limit=100, fields="full")
2. bundestag_speaker_profile(speaker_name="Friedrich Merz", speeches=r.results)`,

  inputSchema: {
    speaker_name: z.string().min(2)
      .describe('Full name of the speaker to profile'),
    speeches: z.array(incomingSpeechSchema).min(1)
      .describe('Array of speech objects — pass the `results` from bundestag_search_speeches straight through (speakerParty/speechType/firstName are accepted)')
  },

  async handler(params) {
    try {
      const result = await analysisService.getSpeakerProfile(
        params.speaker_name,
        normalizeSpeeches(params.speeches)
      );

      return {
        success: true,
        profile: {
          name: result.name,
          first_name: result.first_name,
          last_name: result.last_name,
          party: result.party,
          acad_title: result.acad_title,
          statistics: {
            total_speeches: result.total_speeches,
            formal_speeches: result.formal_speeches,
            wortbeitraege: result.wortbeitraege,
            befragung_responses: result.befragung_responses,
            total_words: result.total_words,
            avg_words_per_speech: result.avg_words_per_speech
          },
          vocabulary: {
            top_nouns: result.top_nouns,
            top_adjectives: result.top_adjectives,
            top_verbs: result.top_verbs
          },
          tone_scores: result.tone_scores,
          topic_scores: result.topic_scores
        }
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        tool: 'bundestag_speaker_profile'
      };
    }
  }
};

// =============================================================================
// Party Comparison Tool
// =============================================================================

export const partyComparisonTool = {
  name: 'bundestag_compare_parties',
  description: `Compare political parties based on their parliamentary speeches.

Analyzes speeches from multiple parties and creates a comparative profile including:

**Per-Party Statistics:**
- Number of speakers and speeches
- Total words and average speech length
- Top vocabulary (nouns, adjectives, verbs)

**Tone Comparison:**
- Aggression ranking (most to least aggressive rhetoric)
- Collaboration ranking (most to least collaborative)
- Solution-focus ranking (most to least solution-oriented)

**Topic Focus:**
- Which policy areas each party emphasizes
- Comparative topic scores across parties

TWO-STEP TOOL — do both steps yourself, automatically, without asking the user for
speeches. When the user asks to compare parties on a topic:
1. Call bundestag_search_speeches(query="<topic>", limit=100-200, fields="full") first
   (optionally filtered by date). Use a high limit so several parties are represented, and
   fields:"full" so the analysis sees complete speech text, not the truncated snippet.
2. Pass that call's \`results\` array straight into this tool's \`speeches\` — the search
   field speakerParty is accepted and mapped to party, and speeches are grouped by party
   automatically.

Example:
1. const r = bundestag_search_speeches(query="Klimaschutz", limit=150, fields="full")
2. bundestag_compare_parties(speeches=r.results)`,

  inputSchema: {
    speeches: z.array(incomingSpeechSchema).min(1)
      .describe('Array of speech objects — pass the `results` from bundestag_search_speeches straight through (speakerParty is accepted and mapped to party)'),
    parties: z.array(z.string()).optional()
      .describe('Filter to specific parties (e.g., ["CDU/CSU", "SPD", "GRÜNE"])'),
    wahlperiode: z.number().int().default(21)
      .describe('Wahlperiode for context (default: 21)'),
    top_n: z.number().int().min(5).max(100).default(20)
      .describe('Number of top words per party (default: 20)')
  },

  async handler(params) {
    try {
      const speeches = normalizeSpeeches(params.speeches);
      if (!speeches.some((s) => s.party)) {
        return {
          error: true,
          message: 'None of the supplied speeches has a party. Pass results from bundestag_search_speeches (which include speakerParty), or set a `party` on each speech.',
          tool: 'bundestag_compare_parties'
        };
      }

      const result = await analysisService.compareParties(speeches, {
        parties: params.parties,
        wahlperiode: params.wahlperiode,
        topN: params.top_n
      });

      return {
        success: true,
        comparison: {
          wahlperiode: result.wahlperiode,
          parties_compared: result.parties_compared,
          party_profiles: result.party_profiles,
          rankings: {
            aggression: result.aggression_ranking,
            collaboration: result.collaboration_ranking,
            solution_focus: result.solution_focus_ranking
          }
        }
      };
    } catch (err) {
      return {
        error: true,
        message: err.message,
        tool: 'bundestag_compare_parties'
      };
    }
  }
};

// =============================================================================
// Export all analysis tools
// =============================================================================

export const analysisTools = [
  extractSpeechesTool,
  analyzeTextTool,
  analyzeToneTool,
  classifyTopicsTool,
  analysisHealthTool,
  speakerProfileTool,
  partyComparisonTool
];
