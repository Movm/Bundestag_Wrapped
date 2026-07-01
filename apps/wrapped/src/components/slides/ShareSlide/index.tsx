import { memo, useState, useRef, useEffect, useMemo } from 'react';
import { motion, useInView } from 'motion/react';
import { Download, Share2 } from 'lucide-react';
import { SlideContainer, itemVariants } from '../shared';
import { renderShareImage, downloadShareImage, shareImage, preloadLogo } from '@/lib/share-canvas';
import { useCorrectCount } from '@/stores/quizStore';

interface ShareSlideProps {
  totalQuestions: number;
}

interface CanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onDownload: () => void;
  onShare: () => void;
  canShare: boolean;
  label?: string;
}

const CONFETTI_COLORS = ['#000000', '#DD0000', '#FFCC00'];

// Reusable canvas preview with action buttons
const CanvasPreview = memo(function CanvasPreview({
  canvasRef,
  onDownload,
  onShare,
  canShare,
}: CanvasPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 shadow-xl">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block max-w-[160px] md:max-w-[200px]"
          style={{ aspectRatio: '1 / 1' }}
        />
      </div>
      <div className="flex gap-2">
        <motion.button
          onClick={onDownload}
          className="flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-pink-600 to-pink-500 rounded-full text-white font-semibold text-sm shadow-lg shadow-pink-500/25"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Speichern"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Speichern</span>
        </motion.button>

        {canShare && (
          <motion.button
            onClick={onShare}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-full text-white font-semibold text-sm transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Teilen"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Teilen</span>
          </motion.button>
        )}
      </div>
    </div>
  );
});

const FallingConfetti = memo(function FallingConfetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
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
          className="absolute w-2 h-2 md:w-3 md:h-3 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            willChange: 'transform',
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 1000,
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

export const ShareSlide = memo(function ShareSlide({
  totalQuestions,
}: ShareSlideProps) {
  // Get correct count from store (only ShareSlide subscribes to this)
  const correctCount = useCorrectCount();
  const [userName, setUserName] = useState('');
  const [canShare, setCanShare] = useState(false);
  // Two canvas refs for both variants
  const canvasRefScore = useRef<HTMLCanvasElement>(null);
  const canvasRefTitle = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Defer canvas rendering until slide is visible (saves 62ms on initial load)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare);
  }, []);

  useEffect(() => {
    // Only render when slide becomes visible
    if (!isInView) return;

    const data = {
      correctCount,
      totalQuestions,
      userName: userName.trim() || undefined,
    };

    preloadLogo().then(() => {
      // Render score variant (with emoji title)
      if (canvasRefScore.current) {
        renderShareImage(canvasRefScore.current, data, 'score');
      }
      // Render title variant ("Du bist eine:")
      if (canvasRefTitle.current) {
        renderShareImage(canvasRefTitle.current, data, 'title');
      }
    });
  }, [correctCount, totalQuestions, userName, isInView]);

  // Handlers for score variant
  const handleDownloadScore = () => {
    if (canvasRefScore.current) {
      downloadShareImage(canvasRefScore.current, userName);
    }
  };

  const handleShareScore = async () => {
    if (canvasRefScore.current) {
      await shareImage(canvasRefScore.current);
    }
  };

  // Handlers for title variant
  const handleDownloadTitle = () => {
    if (canvasRefTitle.current) {
      downloadShareImage(canvasRefTitle.current, userName);
    }
  };

  const handleShareTitle = async () => {
    if (canvasRefTitle.current) {
      await shareImage(canvasRefTitle.current);
    }
  };

  return (
    <div ref={containerRef}>
      <SlideContainer
        innerClassName="max-w-md md:max-w-4xl mx-auto"
        className="relative overflow-hidden"
      >
        <FallingConfetti />

        {/* Centered layout */}
        <div className="flex flex-col items-center text-center">
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-4">
            <motion.span
              className="text-5xl md:text-6xl block"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              📸
            </motion.span>
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-2xl md:text-3xl lg:text-4xl font-black gradient-text mb-2"
          >
            Teile dein Ergebnis!
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-white/60 text-sm md:text-base mb-6"
          >
            Erstelle dein persönliches Sharepic
          </motion.p>

          {/* Name Input */}
          <motion.div variants={itemVariants} className="mb-6 w-full max-w-sm">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Dein Name (optional)"
              maxLength={30}
              className="w-full px-5 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-white text-lg text-center placeholder-white/30 focus:outline-none focus:border-pink-500/60 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all"
            />
          </motion.div>

          {/* Dual Canvas Previews - Side by side */}
          <motion.div
            variants={itemVariants}
            className="flex flex-row gap-4 md:gap-8 justify-center"
          >
            <CanvasPreview
              canvasRef={canvasRefScore}
              onDownload={handleDownloadScore}
              onShare={handleShareScore}
              canShare={canShare}
            />
            <CanvasPreview
              canvasRef={canvasRefTitle}
              onDownload={handleDownloadTitle}
              onShare={handleShareTitle}
              canShare={canShare}
            />
          </motion.div>
        </div>
      </SlideContainer>
    </div>
  );
});
