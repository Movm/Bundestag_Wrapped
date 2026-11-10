import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import type { ToneAnalysis, PartyProfile, ExtendedToneScores } from '@/data/wrapped';
import { getPartyTone } from '@/lib/party-colors';
import { Slide } from '@/design-system/components/Slide';
import { Display, Eyebrow, Mark, Note } from '@/design-system/components/Type';
import { ENTER } from '@/design-system/motion';
import { sortParties } from './constants';
import { LegacyResultView } from './LegacyResultView';
import './tone.css';

interface ResultViewProps {
  toneAnalysis: ToneAnalysis;
}

// Generate a holistic one-word summary based on ALL tone scores
function getHolisticSummary(scores: ExtendedToneScores): string {
  const {
    aggression,
    collaboration,
    solution_focus,
    demand_intensity,
    affirmative,
    labeling,
    discriminatory,
    inclusivity,
  } = scores;

  // Calculate composite traits
  const isConstructive = solution_focus > 50 && collaboration > 40;
  const isAggressive = aggression > 5 || discriminatory > 3;
  const isDemanding = demand_intensity > 10;
  const isPositive = affirmative > 15 && aggression < 3;
  const isLabeling = labeling > 10;
  const isInclusive = inclusivity > 5 && discriminatory < 2;

  // Priority-based summary selection
  if (isAggressive && isLabeling) return 'Konfrontativ';
  if (isAggressive && isDemanding) return 'Kämpferisch';
  if (isConstructive && isPositive) return 'Lösungsorientiert';
  if (isConstructive && isInclusive) return 'Kooperativ';
  if (isDemanding && !isAggressive) return 'Fordernd';
  if (isPositive && collaboration > 50) return 'Verbindend';
  if (isLabeling && !isAggressive) return 'Analytisch';
  if (solution_focus > 60) return 'Pragmatisch';
  if (affirmative > 20) return 'Optimistisch';
  if (collaboration > 55) return 'Teamorientiert';

  return 'Sachlich'; // Default fallback
}

/** Flat party block: party colour as ground, one-word verdict, description, trait stickers. */
const PartyToneBlock = memo(function PartyToneBlock({ profile }: { profile: PartyProfile }) {
  return (
    <motion.li className="tone-block" style={{ background: getPartyTone(profile.party, 'light') }} variants={ENTER.pop}>
      <span className="tone-block__party">{profile.party}</span>
      <span className="tone-block__verdict">{getHolisticSummary(profile.scores)}</span>
      <p className="tone-block__text">{profile.description}</p>
      {profile.traits.length > 0 && (
        <ul className="tone-block__traits" aria-label={`Eigenschaften ${profile.party}`}>
          {profile.traits.slice(0, 3).map(trait => <li key={trait}>{trait}</li>)}
        </ul>
      )}
    </motion.li>
  );
});

export function ResultView({ toneAnalysis }: ResultViewProps) {
  const topParties = useMemo(() => {
    if (!toneAnalysis.partyProfiles) return [];
    return sortParties(toneAnalysis.partyProfiles).filter(p => p.party !== 'fraktionslos').slice(0, 5);
  }, [toneAnalysis.partyProfiles]);

  if (topParties.length === 0) {
    return <LegacyResultView toneAnalysis={toneAnalysis} />;
  }

  return (
    <Slide shapes="corner" footer={<Note className="ds-note--plate">Wertung nach Tonalität der Redebeiträge, nicht nach Inhalt.</Note>}>
      <div className="flex flex-col items-start gap-4">
        <Eyebrow>So klingen die Fraktionen</Eyebrow>
        <Display size="xl" face="wide">Fraktions-<Mark>Persönlichkeiten.</Mark></Display>
      </div>
      <ul className="tone-grid" aria-label="Fraktions-Persönlichkeiten">
        {topParties.map(profile => <PartyToneBlock key={profile.party} profile={profile} />)}
      </ul>
    </Slide>
  );
}
