/**
 * Page placeholder painted from the first HTML byte (index.html, via the
 * cover-shell Vite plugin) and reused by React while a route chunk or the
 * edition registry loads (PageLoader in App.tsx). One markup for both, so the
 * hand-over from static HTML to React does not jump. Styles: skeleton.css.
 */
export const SKELETON_HTML =
  '<div class="bt-skel" role="status" aria-label="Seite wird geladen">'
  + '<i class="bt-skel__logo"></i>'
  + '<div class="bt-skel__main" aria-hidden="true">'
  + '<i class="bt-skel__title"></i><i class="bt-skel__title bt-skel__title--short"></i>'
  + '<i class="bt-skel__line"></i><i class="bt-skel__line"></i><i class="bt-skel__line bt-skel__line--short"></i>'
  + '<i class="bt-skel__button"></i>'
  + '</div></div>';
