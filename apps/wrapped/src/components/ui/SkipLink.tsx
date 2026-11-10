/**
 * Skip Link Component
 * Allows keyboard/screen reader users to bypass navigation
 * and jump directly to main content.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-5 focus:py-3 focus:rounded-full focus:bg-white focus:text-wr-ink focus:font-wide focus:font-bold focus:uppercase focus:text-sm"
    >
      Zum Hauptinhalt springen
    </a>
  );
}
