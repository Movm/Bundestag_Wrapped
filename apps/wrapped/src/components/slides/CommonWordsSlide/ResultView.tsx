import { Enter, Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note, FitWord } from '@/design-system/components/Type';
import { ChipCloud } from '@/design-system/components/Data';

interface ResultViewProps {
  topics: string[];
}

export function ResultView({ topics }: ResultViewProps) {
  const [first, second, ...rest] = topics;
  return (
    <Slide
      shapes="corner"
      footer={<Note className="ds-note--plate">Diese Wörter erscheinen bei mehreren Parteien unter den Top 50.</Note>}
    >
      <div className="flex flex-col gap-4">
        <Enter><Eyebrow>Die meistgenutzten Wörter im Bundestag</Eyebrow></Enter>
        <Display size="lg" face="wide">Häufigste <Mark>Wörter.</Mark></Display>
      </div>
      {first && (
        <Enter className="ds-fit-scope">
          <span className="sr-only">Platz 1: </span>
          <FitWord word={first} max="9rem" />
        </Enter>
      )}
      {second && (
        <Enter>
          <span className="sr-only">Platz 2: </span>
          <Display size="md" face="wide" level={3} enter={false}>{second}</Display>
        </Enter>
      )}
      {rest.length > 0 && <ChipCloud words={rest} label="Weitere häufige Wörter" />}
    </Slide>
  );
}
