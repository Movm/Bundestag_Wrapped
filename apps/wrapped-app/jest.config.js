// The native preset's setup redefines `window` and cannot run under jsdom, so DOM-touching
// tests (src/dom) run in their own project on the web preset (jsdom).
module.exports = {
  projects: [
    { displayName: 'native', preset: 'jest-expo', testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/dom/'] },
    { displayName: 'dom', preset: 'jest-expo/web', testMatch: ['<rootDir>/src/dom/**/*.test.ts?(x)'] },
  ],
};
