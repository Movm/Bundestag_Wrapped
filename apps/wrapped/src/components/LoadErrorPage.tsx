import { loadErrorMessage } from '@/edition/loader';

interface LoadErrorPageProps {
  error: unknown;
  onRetry?: () => void;
}

export function LoadErrorPage({ error, onRetry }: LoadErrorPageProps) {
  return (
    <div className="min-h-screen page-bg flex items-center justify-center pt-14">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-red-400 mb-2">Fehler beim Laden</p>
        <p className="text-on-muted text-sm">{loadErrorMessage(error)}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-6 rounded-full bg-white/10 px-5 py-2 text-sm text-on-muted hover:bg-white/20">
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  );
}
