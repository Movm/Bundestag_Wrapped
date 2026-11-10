export function DocFooter() {
  return (
    <footer className="border-t border-track bg-wr-card">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-muted">
          <p>
            Datenquelle:{' '}
            <a
              href="https://www.bundestag.de/protokolle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-muted hover:text-on underline"
            >
              Plenarprotokolle des Deutschen Bundestages
            </a>
          </p>
          <p className="font-mono text-xs text-on-muted">
            Stand: aktuelle Edition • WP21
          </p>
        </div>
      </div>
    </footer>
  );
}
