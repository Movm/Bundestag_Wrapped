import type { EditionQuizModel } from '@/domain/edition-quiz';
import type { EditionQuizConfiguration } from '@/generated/wrapped-contract-v1';
import type { SlideType } from './constants';

export const QUIZ_SLIDES = [
  'quiz-topics', 'quiz-signature', 'quiz-speeches', 'quiz-drama',
  'quiz-discriminatory', 'quiz-common-words', 'quiz-moin',
  'quiz-tone', 'quiz-gender',
] as const;

type DataQuizSlide = Exclude<(typeof QUIZ_SLIDES)[number], 'quiz-moin'>;

interface StoryGroup {
  readonly quiz: (typeof QUIZ_SLIDES)[number];
  readonly slides: readonly SlideType[];
}

/**
 * The product story is intentionally expressed as explicit groups. A group is
 * shown only when its quiz is answerable, so an intro, explanation, or reveal
 * can never survive without its matching question.
 */
const STORY_TEMPLATE: readonly (SlideType | StoryGroup)[] = [
  'intro',
  'info-disclaimer',
  { quiz: 'quiz-topics', slides: ['intro-topics', 'quiz-topics', 'info-topics', 'reveal-topics', 'info-party-topics', 'reveal-party-topics'] },
  { quiz: 'quiz-signature', slides: ['intro-vocabulary', 'quiz-signature', 'info-signature', 'reveal-signature'] },
  { quiz: 'quiz-speeches', slides: ['intro-speeches', 'quiz-speeches', 'info-speeches', 'chart-speeches'] },
  { quiz: 'quiz-drama', slides: ['intro-drama', 'quiz-drama', 'info-drama', 'reveal-drama'] },
  { quiz: 'quiz-discriminatory', slides: ['intro-discriminatory', 'quiz-discriminatory', 'info-discriminatory', 'reveal-discriminatory'] },
  { quiz: 'quiz-common-words', slides: ['intro-common-words', 'quiz-common-words', 'reveal-common-words'] },
  { quiz: 'quiz-moin', slides: ['intro-moin', 'quiz-moin', 'info-moin', 'reveal-moin'] },
  { quiz: 'quiz-tone', slides: ['intro-tone', 'quiz-tone', 'info-tone', 'reveal-tone'] },
  { quiz: 'quiz-gender', slides: ['quiz-gender', 'info-gender', 'reveal-gender'] },
  'share',
  'finale',
];

function isStoryGroup(entry: SlideType | StoryGroup): entry is StoryGroup {
  return typeof entry !== 'string';
}

export interface MoinQuizCandidate {
  name: string;
  party: string;
}

export function hasAvailableMoinQuiz(speakers: readonly MoinQuizCandidate[] | null | undefined): boolean {
  const distinctOptions = new Set((speakers ?? []).map(({ name, party }) => `${name}\u0000${party}`));
  return distinctOptions.size >= 2;
}

function hasQuiz(model: EditionQuizModel, slide: DataQuizSlide): boolean {
  return model[slide] !== undefined;
}

/** Builds the only list of slides that may be rendered for the loaded edition. */
export function buildActiveSlidePlan(
  model: EditionQuizModel,
  moinSpeakers: readonly MoinQuizCandidate[] | null | undefined,
  configuration?: EditionQuizConfiguration,
): SlideType[] {
  if (configuration) {
    const groups = new Map(
      STORY_TEMPLATE.filter(isStoryGroup).map((group) => [group.quiz, group]),
    );
    return [
      'intro',
      'info-disclaimer',
      ...configuration.groups.flatMap(({ id }) => {
        const group = groups.get(id as (typeof QUIZ_SLIDES)[number]);
        if (group) return model[id] ? [...group.slides] : [];
        // Configuration validation guarantees that custom groups have a question.
        return model[id] ? [id as SlideType] : [];
      }),
      'share',
      'finale',
    ];
  }
  return STORY_TEMPLATE.flatMap((entry) => {
    if (!isStoryGroup(entry)) return [entry];
    const available = entry.quiz === 'quiz-moin'
      ? hasAvailableMoinQuiz(moinSpeakers)
      : hasQuiz(model, entry.quiz);
    return available ? [...entry.slides] : [];
  });
}

export function getQuizSlides(slides: readonly SlideType[]): `quiz-${string}`[] {
  return slides.filter((slide): slide is `quiz-${string}` => slide.startsWith('quiz-'));
}
