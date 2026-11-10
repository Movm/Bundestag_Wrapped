import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Menu, X, Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { useState } from 'react';
import { toggleBackgroundMusic, isBackgroundMusicPlaying } from '@/lib/sounds';
import { IS_DEV_AUDIO_DISABLED, useAudioStore } from '@/stores/audioStore';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionPath, editionSurface } from '@/edition/surface';

interface HeaderProps {
  variant?: 'dark' | 'light';
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function Header({ isMenuOpen, onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const surface = editionSurface(useOptionalEdition());
  const muted = useAudioStore((s) => s.isMuted);
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const [musicPlaying, setMusicPlaying] = useState(() => isBackgroundMusicPlaying());

  const handleToggleMute = () => {
    toggleMute();
  };

  const handleToggleMusic = () => {
    const nowPlaying = toggleBackgroundMusic();
    setMusicPlaying(nowPlaying);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-60 h-16">
      <div className="h-full px-4 flex items-center justify-between gap-2">
        <Link
          to={`${editionPath(surface)}${location.search}${location.hash}`}
          className="transition-opacity hover:opacity-80"
          aria-label="Bundestag Wrapped - Zur Startseite"
        >
          <img src="/logo.png" alt="Bundestag Wrapped" className="h-8 w-auto" />
        </Link>

        <div className="flex items-center gap-2">
          {/* Background music toggle */}
          <button
            onClick={handleToggleMusic}
            disabled={IS_DEV_AUDIO_DISABLED}
            className="ds-icon-button"
            aria-label={IS_DEV_AUDIO_DISABLED ? 'Musik im Entwicklungsmodus deaktiviert' : musicPlaying ? 'Musik ausschalten' : 'Musik einschalten'}
            title={IS_DEV_AUDIO_DISABLED ? 'Musik ist im Entwicklungsmodus deaktiviert' : undefined}
          >
            {musicPlaying ? <Music size={20} aria-hidden="true" /> : <Music2 size={20} aria-hidden="true" />}
          </button>

          {/* Sound effects toggle */}
          <button
            onClick={handleToggleMute}
            disabled={IS_DEV_AUDIO_DISABLED}
            className="ds-icon-button"
            aria-label={IS_DEV_AUDIO_DISABLED ? 'Ton im Entwicklungsmodus deaktiviert' : muted ? 'Ton einschalten' : 'Ton ausschalten'}
            title={IS_DEV_AUDIO_DISABLED ? 'Ton ist im Entwicklungsmodus deaktiviert' : undefined}
          >
            {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
          </button>

          <button
            onClick={event => { event.currentTarget.focus(); onMenuToggle(); }}
            className="ds-icon-button"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
          >
            <motion.div
              initial={false}
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </motion.div>
          </button>
        </div>
      </div>
    </header>
  );
}
