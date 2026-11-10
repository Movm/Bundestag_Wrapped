import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { SECTION_CONFIG, SUBPAGE_ORDER, type SubpageId } from './section-config';

interface SubpageWrapperProps {
  /** Current section ID */
  sectionId: SubpageId;
  /** Page content */
  children: ReactNode;
}

/**
 * Common wrapper for statistiken subpages.
 * Provides back navigation and prev/next section links.
 */
export function SubpageWrapper({ sectionId, children }: SubpageWrapperProps) {
  const currentIndex = SUBPAGE_ORDER.indexOf(sectionId);

  const prevSection = currentIndex > 0
    ? SECTION_CONFIG[SUBPAGE_ORDER[currentIndex - 1]]
    : null;

  const nextSection = currentIndex < SUBPAGE_ORDER.length - 1
    ? SECTION_CONFIG[SUBPAGE_ORDER[currentIndex + 1]]
    : null;

  return (
    <div className="relative">
      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-8">

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>

        {/* Prev/Next navigation */}
        <motion.nav
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center mt-16 pt-8 border-t border-track"
        >
          {prevSection ? (
            <Link
              to={prevSection.path}
              className="flex items-center gap-3 text-on-muted hover:text-on transition-colors group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <div>
                <p className="text-sm text-on-muted">Vorherige</p>
                <p className="font-wide font-bold uppercase flex items-center gap-2">
                  <span>{prevSection.pathLabel}</span>
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextSection && (
            <Link
              to={nextSection.path}
              className="flex items-center gap-3 text-on-muted hover:text-on transition-colors group text-right"
            >
              <div>
                <p className="text-sm text-on-muted">Nächste</p>
                <p className="font-wide font-bold uppercase flex items-center gap-2 justify-end">
                  <span>{nextSection.pathLabel}</span>
                </p>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          )}
        </motion.nav>
      </div>
    </div>
  );
}
