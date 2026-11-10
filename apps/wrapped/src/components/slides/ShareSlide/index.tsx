import { memo, useState, useRef, useEffect } from 'react';
import { useInView } from 'motion/react';
import { Download, Share2 } from 'lucide-react';
import { Slide } from '@/design-system/components/Slide';
import { Block } from '@/design-system/components/Data';
import { Display, Lead, Mark } from '@/design-system/components/Type';
import { ActionButton } from '@/design-system/components/ActionButton';
import { renderShareImage, downloadShareImage, shareImage, preloadLogo } from '@/lib/share-canvas';
import { useCorrectCount } from '@/stores/quizStore';
import { useOptionalEdition } from '@/edition/EditionProvider';
import { editionShareUrl, editionSurface } from '@/edition/surface';
import type { SlideType } from '@/components/main-wrapped/constants';
import './share.css';

interface ShareSlideProps {
  totalQuestions: number;
  quizSlideIds: readonly SlideType[];
}

interface CanvasPreviewProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onDownload: () => void;
  onShare: () => void;
  canShare: boolean;
  label?: string;
}

/** Canvas preview in a white block with save / share actions. */
const CanvasPreview = memo(function CanvasPreview({
  canvasRef,
  onDownload,
  onShare,
  canShare,
  label,
}: CanvasPreviewProps) {
  return (
    <Block tone="white" className="share-preview">
      <canvas ref={canvasRef} className="share-preview__canvas" role="img" aria-label={label} />
      <div className="share-preview__actions">
        <ActionButton icon="none" onClick={onDownload} aria-label={`${label} speichern`}>
          <Download size={18} aria-hidden="true" />
          Speichern
        </ActionButton>
        {canShare && (
          <ActionButton icon="none" variant="outline" onClick={onShare} aria-label={`${label} teilen`}>
            <Share2 size={18} aria-hidden="true" />
            Teilen
          </ActionButton>
        )}
      </div>
    </Block>
  );
});

export const ShareSlide = memo(function ShareSlide({
  totalQuestions,
  quizSlideIds,
}: ShareSlideProps) {
  const surface = editionSurface(useOptionalEdition());
  // Get correct count from store (only ShareSlide subscribes to this)
  const correctCount = useCorrectCount(surface, quizSlideIds);
  const [userName, setUserName] = useState('');
  const [canShare, setCanShare] = useState(false);
  // Two canvas refs for both variants
  const canvasRefScore = useRef<HTMLCanvasElement>(null);
  const canvasRefTitle = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Defer canvas rendering until slide is visible (saves 62ms on initial load)
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  useEffect(() => {
    // Only render when slide becomes visible
    if (!isInView) return;

    const data = {
      correctCount,
      totalQuestions,
      userName: userName.trim() || undefined,
      editionTitle: surface.title,
      editionId: surface.editionId,
    };

    // Draw after the slide transition has settled, one canvas per idle slot,
    // so painting the previews never costs a frame of the scroll animation.
    let cancelled = false;
    const timeouts: number[] = [];
    const idles: number[] = [];
    const whenIdle = (task: () => void) => {
      const run = () => { if (!cancelled) task(); };
      // A scroll transition lasts < 700 ms; idle callbacks fire between its frames otherwise.
      timeouts.push(window.setTimeout(() => {
        if (typeof requestIdleCallback === 'function') idles.push(requestIdleCallback(run, { timeout: 1200 }));
        else run();
      }, 700));
    };
    void preloadLogo().then(() => {
      whenIdle(() => { if (canvasRefScore.current) renderShareImage(canvasRefScore.current, data, 'score'); });
      whenIdle(() => { if (canvasRefTitle.current) renderShareImage(canvasRefTitle.current, data, 'title'); });
    });
    return () => {
      cancelled = true;
      timeouts.forEach(handle => window.clearTimeout(handle));
      if (typeof cancelIdleCallback === 'function') idles.forEach(handle => cancelIdleCallback(handle));
    };
  }, [correctCount, totalQuestions, userName, isInView, surface.editionId, surface.title]);

  // Handlers for score variant
  const handleDownloadScore = () => {
    if (canvasRefScore.current) {
      downloadShareImage(canvasRefScore.current, userName, surface.editionId);
    }
  };

  const handleShareScore = async () => {
    if (canvasRefScore.current) {
      await shareImage(canvasRefScore.current, surface.title, surface.editionId, editionShareUrl(surface));
    }
  };

  // Handlers for title variant
  const handleDownloadTitle = () => {
    if (canvasRefTitle.current) {
      downloadShareImage(canvasRefTitle.current, userName, surface.editionId);
    }
  };

  const handleShareTitle = async () => {
    if (canvasRefTitle.current) {
      await shareImage(canvasRefTitle.current, surface.title, surface.editionId, editionShareUrl(surface));
    }
  };

  return (
    <div ref={containerRef}>
      <Slide shapes="ring">
        <div className="flex flex-col items-start gap-3">
          <Display size="lg" face="wide">Teile dein <Mark>Ergebnis!</Mark></Display>
          <Lead>Erstelle dein persönliches Sharepic.</Lead>
        </div>
        <label className="share-name">
          <span className="sr-only">Dein Name (optional)</span>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Dein Name (optional)"
            maxLength={30}
            className="share-name__input"
          />
        </label>
        <div className="share-previews">
          <CanvasPreview
            canvasRef={canvasRefScore}
            onDownload={handleDownloadScore}
            onShare={handleShareScore}
            canShare={canShare}
            label="Sharepic mit Punktzahl"
          />
          <CanvasPreview
            canvasRef={canvasRefTitle}
            onDownload={handleDownloadTitle}
            onShare={handleShareTitle}
            canShare={canShare}
            label="Sharepic mit Titel"
          />
        </div>
      </Slide>
    </div>
  );
});
