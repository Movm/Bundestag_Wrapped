import { memo } from 'react';
import { Link } from 'react-router';
import { Display, Eyebrow, Lead, Note } from '@/design-system/components/Type';
import { ActionButton } from '@/design-system/components/ActionButton';
import { Enter, Slide } from '@/design-system/components/Slide';
import { END_SLIDE_CONTENT } from '@/shared/end-slide';
import { resultTitle } from '@/lib/result-title';
import { useCorrectCount } from '@/stores/quizStore';
import type { SlideType } from '@/components/main-wrapped/constants';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

function GitHubIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface EndSlideProps {
  onRestart?: () => void;
  totalQuestions?: number;
  quizSlideIds?: readonly SlideType[];
}

const SOCIAL_ICONS: Record<string, React.FC> = {
  GitHub: GitHubIcon,
  LinkedIn: LinkedInIcon,
  X: XIcon,
  Instagram: InstagramIcon,
};

const LINK_BUTTON = 'ds-button ds-button--md ds-button--outline';

export const EndSlide = memo(function EndSlide({ onRestart, totalQuestions = 0, quizSlideIds = [] }: EndSlideProps) {
  const surface = editionSurface(useOptionalEdition());
  const correctCount = useCorrectCount(surface, quizSlideIds);
  const tier = resultTitle(correctCount, totalQuestions);
  return (
    <Slide shapes="cover">
      <Enter><Eyebrow>{END_SLIDE_CONTENT.header.label}</Eyebrow></Enter>
      <Display level={2} size="xl" className="hyphens-none">
        <span className="block text-wr-pink">Viele Worte.</span>{' '}
        <span className="block">Ein paar Überraschungen.</span>
      </Display>
      {tier && (
        <Lead className="max-w-[38rem]">
          Du hast {correctCount} von {totalQuestions} Fragen richtig beantwortet. <strong>{tier.title}.</strong> {tier.line}
        </Lead>
      )}
      <Lead className="max-w-[38rem]">{END_SLIDE_CONTENT.message.primary}</Lead>
      <Enter className="flex flex-wrap items-center gap-3">
        <ActionButton size="lg" icon="right" onClick={onRestart}>{END_SLIDE_CONTENT.buttons.restart}</ActionButton>
        <Link to={editionPath(surface, 'dokumentation')} className={LINK_BUTTON}>{END_SLIDE_CONTENT.buttons.documentation}</Link>
        <Link to={editionPath(surface, 'abgeordnete')} className={LINK_BUTTON}>{END_SLIDE_CONTENT.buttons.speakers}</Link>
        <a href={END_SLIDE_CONTENT.socialLinks[0].url} target="_blank" rel="noopener noreferrer" className={LINK_BUTTON}>
          <GitHubIcon />
          {END_SLIDE_CONTENT.buttons.github}
        </a>
      </Enter>
      <Enter className="flex flex-wrap items-center gap-4">
        <ul className="m-0 flex list-none gap-3 p-0">
          {END_SLIDE_CONTENT.socialLinks.map((link) => {
            const Icon = SOCIAL_ICONS[link.label];
            return (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-contrast inline-flex size-12 items-center justify-center rounded-full bg-contrast text-on-contrast"
                  aria-label={link.label}
                >
                  {Icon && <Icon />}
                </a>
              </li>
            );
          })}
        </ul>
        <Note className="ds-note--plate">{END_SLIDE_CONTENT.message.secondary}</Note>
      </Enter>
    </Slide>
  );
});
