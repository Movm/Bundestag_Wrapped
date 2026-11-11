import type { EditionQuizModel } from '@/domain/edition-quiz';
import type { EditionQuizConfiguration } from '@/generated/wrapped-contract-v1';
import type { SlideType } from './constants';

export const QUIZ_SLIDES = [
  'quiz-topic-riser', 'quiz-word-riser', 'quiz-youth-language',
  'quiz-topics', 'quiz-signature', 'quiz-speeches', 'quiz-drama',
  'quiz-discriminatory', 'quiz-common-words', 'quiz-moin',
  'quiz-tone', 'quiz-gender', 'quiz-mention', 'quiz-genz', 'quiz-chancellor',
] as const;

type DataQuizSlide = Exclude<(typeof QUIZ_SLIDES)[number], 'quiz-moin'>;

interface StoryGroup {
  readonly quiz: (typeof QUIZ_SLIDES)[number];
  /** A nested group is a chapter inside the story, shown only when its own quiz is answerable. */
  readonly slides: readonly (SlideType | StoryGroup)[];
  readonly comparisonSlides?: readonly SlideType[];
  /** Shown only when the edition counted earlier Jugendwörter (yearOverYear.youthLanguage.pastWinners). */
  readonly youthHistorySlides?: readonly SlideType[];
}

const GENZ_GROUP: StoryGroup = { quiz: 'quiz-genz', slides: ['intro-genz', 'quiz-genz', 'info-genz'] };

/**
 * The product story is intentionally expressed as explicit groups. A group is
 * shown only when its quiz is answerable, so an intro, explanation, or reveal
 * can never survive without its matching question.
 */
const STORY_TEMPLATE: readonly (SlideType | StoryGroup)[] = [
  'intro',
  'info-disclaimer',
  { quiz: 'quiz-topic-riser', slides: ['quiz-topic-riser', 'info-topic-riser', 'reveal-topic-risers', 'reveal-topic-riser-context'] },
  { quiz: 'quiz-word-riser', slides: ['quiz-word-riser', 'info-word-riser', 'reveal-word-risers'] },
  { quiz: 'quiz-topics', slides: ['intro-topics', 'quiz-topics', 'info-topics', 'reveal-topics', 'info-party-topics', 'reveal-party-topics'] },
  { quiz: 'quiz-signature', slides: ['intro-vocabulary', 'quiz-signature', 'info-signature', 'reveal-signature'], comparisonSlides: ['reveal-signature-movements'] },
  { quiz: 'quiz-speeches', slides: ['intro-speeches', 'quiz-speeches', 'info-speeches', 'chart-speeches'] },
  { quiz: 'quiz-drama', slides: ['intro-drama', 'quiz-drama', 'info-drama', 'reveal-drama'] },
  { quiz: 'quiz-discriminatory', slides: ['intro-discriminatory', 'quiz-discriminatory', 'info-discriminatory', 'reveal-discriminatory'] },
  { quiz: 'quiz-common-words', slides: ['intro-common-words', 'quiz-common-words', 'reveal-common-words'] },
  // One story: who says Jugendwörter? The Gen Z chapter sits between the
  // question and its answer, so the twist (not the young MPs) lands at the end.
  {
    quiz: 'quiz-youth-language',
    slides: ['quiz-youth-language', GENZ_GROUP, 'info-youth-language', 'reveal-youth-language'],
    youthHistorySlides: ['reveal-youth-history'],
  },
  // Moment of the year (e.g. Timmy der Wal), from the edition's mentions.
  { quiz: 'quiz-mention', slides: ['intro-mention', 'quiz-mention', 'info-mention'] },
  // Innen- oder Außenkanzler, from the edition's chancellor section.
  {
    quiz: 'quiz-chancellor',
    slides: ['intro-chancellor', 'quiz-chancellor', 'info-chancellor', 'reveal-chancellor', 'reveal-chancellor-focus', 'reveal-chancellor-topics', 'reveal-chancellor-words'],
  },
  // Gen Z MPs against older MPs, from the edition's generations section.
  GENZ_GROUP,
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
  hasYearOverYear = false,
  hasYouthHistory = false,
): SlideType[] {
  const groupSlides = (group: StoryGroup): SlideType[] => [
    ...group.slides.flatMap((entry) => {
      if (!isStoryGroup(entry)) return [entry];
      return hasQuiz(model, entry.quiz as DataQuizSlide) ? groupSlides(entry) : [];
    }),
    ...(hasYearOverYear ? group.comparisonSlides ?? [] : []),
    ...(hasYouthHistory ? group.youthHistorySlides ?? [] : []),
  ];
  // A chapter nested in an earlier story is not repeated when its own group comes up.
  const once = (slides: SlideType[]) => slides.filter((slide, index) => slides.indexOf(slide) === index);
  if (configuration) {
    const groups = new Map(
      STORY_TEMPLATE.filter(isStoryGroup).map((group) => [group.quiz, group]),
    );
    return once([
      'intro',
      'info-disclaimer',
      ...configuration.groups.flatMap(({ id }) => {
        const group = groups.get(id as (typeof QUIZ_SLIDES)[number]);
        if (group) return model[id] ? groupSlides(group) : [];
        // Configuration validation guarantees that custom groups have a question.
        return model[id] ? [id as SlideType] : [];
      }),
      'share',
      'finale',
    ]);
  }
  return once(STORY_TEMPLATE.flatMap((entry) => {
    if (!isStoryGroup(entry)) return [entry];
    const available = entry.quiz === 'quiz-moin'
      ? hasAvailableMoinQuiz(moinSpeakers)
      : hasQuiz(model, entry.quiz);
    return available ? groupSlides(entry) : [];
  }));
}

export function getQuizSlides(slides: readonly SlideType[]): `quiz-${string}`[] {
  return slides.filter((slide): slide is `quiz-${string}` => slide.startsWith('quiz-'));
}
