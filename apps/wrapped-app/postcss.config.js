// [H3] Tailwind v4 runs through the Vite plugin on web; Metro needs PostCSS.
// `base` points the class scan at the web sources instead of this app.
const path = require('path');

module.exports = {
  plugins: { '@tailwindcss/postcss': { base: path.resolve(__dirname, '../wrapped') } },
};
