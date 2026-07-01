import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, X } from 'lucide-react';
import { renderShareImage, downloadShareImage, shareImage, preloadLogo } from '@/lib/share-canvas';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctCount: number;
  totalQuestions: number;
}

const CONFETTI_COLORS = ['#000000', '#DD0000', '#FFCC00'];

const FallingConfetti = memo(function FallingConfetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * 3)],
        rotate: Math.random() * 720 - 360,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            willChange: 'transform',
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 1, 1, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

export function ShareModal({ isOpen, onClose, correctCount, totalQuestions }: ShareModalProps) {
  const [userName, setUserName] = useState('');
  const [canShare, setCanShare] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare);
  }, []);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Ensure logo is loaded before rendering
      preloadLogo().then(() => {
        if (canvasRef.current) {
          renderShareImage(canvasRef.current, {
            correctCount,
            totalQuestions,
            userName: userName.trim() || undefined,
          });
        }
      });
    }
  }, [isOpen, correctCount, totalQuestions, userName]);

  const handleDownload = () => {
    if (canvasRef.current) {
      downloadShareImage(canvasRef.current, userName);
    }
  };

  const handleShare = async () => {
    if (canvasRef.current) {
      await shareImage(canvasRef.current);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden"
        >
          {/* Schwarz-Rot-Gold Confetti */}
          <FallingConfetti />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg bg-white/5 rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl backdrop-blur-md"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all hover:scale-110"
            >
              <X size={24} />
            </button>

            {/* Emoji Header */}
            <motion.div className="text-center mb-2 sm:mb-4">
              <motion.span
                className="text-4xl sm:text-5xl md:text-6xl block"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
              >
                📸
              </motion.span>
            </motion.div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black gradient-text mb-1 sm:mb-2 text-center">
              Teile dein Ergebnis!
            </h2>
            <p className="text-white/60 text-xs sm:text-sm md:text-base mb-4 sm:mb-6 text-center">
              Erstelle ein Bild für Social Media
            </p>

            {/* Name Input */}
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Dein Name (optional)"
              maxLength={30}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 text-center text-sm sm:text-base focus:outline-none focus:border-pink-500/50 focus:bg-white/10 transition-all mb-4 sm:mb-6"
            />

            {/* Canvas Preview */}
            <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 mb-4 sm:mb-8 bg-black/20 max-w-[200px] sm:max-w-[280px] md:max-w-none mx-auto">
              <canvas
                ref={canvasRef}
                className="w-full h-auto block"
                style={{ aspectRatio: '1 / 1' }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <motion.button
                onClick={handleDownload}
                className="flex-1 min-w-[120px] sm:min-w-[140px] flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-600 to-pink-500 rounded-full text-white text-sm sm:text-base font-bold shadow-lg shadow-pink-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={18} className="sm:w-5 sm:h-5" />
                Speichern
              </motion.button>

              {canShare && (
                <motion.button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white text-sm sm:text-base font-bold transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 size={18} className="sm:w-5 sm:h-5" />
                  Teilen
                </motion.button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
