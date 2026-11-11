import { createContext } from 'react';

export interface StoryState {
  activeId: string;
  readingMode: boolean;
  /**
   * Jump from slide `fromId` straight to the next slide (like "Los geht’s"), even
   * when the current slide is taller than the viewport. Ignored if the reader
   * has already left `fromId`.
   */
  next?: (fromId: string) => void;
}

export const StoryContext = createContext<StoryState>({ activeId: '', readingMode: false });
