/**
 * Runs in the webview before the page loads (`injectedJavaScriptBeforeContentLoaded`).
 * Expo's viewport meta lacks `viewport-fit=cover`, which leaves `env(safe-area-inset-*)` at 0;
 * rewriting it from inside the bundle comes too late, so native injects this instead.
 * Self-contained on purpose: no imports, ends with `true;` as the webview requires.
 */
export const VIEWPORT_FIT_SCRIPT = `(function(){var f=function(){var m=document.querySelector('meta[name=viewport]');if(m){m.setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover');return true}return false};if(!f()){var o=new MutationObserver(function(){if(f())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true})}})();true;`;
