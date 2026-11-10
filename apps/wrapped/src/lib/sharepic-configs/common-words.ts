import type { SlideConfig } from './types';

export const commonWordsConfig: SlideConfig = {
  title: 'Häufigste Wörter',
  subtitle: 'Die meistgenutzten Wörter im Bundestag',
  filename: 'bundestag-wrapped-common-words',
};

export const wordCloudColors = ['#ff4fa0', '#7b3ff2', '#ffffff'];

export const wordSizes = [
  { fontSize: 48, weight: 900 }, // index 0-1
  { fontSize: 40, weight: 800 }, // index 2-3
  { fontSize: 32, weight: 700 }, // index 4-5
  { fontSize: 26, weight: 600 }, // index 6-9
  { fontSize: 22, weight: 500 }, // index 10+
];
