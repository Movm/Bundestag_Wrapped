import { Outlet, useLocation } from 'react-router';
import { BackgroundSystem } from '@/components/ui/BackgroundSystem';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { useMenuState } from '@/hooks/useMenuState';

/**
 * Map statistiken routes to background themes.
 * Uses existing themes from theme-backgrounds/types.ts where possible.
 */
const ROUTE_TO_SLIDE_ID: Record<string, string> = {
  '/statistiken': 'intro',                    // Overview: pink contrails
  '/statistiken/parteien': 'vocabulary',      // Parties: violet waves
  '/statistiken/redner_innen': 'speeches',    // Speakers: orange bars
  '/statistiken/tonalitaet': 'tone',          // Tone: purple ribbons
  '/statistiken/zwischenrufe': 'drama',       // Drama: red lightning
  '/statistiken/geschlecht': 'gender',        // Gender: cyan grid
  '/statistiken/themen': 'common-words',      // Topics: teal orbs
};

export function StatistikenLayout() {
  const location = useLocation();
  const slideId = ROUTE_TO_SLIDE_ID[location.pathname] || 'intro';
  const { isOpen: isMenuOpen, toggle: toggleMenu, close: closeMenu } = useMenuState();

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative">
      {/* Dynamic background based on current section */}
      <BackgroundSystem slideId={slideId} />

      {/* Header and mobile menu */}
      <Header variant="dark" isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} variant="dark" />

      {/* Main content area - child routes render here */}
      <main className="relative z-10">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
