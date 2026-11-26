import { type MusicCommand } from '../theme-music/bridge';
import { type ThemeType } from '../theme-music/types';

export const NATIVE_PROTOCOL = 1;
export interface NativeShellInfo { protocol: number; platform: 'ios' | 'android'; appVersion: string }

export type MenuColor = 'pink' | 'violet' | 'white' | 'mint';
export interface MenuEntry { href: string; label: string; title: string; color: MenuColor; rotate: number; tile: boolean; active: boolean }
export interface MenuFooterLink { href: string; label: string; external: boolean }
export interface ShareFile { name: string; type: string; base64: string }

export type WebToNative =
  | { type: 'menu.open'; entries: MenuEntry[]; canRestart: boolean } // Plan 02
  | { type: 'cover'; visible: boolean; year: number | null; muted?: boolean } // Plan 03
  | { type: 'music'; command: MusicCommand } // Plan 04
  | { type: 'share'; id: number; title?: string; text?: string; url?: string; files?: ShareFile[] } // Plan 01 (share polyfill)
  | { type: 'openUrl'; url: string } // Plan 01 (link switch)
  | { type: 'log'; level: 'error'; text: string } // Plan 01 (crash report)
  | { type: 'ready' }; // the web is mounted; native holds deep-link payloads until then

export type NativeToWeb =
  | { type: 'navigate'; href: string } // Plan 02
  | { type: 'restart' } // Plan 02
  | { type: 'menu.closed' } // Plan 02: the native menu is gone; the web side returns focus to the menu button
  | { type: 'story.start' } // Plan 03
  | { type: 'music.playing'; theme: ThemeType | null } // Plan 04
  | { type: 'share.result'; id: number; ok: boolean } // Plan 01 (handled by the polyfill itself)
  | { type: 'preview.code'; code: string }; // preview code from the bundestag-wrapped://zugang?code=… deep link
