import type { WrappedData } from '@/data/wrapped';

export class MissingMetricError extends Error {}

function required<T>(value: T | undefined | null, name: string): T {
  if (value === undefined || value === null) throw new MissingMetricError('Missing metric: ' + name);
  return value;
}

export function topTopic(data: WrappedData): string {
  return required(data.topicAnalysis?.topTopics[0]?.topic ?? data.hotTopics[0], 'topTopic');
}

export function topSpeakerByWords(data: WrappedData) {
  return required(data.topSpeakersByWords[0], 'topSpeakerByWords');
}

export function topInterrupter(data: WrappedData) {
  return required(data.drama?.topZwischenrufer[0], 'topInterrupter');
}

export function deterministicDecoys<T extends { party: string }>(items: readonly T[], answer: T, count = 3): T[] {
  return items.filter(item => item.party !== answer.party).sort((a, b) => a.party.localeCompare(b.party)).slice(0, count);
}

export function resolveTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(required(values[name], name)));
}
