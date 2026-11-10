/**
 * Shared types for sharepic slide configurations.
 */

export interface SlideConfig {
  title: string;
  subtitle: string;
  filename: string;
}

export interface CardConfig {
  width: number;
  height: number;
  gap: number;
  radius: number;
}

export interface ChampionCardConfig extends CardConfig {
  championWidth: number;
  championHeight: number;
}

export const CHAMPION_COLORS = {
  bg: '#ff4fa0',
  bgLight: '#ff4fa0',
  border: '#ffffff',
  text: '#0e0a14',
} as const;

export const SIZE = 1080;
