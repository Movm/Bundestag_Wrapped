import { createContext, type RefObject } from 'react';

export interface StoryState {
  activeId: string;
  readingMode: boolean;
  /**
   * Jump from slide `fromId` straight to the next slide (like "Los geht’s"), even
   * when the current slide is taller than the viewport. Ignored if the reader
   * has already left `fromId`.
   */
  next?: (fromId: string) => void;
  /**
   * How the latest navigation moved: `instant` cuts (keyboard, start, restore), `smooth` scrolls.
   * A ref, not state, so the slide's entrance can read it when it starts without re-rendering the story.
   */
  arrival?: RefObject<Arrival>;
}

export type Arrival = 'smooth' | 'instant';

export const StoryContext = createContext<StoryState>({ activeId: '', readingMode: false });
