import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Download, X } from 'lucide-react';
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
  const [canShare] = useState(() => typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Render the sharepic when modal opens and canvas is mounted
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      preloadLogo().then(() => {
        if (canvasRef.current) {
          renderSlideSharepic(canvasRef.current, slideData);
        }
      });
    }
  }, [isOpen, slideData]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) {
      triggerRef.current?.focus();
      return;
    }
    const dialog = dialogRef.current;
    const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-share-close]');
    closeButton?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

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
        ref={triggerRef}
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.5 }}
      >
        <Share2 className="w-6 h-6 text-white" aria-hidden="true" />
        <span className="sr-only">Diese Folie teilen</span>
      </motion.button>

      {/* Share Popup */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-6 z-50 bg-[#1a1a2e]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl w-72"
              role="dialog"
              aria-modal="true"
              aria-labelledby="slide-share-title"
            >
              {/* Close button */}
              <button
                data-share-close
                onClick={close}
                className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
                <span className="sr-only">Teilen schließen</span>
              </button>

              <h2 id="slide-share-title" className="sr-only">Diese Folie teilen</h2>

              {/* Preview */}
              <div className="mb-4">
                <canvas
                  ref={canvasRef}
                  width={1080}
                  height={1080}
                  className="w-full aspect-square rounded-lg"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 text-white font-medium hover:from-pink-500 hover:to-pink-400 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Speichern
                </button>
                {canShare && (
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/20 transition-all"
                  >
                  <Share2 className="w-5 h-5" />
                    Teilen
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
