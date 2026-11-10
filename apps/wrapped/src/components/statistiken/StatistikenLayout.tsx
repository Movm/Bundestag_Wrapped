import { Outlet } from 'react-router';
import { Footer } from '@/components/ui/Footer';
import { Header } from '@/components/ui/Header';
import { MobileMenu } from '@/components/ui/MobileMenu';
import { useMenuState } from '@/hooks/useMenuState';

export function StatistikenLayout() {
  const { isOpen: isMenuOpen, toggle: toggleMenu, close: closeMenu } = useMenuState();

  return (
    <div className="min-h-screen bg-wr-ink relative">
      {/* Header and mobile menu */}
      <Header variant="dark" isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      <MobileMenu isOpen={isMenuOpen} onClose={closeMenu} variant="dark" />

      {/* Main content area - child routes render here */}
      <main id="main-content" className="relative z-10 pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
