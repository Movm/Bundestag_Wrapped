import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Music, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { IS_DEV_AUDIO_DISABLED, useAudioStore, useTrackInfo } from '@/stores/audioStore';
import { themeMusic } from '@/lib/theme-music';

interface WrappedToolbarProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function WrappedToolbar({ isMenuOpen, onMenuToggle }: WrappedToolbarProps) {
  const muted = useAudioStore((s) => s.isMuted);
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const currentTheme = useAudioStore((s) => s.currentTheme);
  const trackInfo = useTrackInfo();
  const [showTrackInfo, setShowTrackInfo] = useState(false);

  // Show track info briefly when theme changes
  useEffect(() => {
    if (currentTheme && !muted) {
      const frame = requestAnimationFrame(() => setShowTrackInfo(true));
      const timer = setTimeout(() => setShowTrackInfo(false), 3000);
      return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
    }
  }, [currentTheme, muted]);

  const handleToggleMute = () => {
    const newMuted = toggleMute();

    // Also control theme music when muting/unmuting
    if (newMuted) {
      themeMusic.pause();
    } else {
      themeMusic.resume();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      {/* Track info (shows on theme change) */}
      <AnimatePresence>
        {showTrackInfo && trackInfo && !muted && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-wr-ink"
          >
            <Music size={14} aria-hidden="true" />
            <div className="text-xs leading-tight">
              <div className="font-bold">{trackInfo.title}</div>
              <div>{trackInfo.artist}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio toggle */}
      <button
        type="button"
        onClick={handleToggleMute}
        disabled={IS_DEV_AUDIO_DISABLED}
        className="ds-icon-button"
        aria-label={IS_DEV_AUDIO_DISABLED ? 'Ton im Entwicklungsmodus deaktiviert' : muted ? 'Ton einschalten' : 'Ton ausschalten'}
        title={IS_DEV_AUDIO_DISABLED ? 'Ton ist im Entwicklungsmodus deaktiviert' : trackInfo ? `${trackInfo.title} - ${trackInfo.artist}` : undefined}
      >
        {muted ? <VolumeX size={20} strokeWidth={2.4} aria-hidden="true" /> : <Volume2 size={20} strokeWidth={2.4} aria-hidden="true" />}
      </button>

      {/* Menu toggle */}
      <button
        type="button"
        onClick={event => { event.currentTarget.focus(); onMenuToggle(); }}
        className="ds-icon-button"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
      >
        {isMenuOpen ? <X size={20} strokeWidth={2.6} aria-hidden="true" /> : <Menu size={20} strokeWidth={2.6} aria-hidden="true" />}
      </button>
    </div>
  );
}
