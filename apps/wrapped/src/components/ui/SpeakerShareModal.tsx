import { AccessibleDialog } from './AccessibleDialog';
import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share2, X } from 'lucide-react';
import { ActionButton } from '@/design-system/components/ActionButton';
import {
  renderSpeakerShareImage,
  preloadLogo,
  downloadSpeakerShareImage,
  shareSpeakerImage,
  type SpeakerShareData,
} from '@/lib/speaker-share-canvas';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionSurface } from '@/edition/surface';

interface SpeakerShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SpeakerShareData;
}

export function SpeakerShareModal({ isOpen, onClose, data }: SpeakerShareModalProps) {
  const surface = editionSurface(useOptionalEdition());
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      preloadLogo().then(() => {
        if (canvasRef.current) renderSpeakerShareImage(canvasRef.current, { ...data, editionTitle: surface.title, editionId: surface.editionId });
      });
    }
  }, [isOpen, data, surface.editionId, surface.title]);

  const handleDownload = () => {
    if (canvasRef.current) {
      downloadSpeakerShareImage(canvasRef.current, data.name, surface.editionId);
    }
  };

  const handleShare = async () => {
    if (canvasRef.current) {
      await shareSpeakerImage(canvasRef.current, data.name, surface.title, surface.editionId);
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-wr-ink/90 p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            data-surface="ink"
            className="relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto max-w-[320px] sm:max-w-sm md:max-w-md rounded-[1.75rem] p-5 sm:p-7"
          >
            <button type="button" onClick={onClose} aria-label="Teilen schließen" className="ds-icon-button absolute top-4 right-4">
              <X size={20} strokeWidth={2.6} aria-hidden="true" />
            </button>

            <h2 className="ds-display ds-display--md mb-2 pr-14">Teile das <span className="text-display-accent">Ergebnis</span></h2>
            <p className="ds-note mb-5">{data.name}'s Bundestag Wrapped</p>

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
