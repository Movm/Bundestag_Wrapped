import { AccessibleDialog } from './AccessibleDialog';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Home, BookOpen, Shield, FileText, ExternalLink, Users, X, RotateCcw, Plug } from 'lucide-react';
import { clearWrappedProgress } from '@/lib/wrapped-storage';
import { useQuizStore } from '@/stores/quizStore';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

const FOOTER_LINKS: NavItem[] = [
  { href: '/datenschutz', label: 'Datenschutz', icon: <Shield size={14} /> },
  { href: '/terms', label: 'Nutzungsbedingungen', icon: <FileText size={14} /> },
  {
    href: 'https://www.moritz-waechter.de/impressum',
    label: 'Impressum',
    icon: <FileText size={14} />,
    external: true,
  },
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
  const suffix = `${location.search}${location.hash}`;
  const navItems: NavItem[] = [
    { href: `${editionPath(surface)}${suffix}`, label: 'Bundestag Wrapped', icon: <Home size={22} aria-hidden="true" /> },
    { href: `${editionPath(surface, 'abgeordnete')}${suffix}`, label: 'Abgeordnete-Wrapped', icon: <Users size={22} aria-hidden="true" /> },
    { href: `${editionPath(surface, 'dokumentation')}${suffix}`, label: 'Dokumentation', icon: <BookOpen size={22} aria-hidden="true" /> },
    { href: '/mcp', label: 'MCP-Server', icon: <Plug size={22} aria-hidden="true" /> },
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

  const handleNavClick = (item: NavItem) => {
    if (!item.external) {
      onClose();
    }
  };

  const linkClass = (active: boolean) =>
    `group flex items-center gap-4 rounded-2xl px-4 py-3 font-wide font-extrabold uppercase leading-tight tracking-tight text-[clamp(1.25rem,1rem+2vw,1.75rem)] transition-colors ${
      active ? 'bg-wr-pink text-wr-ink' : 'text-on hover:bg-wr-card'
    }`;

  return (
    <AccessibleDialog open={isOpen} onClose={onClose} label="Hauptnavigation">
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Solid overlay, no blur */}
          <motion.div
            className="menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Flat ink drawer */}
          <motion.nav
            className="menu-drawer overflow-y-auto overscroll-contain safe-area-top safe-area-bottom"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            aria-label="Hauptnavigation"
          >
            <div className="absolute top-4 right-4">
              <button onClick={onClose} className="ds-icon-button" aria-label="Menü schließen">
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col min-h-full pt-20 px-4 sm:px-6">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = !item.external && currentPath === item.href;
                  const content = (
                    <>
                      <span className="shrink-0" aria-hidden="true">{item.icon}</span>
                      <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
                      {item.external && <ExternalLink size={16} className="ml-auto" aria-hidden="true" />}
                    </>
                  );
                  return (
                    <li key={item.href}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleNavClick(item)}
                          className={linkClass(false)}
                        >
                          {content}
                        </a>
                      ) : (
                        <Link
                          to={item.href}
                          onClick={() => handleNavClick(item)}
                          className={linkClass(isActive)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}

                {/* Restart option - only on main wrapped page */}
                {isMainPage && (
                  <li>
                    <button onClick={handleRestart} className={`${linkClass(false)} w-full text-left`}>
                      <RotateCcw size={22} aria-hidden="true" className="shrink-0" />
                      <span>Neu starten</span>
                    </button>
                  </li>
                )}
              </ul>

              <div className="mt-auto mb-6 h-1 rounded-full bg-wr-card" aria-hidden="true" />

              <div className="pb-8">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mb-3">
                  {FOOTER_LINKS.map((item) => {
                    const cls = 'inline-flex min-h-11 items-center text-base text-on-muted underline underline-offset-4 hover:text-on';
                    return item.external ? (
                      <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {item.label}
                      </a>
                    ) : (
                      <Link key={item.href} to={item.href} onClick={() => handleNavClick(item)} className={cls}>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
                <p className="text-base text-on-muted">Daten aus der 21. Wahlperiode</p>
              </div>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
    </AccessibleDialog>
  );
}
