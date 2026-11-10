import { AccessibleDialog } from './AccessibleDialog';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, RotateCcw } from 'lucide-react';
import { clearWrappedProgress } from '@/lib/wrapped-storage';
import { useQuizStore } from '@/stores/quizStore';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

interface NavItem {
  href: string;
  label: string;
  /** Visible title; soft hyphens keep long German words from overflowing the narrow tiles. */
  title: string;
  color: 'pink' | 'violet' | 'white' | 'mint';
  rotate: number;
  tile?: boolean;
}

interface FooterLink {
  href: string;
  label: string;
  external?: boolean;
}

const FOOTER_LINKS: FooterLink[] = [
  { href: '/datenschutz', label: 'Datenschutz' },
  { href: '/terms', label: 'Nutzungsbedingungen' },
  { href: 'https://www.moritz-waechter.de/impressum', label: 'Impressum', external: true },
];

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
  variant?: 'dark' | 'light';
}

export function MobileMenu({ isOpen, onClose, onRestart }: MobileMenuProps) {
  const location = useLocation();
  const surface = editionSurface(useOptionalEdition());
  const reduceMotion = useReducedMotion();
  const suffix = `${location.search}${location.hash}`;
  const navItems: NavItem[] = [
    { href: `${editionPath(surface)}${suffix}`, label: 'Bundestag Wrapped', title: 'Bundestag Wrapped', color: 'pink', rotate: -2 },
    { href: `${editionPath(surface, 'abgeordnete')}${suffix}`, label: 'Abgeordnete-Wrapped', title: 'Abgeordnete-Wrapped', color: 'violet', rotate: 1.5 },
    { href: `${editionPath(surface, 'dokumentation')}${suffix}`, label: 'Dokumentation', title: 'Doku­mentation', color: 'white', rotate: -1, tile: true },
    { href: '/mcp', label: 'MCP-Server', title: 'MCP-Server', color: 'mint', rotate: 2, tile: true },
  ];
  const currentPath = location.pathname;
  const isMainPage = currentPath === editionPath(surface);
  const resetQuiz = useQuizStore((state) => state.reset);

  const handleRestart = () => {
    onClose();
    clearWrappedProgress(surface);
    resetQuiz(surface);
    onRestart?.();
  };

  const spring = { type: 'spring', stiffness: 260, damping: 20 } as const;
  const cardMotion = (i: number) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
      : {
          initial: { opacity: 0, x: 140, y: 30, scale: 0.8 },
          animate: { opacity: 1, x: 0, y: 0, scale: 1, transition: { ...spring, delay: 0.3 + i * 0.09 } },
          exit: { opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.2, ease: 'easeIn' as const } },
        };
  const fadeUp = (delay: number) =>
    reduceMotion
      ? { initial: false, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0, transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const } },
          exit: { opacity: 0, transition: { duration: 0.15 } },
        };

  const renderCard = (item: NavItem, i: number) => {
    const isActive = currentPath === item.href.split(/[?#]/)[0];
    const number = String(i + 1).padStart(2, '0');
    return (
      <motion.li key={item.href} className={item.tile ? 'min-w-0' : undefined} {...cardMotion(i)}>
        <Link
          to={item.href}
          onClick={onClose}
          className={`ds-menu-card ds-menu-card--${item.tile ? 'tile' : 'wide'} ds-menu-card--${item.color}`}
          style={{ ['--rot' as string]: `${item.rotate}deg` }}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className="ds-menu-card__no">
            {number}
            {isActive && !item.tile ? ' · Du bist hier' : ''}
          </span>
          <span className="ds-menu-card__title">{item.title}</span>
        </Link>
      </motion.li>
    );
  };

  const [primary, secondary, ...tiles] = navItems;

  return (
    <AccessibleDialog open={isOpen} onClose={onClose} label="Hauptnavigation">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={onClose}
              aria-hidden="true"
            />

            <motion.nav
              className="menu-drawer overflow-y-auto overscroll-contain safe-area-top safe-area-bottom"
              initial={reduceMotion ? { opacity: 0 } : { x: '105%' }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: '105%' }}
              transition={reduceMotion ? { duration: 0.15 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Hauptnavigation"
            >
              <div className="flex min-h-full flex-col gap-7 px-[1.375rem] pb-7 pt-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-on-muted">Menü</span>
                  <button onClick={onClose} className="ds-icon-button !h-[3.25rem] !w-[3.25rem]" aria-label="Menü schließen">
                    <X size={20} strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </div>

                <ul className="flex flex-col gap-3">
                  {renderCard(primary, 0)}
                  {renderCard(secondary, 1)}
                  <li className="min-w-0">
                    <ul className="grid grid-cols-2 gap-3">
                      {tiles.map((item, i) => renderCard(item, i + 2))}
                    </ul>
                  </li>
                </ul>

                {/* Restart option - only on main wrapped page */}
                {isMainPage && (
                  <motion.div {...fadeUp(0.7)}>
                    <button onClick={handleRestart} className="ds-menu-pill">
                      <RotateCcw size={18} strokeWidth={2.4} aria-hidden="true" />
                      Neu starten
                    </button>
                  </motion.div>
                )}

                <motion.div className="mt-auto flex flex-col gap-3" {...fadeUp(0.8)}>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                    {FOOTER_LINKS.map((item) => {
                      const cls = 'inline-flex min-h-11 items-center text-sm font-semibold text-on underline underline-offset-4 hover:text-wr-pink';
                      return item.external ? (
                        <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                          {item.label}
                        </a>
                      ) : (
                        <Link key={item.href} to={item.href} onClick={onClose} className={cls}>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                  <p className="text-sm text-on-muted">Daten aus der 21. Wahlperiode</p>
                </motion.div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </AccessibleDialog>
  );
}
