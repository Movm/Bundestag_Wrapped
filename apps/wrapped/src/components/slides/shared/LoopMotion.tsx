import { useEffect } from 'react';
import { motion, useAnimationControls, useReducedMotion, type HTMLMotionProps, type TargetAndTransition, type Transition } from 'motion/react';
import { useSlideEffectsActive } from '@/components/main-wrapped/SlideEffectsContext';

function useLoopControls(target: TargetAndTransition, transition?: Transition) {
  const active = useSlideEffectsActive();
  const reduced = useReducedMotion();
  const controls = useAnimationControls();
  // Stop the existing animation explicitly; changing repeat alone leaves it running.
  useEffect(() => {
    if (active && !reduced) void controls.start(target, transition);
    else controls.stop();
    return () => controls.stop();
  }, [active, reduced, controls, target, transition]);
  return { controls, active: active && !reduced };
}

type LoopProps<Tag extends 'div' | 'span'> = Omit<HTMLMotionProps<Tag>, 'animate'> & { animate: TargetAndTransition };
export function LoopMotion({ animate, transition, style, ...props }: LoopProps<'div'>) {
  const { controls, active } = useLoopControls(animate, transition);
  return <motion.div {...props} animate={controls} style={active ? style : { ...style, willChange: undefined }} />;
}
export function LoopSpan({ animate, transition, style, ...props }: LoopProps<'span'>) {
  const { controls, active } = useLoopControls(animate, transition);
  return <motion.span {...props} animate={controls} style={active ? style : { ...style, willChange: undefined }} />;
}
