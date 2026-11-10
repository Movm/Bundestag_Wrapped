import { AccessibleDialog } from './AccessibleDialog';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, X } from 'lucide-react';
import { ActionButton } from '@/design-system/components/ActionButton';
import { renderShareImage, downloadShareImage, shareImage, preloadLogo } from '@/lib/share-canvas';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  correctCount: number;
  totalQuestions: number;
}

export function ShareModal({ isOpen, onClose, correctCount, totalQuestions }: ShareModalProps) {
  const surface = editionSurface(useOptionalEdition());
  const [userName, setUserName] = useState('');
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      // Ensure logo is loaded before rendering
      preloadLogo().then(() => {
        if (canvasRef.current) {
          renderShareImage(canvasRef.current, {
            correctCount,
            totalQuestions,
            userName: userName.trim() || undefined,
            editionTitle: surface.title,
            editionId: surface.editionId,
          });
        }
      });
    }
  }, [isOpen, correctCount, totalQuestions, userName, surface.editionId, surface.title]);

  const handleDownload = () => {
    if (canvasRef.current) {
      downloadShareImage(canvasRef.current, userName, surface.editionId);
    }
  };

  const handleShare = async () => {
    if (canvasRef.current) {
      await shareImage(canvasRef.current, surface.title, surface.editionId);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AccessibleDialog open={isOpen} onClose={onClose} label="Ergebnis teilen">
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-wr-ink/90 p-4 overflow-hidden"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            data-surface="ink"
            className="relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto max-w-[320px] sm:max-w-sm md:max-w-md lg:max-w-lg rounded-[1.75rem] p-5 sm:p-7"
          >
            <button type="button" onClick={onClose} aria-label="Teilen schließen" className="ds-icon-button absolute top-4 right-4">
              <X size={20} strokeWidth={2.6} aria-hidden="true" />
            </button>

            <h2 className="ds-display ds-display--md mb-2 pr-14">Teile dein <span className="text-display-accent">Ergebnis</span></h2>
            <p className="ds-note mb-5">Erstelle ein Bild für Social Media</p>

            {/* Name Input */}
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Dein Name (optional)" aria-label="Dein Name (optional)"
              maxLength={30}
              className="mb-5 w-full rounded-full bg-white px-5 py-3 text-base font-bold text-wr-ink placeholder:text-wr-ink/70"
            />

            {/* Canvas Preview */}
            <div className="mx-auto mb-6 max-w-[240px] overflow-hidden rounded-2xl sm:max-w-[320px] md:max-w-none">
              <canvas
                ref={canvasRef}
                role="img" aria-label="Vorschau des persönlichen Ergebnisses"
                className="w-full h-auto block"
                style={{ aspectRatio: '1 / 1' }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <ActionButton icon="none" onClick={handleDownload}><Download size={20} aria-hidden="true" />Speichern</ActionButton>
              {canShare && <ActionButton icon="none" variant="outline" onClick={handleShare}><Share2 size={20} aria-hidden="true" />Teilen</ActionButton>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </AccessibleDialog>
  );
}
