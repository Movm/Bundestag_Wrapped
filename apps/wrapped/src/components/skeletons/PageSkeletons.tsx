import { SkeletonShimmer as Block, SkeletonStatus } from '@/components/ui/Skeleton';

/** Abgeordnete search: heading, intro, search field. */
export function AbgeordneteSkeleton() {
  return (
    <SkeletonStatus label="Abgeordnete werden geladen" className="min-h-screen page-bg pt-14 flex flex-col items-center justify-center gap-3 px-4 pb-20">
      <Block className="h-12 w-full max-w-md" />
      <Block className="h-4 w-full max-w-sm" />
      <Block className="h-4 w-3/4 max-w-xs mb-5" />
      <Block className="h-16 w-full max-w-lg rounded-2xl" />
    </SkeletonStatus>
  );
}

/** Profile hero: portrait, name in two lines, lead, actions. */
export function ProfileSkeleton() {
  return (
    <SkeletonStatus label="Profil wird geladen" className="mp-page flex flex-col gap-4 py-24 px-6 sm:flex-row sm:items-center sm:gap-10">
      <Block className="aspect-square w-40 shrink-0 rounded-full sm:w-56" />
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <Block className="h-6 w-28 rounded-full" />
        <Block className="h-14 w-4/5" />
        <Block className="h-14 w-3/5" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-2/3" />
        <div className="mt-3 flex gap-3">
          <Block className="h-11 w-36 rounded-full" />
          <Block className="h-11 w-28 rounded-full" />
        </div>
      </div>
    </SkeletonStatus>
  );
}

/** Signature-word quiz: question, four answers. */
export function QuizSkeleton() {
  return (
    <SkeletonStatus label="Quiz wird geladen" className="mp-page grid place-items-center px-6">
      <div className="flex w-full max-w-2xl flex-col gap-3">
        <Block className="h-5 w-24 rounded-full" />
        <Block className="h-12 w-full" />
        <Block className="h-12 w-2/3 mb-4" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(index => <Block key={index} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    </SkeletonStatus>
  );
}

/** Perfect Match start: title, intro, start button. */
export function PerfectMatchSkeleton() {
  return (
    <SkeletonStatus label="Perfect Match wird geladen" className="flex w-full max-w-2xl flex-col items-start gap-3">
      <Block className="h-14 w-4/5" />
      <Block className="h-14 w-1/2 mb-3" />
      <Block className="h-4 w-full" />
      <Block className="h-4 w-3/4" />
      <Block className="mt-4 h-12 w-44 rounded-full" />
    </SkeletonStatus>
  );
}

/** Speaker story cover: name, year, start button. */
export function SpeakerStorySkeleton() {
  return (
    <SkeletonStatus label="Wrapped wird geladen" className="flex w-full max-w-xl flex-col items-center gap-3">
      <Block className="h-6 w-32 rounded-full" />
      <Block className="h-16 w-full" />
      <Block className="h-16 w-2/3" />
      <Block className="mt-6 h-12 w-48 rounded-full" />
    </SkeletonStatus>
  );
}
