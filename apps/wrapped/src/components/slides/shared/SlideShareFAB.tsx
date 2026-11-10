import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { Share2, Download, X } from 'lucide-react';
import { ActionButton } from '@/design-system/components/ActionButton';
import {
  type SlideData,
  renderSlideSharepic,
  downloadSharepic,
  shareSharepic,
  preloadLogo,
} from '@/lib/slide-sharepics';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionShareUrl, editionSurface } from '@/edition/surface';

interface SlideShareFABProps {
  slideData: SlideData;
}

export function SlideShareFAB({ slideData }: SlideShareFABProps) {
  const surface = editionSurface(useOptionalEdition());
  const [isOpen, setIsOpen] = useState(false);
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render the sharepic when modal opens and canvas is mounted
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      preloadLogo().then(() => {
        if (canvasRef.current) {
          renderSlideSharepic(canvasRef.current, slideData, surface.title);
        }
      });
    }
  }, [isOpen, slideData, surface.title]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const filename = `bundestag-wrapped-${surface.editionId}-${slideData.type}.png`;
    downloadSharepic(canvasRef.current, filename);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    await shareSharepic(canvasRef.current, {
      title: surface.title,
      filename: `bundestag-wrapped-${surface.editionId}-${slideData.type}.png`,
      url: editionShareUrl(surface),
    });
  };

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={event => { event.currentTarget.focus(); handleOpen(); }}
        className="ds-icon-button fixed story-share-trigger z-50 !h-14 !w-14"
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.5 }}
      >
        <Share2 size={24} strokeWidth={2.4} aria-hidden="true" />
        <span className="sr-only">Diese Folie teilen</span>
      </motion.button>

      {/* Share Popup */}
      <AccessibleDialog open={isOpen} onClose={close} labelledBy="slide-share-title">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-wr-ink/80"
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              data-surface="ink"
              className="fixed story-share-popup z-50 rounded-[1.75rem] p-4 w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto"
            >
              {/* Close button */}
              <button
                data-share-close
                onClick={close}
                className="ds-icon-button absolute top-3 right-3 !h-11 !w-11"
              >
                <X size={20} strokeWidth={2.6} aria-hidden="true" />
                <span className="sr-only">Teilen schließen</span>
              </button>

              <h2 id="slide-share-title" className="sr-only">Diese Folie teilen</h2>

              {/* Preview */}
              <div className="mb-4 mt-12">
                <canvas
                  ref={canvasRef}
                  width={1080}
                  height={1080}
                  className="w-full aspect-square rounded-2xl" role="img" aria-label={`Vorschau: ${surface.title}`}
                />
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-2">
                <ActionButton icon="none" onClick={handleDownload}><Download size={20} aria-hidden="true" />Speichern</ActionButton>
                {canShare && <ActionButton icon="none" variant="outline" onClick={handleShare}><Share2 size={20} aria-hidden="true" />Teilen</ActionButton>}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </AccessibleDialog>
    </>
  );
}
