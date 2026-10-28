import { createContext, useContext } from 'react';

/** Rendering/preloading content does not imply that its decorative effects run. */
export const SlideEffectsContext = createContext(true);
export function useSlideEffectsActive() { return useContext(SlideEffectsContext); }
