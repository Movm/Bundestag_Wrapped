import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Music, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAudioStore, useTrackInfo } from '@/stores/audioStore';
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
      setShowTrackInfo(true);
      const timer = setTimeout(() => setShowTrackInfo(false), 3000);
      return () => clearTimeout(timer);
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
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Track info (shows on theme change) */}
      <AnimatePresence>
        {showTrackInfo && trackInfo && !muted && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm"
          >
            <Music size={14} className="text-pink-400" aria-hidden="true" />
            <div className="text-xs">
              <div className="text-white/90 font-medium">{trackInfo.title}</div>
              <div className="text-white/50">{trackInfo.artist}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio toggle */}
      <button
        onClick={handleToggleMute}
        className="p-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/10"
        aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
        title={trackInfo ? `${trackInfo.title} - ${trackInfo.artist}` : undefined}
      >
        {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
      </button>

      {/* Menu toggle */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/10"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isMenuOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </motion.div>
      </button>
    </div>
  );
}
