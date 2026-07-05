/**
 * MCP Tools for Abgeordnetenwatch — MP transparency data (voting behaviour,
 * side-jobs, roll-call tallies) layered on top of the official DIP record.
 *
 * All data comes from the open Abgeordnetenwatch API (CC0). These tools return
 * pre-trimmed, source-linked facts. Guardrails for the model live in each tool's
 * description and in the server instructions: only stated facts, always cite the
 * source, explain income levels 1–10 rather than inventing sums, Germany only.
 */

import { z } from 'zod';
import * as aw from '../api/abgeordnetenwatch.js';
import { getPerson as getDipPerson } from '../api/bundestag.js';
import { debug } from '../utils/logger.js';

const nameSchema = z.string().min(2)
  .describe('Full name of the MP, e.g. "Robert Habeck" (fuzzy CONTAINS match)');

const politicianIdSchema = z.number().int().positive()
  .describe('Abgeordnetenwatch politician ID (from abgeordnetenwatch_search_politicians)');

const limitSchema = z.number().int().min(1).max(50).default(15)
  .describe('Maximum number of results');

/**
 * Resolve a `{ name | politicianId }` selector to a politician + current mandate.
 * Name is a fuzzy CONTAINS match, so surface alternative candidates as notes.
 */
async function resolveMandate({ name, politicianId }) {
  const notes = [];
  let politician = null;

  if (politicianId) {
    politician = { id: politicianId, name: '', party: null, url: null };
  } else if (name) {
    const candidates = await aw.searchPoliticians(name, 5);
    if (candidates.length === 0) {
      return { politician: null, mandate: null, notes: [`Keine:n Abgeordnete:n zu „${name}" gefunden.`] };
    }
    politician = candidates[0];
    if (candidates.length > 1) {
      notes.push(`${candidates.length - 1} weitere Namenstreffer (z. B. ${candidates[1].name}).`);
    }
  } else {
    return { politician: null, mandate: null, notes: ['Bitte name oder politicianId angeben.'] };
  }

  const mandate = await aw.getCurrentMandate(politician.id);
  if (!mandate) {
    notes.push(`Kein aktuelles Mandat für ${politician.name || `Politician ${politician.id}`} gefunden — evtl. nicht (mehr) im Parlament.`);
  } else if (!politician.name) {
    politician.name = mandate.politicianName;
  }
  return { politician, mandate, notes };
}

/** Exact votes on the top polls matching a topic keyword (≤3 polls). */
async function fetchTopicVotes(mandateId, topic) {
  const polls = await aw.searchPolls({ keyword: topic, limit: 3 });
  if (polls.length === 0) return [];
  const perPoll = await Promise.all(
    polls.map((p) => aw.getVotes({ mandateId, pollId: p.pollId, limit: 1 }))
  );
  return perPoll.flat();
}

export const searchPoliticiansTool = {
  name: 'abgeordnetenwatch_search_politicians',
  description: `Resolve an MP name to Abgeordnetenwatch politician candidates (id, party, profile URL).
Fuzzy CONTAINS match — a query can return several people; pick by party/period. Germany only (CC0 data).
Use the returned id with the voting-record / side-jobs tools. Always cite the abgeordnetenwatch.de profile URL.`,
  inputSchema: {
    name: nameSchema,
    limit: z.number().int().min(1).max(20).default(5).describe('Max candidates')
  },
  async handler(params) {
    try {
      const candidates = await aw.searchPoliticians(params.name, params.limit ?? 5);
      return { success: true, source: 'abgeordnetenwatch', query: params.name, count: candidates.length, candidates };
    } catch (err) {
      return { error: true, message: err.message, tool: 'abgeordnetenwatch_search_politicians' };
    }
  }
};

export const votingRecordTool = {
  name: 'abgeordnetenwatch_voting_record',
  description: `An MP's roll-call voting behaviour from Abgeordnetenwatch: current mandate, recent named votes, and — if you pass a topic — their exact vote on matching polls.
Give either \`name\` (resolved fuzzily) or \`politicianId\`. Vote values: yes / no / abstain / no_show. Report the concrete vote with the poll label and source link; do not infer motives. Germany only.`,
  inputSchema: {
    name: nameSchema.optional(),
    politicianId: politicianIdSchema.optional(),
    topic: z.string().optional().describe('Optional topic keyword to pin exact votes, e.g. "Bürgergeld"'),
    limit: limitSchema
  },
  async handler(params) {
    try {
      const { politician, mandate, notes } = await resolveMandate(params);
      if (!politician) return { success: true, source: 'abgeordnetenwatch', found: false, notes };
      if (!mandate) return { success: true, source: 'abgeordnetenwatch', found: false, politician, notes };

      const [recentVotes, topicVotes] = await Promise.all([
        aw.getVotes({ mandateId: mandate.mandateId, limit: params.limit ?? 15 }),
        params.topic ? fetchTopicVotes(mandate.mandateId, params.topic) : Promise.resolve([])
      ]);
      return { success: true, source: 'abgeordnetenwatch', found: true, politician, mandate, topicVotes, recentVotes, notes };
    } catch (err) {
      return { error: true, message: err.message, tool: 'abgeordnetenwatch_voting_record' };
    }
  }
};

export const sidejobsTool = {
  name: 'abgeordnetenwatch_sidejobs',
  description: `An MP's declared Nebentätigkeiten (side-jobs / outside income) from Abgeordnetenwatch, highest income first.
Give either \`name\` or \`politicianId\`. Income is reported as the official level 1–10 (level 1 = up to 1.000 €, level 10 = over 250.000 €) — state the LEVEL and explain it; never invent an exact euro sum. Report neutrally; these are public transparency facts. Germany only.`,
  inputSchema: {
    name: nameSchema.optional(),
    politicianId: politicianIdSchema.optional(),
    limit: z.number().int().min(1).max(30).default(10).describe('Max side-jobs')
  },
  async handler(params) {
    try {
      const { politician, mandate, notes } = await resolveMandate(params);
      if (!politician) return { success: true, source: 'abgeordnetenwatch', found: false, notes };
      if (!mandate) return { success: true, source: 'abgeordnetenwatch', found: false, politician, notes };

      const sideJobs = await aw.getSideJobs(mandate.mandateId, params.limit ?? 10);
      return { success: true, source: 'abgeordnetenwatch', found: true, politician, mandate, sideJobs, notes };
    } catch (err) {
      return { error: true, message: err.message, tool: 'abgeordnetenwatch_sidejobs' };
    }
  }
};

export const searchPollsTool = {
  name: 'abgeordnetenwatch_search_polls',
  description: `Find named Bundestag roll-call votes (Abstimmungen) by keyword and/or topic id, newest first.
Returns poll id, label, date, accepted/rejected and a short intro. Feed a poll id into abgeordnetenwatch_poll_tally for the per-faction result. Germany only.`,
  inputSchema: {
    keyword: z.string().optional().describe('Search the poll label, e.g. "Heizungsgesetz"'),
    topicId: z.number().int().positive().optional().describe('Abgeordnetenwatch policy-area topic id'),
    limit: z.number().int().min(1).max(30).default(8).describe('Max polls')
  },
  async handler(params) {
    try {
      if (!params.keyword && !params.topicId) {
        return { error: true, message: 'Provide keyword or topicId', tool: 'abgeordnetenwatch_search_polls' };
      }
      const polls = await aw.searchPolls({ keyword: params.keyword, topicId: params.topicId, limit: params.limit ?? 8 });
      return { success: true, source: 'abgeordnetenwatch', count: polls.length, polls };
    } catch (err) {
      return { error: true, message: err.message, tool: 'abgeordnetenwatch_search_polls' };
    }
  }
};

export const pollTallyTool = {
  name: 'abgeordnetenwatch_poll_tally',
  description: `Aggregated result of a named Bundestag vote (Abstimmung): total yes/no/abstain/no_show plus a per-faction breakdown.
Pass a poll id from abgeordnetenwatch_search_polls. The tally is computed over all cast votes. State whether the motion was accepted and cite the source. Germany only.`,
  inputSchema: {
    pollId: z.number().int().positive().describe('Abgeordnetenwatch poll id')
  },
  async handler(params) {
    try {
      const tally = await aw.getPollTally(params.pollId);
      return { success: true, source: 'abgeordnetenwatch', tally };
    } catch (err) {
      return { error: true, message: err.message, tool: 'abgeordnetenwatch_poll_tally' };
    }
  }
};

export const politicianProfileTool = {
  name: 'abgeordnetenwatch_politician_profile',
  description: `Combined transparency profile of one MP from Abgeordnetenwatch: mandate + recent votes + side-jobs in a single call.
Give \`name\`, OR \`bundestagPersonId\` (a DIP person id from bundestag_get_person / bundestag_search_personen) to bridge the official record to the transparency layer — the two systems share NO id, so this joins them by NAME. Watch the \`notes\` for ambiguous matches and confirm identity before attributing votes. Explain income levels 1–10; cite the source. Germany only.`,
  inputSchema: {
    name: nameSchema.optional(),
    bundestagPersonId: z.number().int().positive().optional()
      .describe('DIP person id to bridge from the official record (joined by name)'),
    voteLimit: z.number().int().min(1).max(30).default(10).describe('Max recent votes'),
    sidejobLimit: z.number().int().min(1).max(30).default(10).describe('Max side-jobs')
  },
  async handler(params) {
    try {
      const notes = [];
      let name = params.name;

      if (!name && params.bundestagPersonId) {
        const dip = await getDipPerson(params.bundestagPersonId);
        if (!dip || dip.__notFound) {
          return { error: true, message: `DIP person ${params.bundestagPersonId} not found`, tool: 'abgeordnetenwatch_politician_profile' };
        }
        name = `${dip.vorname ?? ''} ${dip.nachname ?? ''}`.trim();
        if (!name) {
          return { error: true, message: `DIP person ${params.bundestagPersonId} has no name to join on`, tool: 'abgeordnetenwatch_politician_profile' };
        }
        notes.push(`Über den Namen „${name}" (DIP-Person ${params.bundestagPersonId}) mit Abgeordnetenwatch verknüpft — Identität bitte prüfen.`);
      }
      if (!name) {
        return { error: true, message: 'Provide name or bundestagPersonId', tool: 'abgeordnetenwatch_politician_profile' };
      }

      const resolved = await resolveMandate({ name });
      notes.push(...resolved.notes);
      const { politician, mandate } = resolved;
      if (!politician) return { success: true, source: 'abgeordnetenwatch', found: false, notes };
      if (!mandate) return { success: true, source: 'abgeordnetenwatch', found: false, politician, notes };

      const [recentVotes, sideJobs] = await Promise.all([
        aw.getVotes({ mandateId: mandate.mandateId, limit: params.voteLimit ?? 10 }),
        aw.getSideJobs(mandate.mandateId, params.sidejobLimit ?? 10)
      ]);
      debug('Tool', `politician_profile resolved ${politician.name}`, { votes: recentVotes.length, sidejobs: sideJobs.length });
      return { success: true, source: 'abgeordnetenwatch', found: true, politician, mandate, recentVotes, sideJobs, notes };
    } catch (err) {
      return { error: true, message: err.message, tool: 'abgeordnetenwatch_politician_profile' };
    }
  }
};

export const abgeordnetenwatchTools = [
  searchPoliticiansTool,
  votingRecordTool,
  sidejobsTool,
  searchPollsTool,
  pollTallyTool,
  politicianProfileTool
];
