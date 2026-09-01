/**
 * GENERATED FILE — DO NOT EDIT.
 * Source: contracts/wrapped/v1.schema.json
 * Run: pnpm contract:generate
 */

export type NonEmptyString = string;

export type IsoDate = string;

export type IsoDateTime = string;

export type Count = number;

export type Ratio = number;

export interface WordCount {
  "word": NonEmptyString;
  "count": Count;
}

export interface SignatureWord {
  "word": NonEmptyString;
  "ratio": Ratio;
}

export interface KeyTopic {
  "word": NonEmptyString;
  "count": Count;
  "ratio": Ratio;
}

export interface PartyStats {
  "party": NonEmptyString;
  "speeches": Count;
  "wortbeitraege": Count;
  "totalWords": Count;
  "uniqueSpeakers": Count;
  "topWords": Array<WordCount>;
  "signatureWords": Array<SignatureWord>;
  "keyTopics": Array<KeyTopic>;
  "avgSpeechLength": Ratio;
  "descriptiveness": Ratio;
  "topSpeaker": {
  "name": NonEmptyString;
  "speeches": Count;
};
}

export interface Classification {
  "positive": NonEmptyString;
  "negative": NonEmptyString;
  "neutral": NonEmptyString;
}

export interface ZwischenrufStats {
  "total": Count;
  "positive": Count;
  "negative": Count;
  "neutral": Count;
  "positivePercent": Ratio;
  "negativePercent": Ratio;
  "neutralPercent": Ratio;
  "classification": Classification;
}

export interface NamedPartyCount {
  "name": NonEmptyString;
  "party": NonEmptyString;
  "count": Count;
}

export interface PartyCount {
  "party": NonEmptyString;
  "count": Count;
}

export interface DramaStats {
  "topZwischenrufer": Array<NamedPartyCount>;
  "mostInterrupted": Array<NamedPartyCount>;
  "applauseChampions": Array<PartyCount>;
  "loudestHecklers": Array<PartyCount>;
  "zwischenrufStats": ZwischenrufStats;
}

export interface TopSpeaker {
  "name": NonEmptyString;
  "party": NonEmptyString;
  "speeches": Count;
}

export interface SpeakerWords {
  "name": NonEmptyString;
  "party": NonEmptyString;
  "totalWords": Count;
  "speeches": Count;
}

export interface SpeakerAverageWords {
  "name": NonEmptyString;
  "party": NonEmptyString;
  "avgWords": Ratio;
  "totalWords": Count;
  "speeches": Count;
}

export interface FunFact {
  "emoji": NonEmptyString;
  "value": NonEmptyString;
  "label": NonEmptyString;
  "sublabel"?: NonEmptyString;
  "category": "general" | "tone" | "gender";
}

export interface GenderDistribution {
  "male": Count;
  "female": Count;
  "unknown": Count;
  "femalePercent": Ratio;
}

export interface GenderByParty {
  "party": NonEmptyString;
  "male": Count;
  "female": Count;
  "femaleRatio": Ratio;
}

export interface GenderSpeaker {
  "name": NonEmptyString;
  "party": NonEmptyString;
  "count": Count;
}

export interface InterruptionPatterns {
  "maleInterruptions": Count;
  "femaleInterruptions": Count;
  "maleInterrupted": Count;
  "femaleInterrupted": Count;
}

export interface GenderAnalysis {
  "distribution": GenderDistribution;
  "byParty": Array<GenderByParty>;
  "topFemaleSpeakersReden": Array<GenderSpeaker>;
  "topMaleSpeakersReden": Array<GenderSpeaker>;
  "topFemaleSpeakersAll"?: Array<GenderSpeaker>;
  "topMaleSpeakersAll"?: Array<GenderSpeaker>;
  "interruptionPatterns": InterruptionPatterns;
  "speechLength"?: {
  "male": Ratio;
  "female": Ratio;
  "unknown": Ratio;
};
  "academicTitles"?: {
  "male": Ratio;
  "female": Ratio;
};
  "_metrics"?: Record<string, unknown>;
}

export interface BefragungResponder {
  "name": NonEmptyString;
  "party": NonEmptyString;
  "responses": Count;
}

export interface ToneRanking {
  "party": NonEmptyString;
  "score": Ratio;
}

export interface ExtendedToneScores {
  "affirmative": Ratio;
  "aggression": Ratio;
  "labeling": Ratio;
  "solution_focus": Ratio;
  "collaboration": Ratio;
  "demand_intensity": Ratio;
  "acknowledgment": Ratio;
  "authority": Ratio;
  "future_orientation": Ratio;
  "emotional_intensity": Ratio;
  "inclusivity": Ratio;
  "discriminatory": Ratio;
}

export interface PartyProfile {
  "party": NonEmptyString;
  "category": NonEmptyString;
  "categoryName": NonEmptyString;
  "emoji": NonEmptyString;
  "description": NonEmptyString;
  "rank": Count;
  "totalParties": Count;
  "score": Ratio;
  "traits": Array<NonEmptyString>;
  "scores": ExtendedToneScores;
  "archetype"?: NonEmptyString;
  "archetypeName"?: NonEmptyString;
}

export interface ToneParty {
  "party": NonEmptyString;
  "scores": Record<string, Ratio>;
  "topAffirmative": Array<WordCount>;
  "topCritical": Array<WordCount>;
  "topAggressive": Array<WordCount>;
  "topLabeling": Array<WordCount>;
  "topSolution": Array<WordCount>;
  "topProblem": Array<WordCount>;
  "topCollaborative": Array<WordCount>;
  "topConfrontational": Array<WordCount>;
  "topDemanding": Array<WordCount>;
  "topAcknowledging": Array<WordCount>;
}

export interface ToneRankings {
  "affirmative": Array<ToneRanking>;
  "aggression": Array<ToneRanking>;
  "labeling": Array<ToneRanking>;
  "solutionFocus": Array<ToneRanking>;
  "collaboration": Array<ToneRanking>;
  "demandIntensity": Array<ToneRanking>;
  "acknowledgment": Array<ToneRanking>;
  "authority"?: Array<ToneRanking>;
  "futureOrientation"?: Array<ToneRanking>;
  "emotionalIntensity"?: Array<ToneRanking>;
  "inclusivity"?: Array<ToneRanking>;
  "discriminatory"?: Array<ToneRanking>;
  "discriminatoryCounts"?: Array<PartyCount>;
}

export interface ToneAnalysis {
  "parties": Array<ToneParty>;
  "partyProfiles": Record<string, PartyProfile>;
  "rankings": ToneRankings;
}

export interface TopicScore {
  "topic": NonEmptyString;
  "score": Ratio;
  "rank": Count;
}

export interface TopicAnalysis {
  "byParty": Record<string, Record<string, Ratio>>;
  "overall": Record<string, Ratio>;
  "topTopics": Array<TopicScore>;
}

export interface QuizQuestion {
  "id": NonEmptyString;
  "type": "guess-party" | "prediction" | "emoji-quiz";
  "question": NonEmptyString;
  "word"?: NonEmptyString;
  "party"?: NonEmptyString;
  "options": Array<NonEmptyString>;
  "correctAnswer": NonEmptyString;
  "explanation": NonEmptyString;
  "ratio"?: Ratio;
  "swiftie"?: NamedParty;
  "decoys"?: Array<NamedParty>;
}

export interface NamedParty {
  "name": NonEmptyString;
  "party": NonEmptyString;
}

export interface WrappedMetadata {
  "generatedAt": IsoDateTime;
  "totalSpeeches": Count;
  "redenCount": Count;
  "wortbeitraegeCount": Count;
  "totalWords": Count;
  "partyCount": Count;
  "speakerCount": Count;
  "wahlperiode": Count;
  "sitzungen": Count;
}

export interface WrappedData {
  "metadata": WrappedMetadata;
  "parties": Array<PartyStats>;
  "drama": DramaStats;
  "topSpeakers": Array<TopSpeaker>;
  "topBefragungResponders": Array<BefragungResponder>;
  "topSpeakersByWords": Array<SpeakerWords>;
  "topSpeakersByAvgWords": Array<SpeakerAverageWords>;
  "hotTopics": Array<NonEmptyString>;
  "quizQuestions"?: Array<QuizQuestion>;
  "toneAnalysis": ToneAnalysis | null;
  "topicAnalysis": TopicAnalysis | null;
  "funFacts": Array<FunFact>;
  "genderAnalysis": GenderAnalysis | null;
  "moinSpeakers": Array<NamedPartyCount>;
  "topQuestionAskers": Array<NamedPartyCount>;
}

export type EditionStatus = "draft" | "preview" | "frozen" | "published" | "superseded";

export interface EditionPeriod {
  "start": IsoDate;
  "end": IsoDate;
  "timezone": "Europe/Berlin";
  "wahlperioden": Array<number>;
}

export interface Coverage {
  "protocolCount": Count;
  "firstProtocolDate": IsoDate;
  "lastProtocolDate": IsoDate;
  "complete": boolean;
}

export interface EditionAssets {
  "wrapped": NonEmptyString;
  "speakerIndex": NonEmptyString;
  "speakersBase": NonEmptyString;
  "speeches": NonEmptyString;
  "words": NonEmptyString;
  "wordRankings": NonEmptyString;
  "topicRankings": NonEmptyString;
}

export interface EditionManifest {
  "schemaVersion": 1;
  "editionId": NonEmptyString;
  "year": number;
  "title": NonEmptyString;
  "status": EditionStatus;
  "period": EditionPeriod;
  "dataVersion": NonEmptyString;
  "generatedAt": IsoDateTime;
  "coverage": Coverage;
  "assets": EditionAssets;
  "content": NonEmptyString;
  "checksums": NonEmptyString;
}

export interface EditionContent {
  "editionId": NonEmptyString;
  "year": number;
}

export interface EditionSummary {
  "id": NonEmptyString;
  "year": number;
  "status": EditionStatus;
  "manifestUrl": NonEmptyString;
}

export interface EditionsIndex {
  "schemaVersion": 1;
  "currentEdition": NonEmptyString;
  "editions": Array<EditionSummary>;
}
