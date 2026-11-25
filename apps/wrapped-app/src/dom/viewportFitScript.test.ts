/** @jest-environment jsdom */
import { VIEWPORT_FIT_SCRIPT } from './viewportFitScript';

const COVER = 'width=device-width, initial-scale=1, viewport-fit=cover';
// Evaluates the script against jsdom's document (no node typings here, so no node:vm).
const run = () => new Function('document', 'MutationObserver', VIEWPORT_FIT_SCRIPT)(document, MutationObserver);
const addMeta = () => {
  const meta = document.createElement('meta');
  meta.setAttribute('name', 'viewport');
  meta.setAttribute('content', 'width=device-width, initial-scale=1');
  document.head.append(meta);
  return meta;
};

afterEach(() => { document.head.innerHTML = ''; });

describe('VIEWPORT_FIT_SCRIPT', () => {
  it('rewrites an existing viewport meta at once', () => {
    const meta = addMeta();
    run();
    expect(meta.getAttribute('content')).toBe(COVER);
  });

  it('waits for a meta that appears later, then disconnects', async () => {
    const disconnect = jest.spyOn(MutationObserver.prototype, 'disconnect');
    run();
    const meta = addMeta();
    await Promise.resolve();
    expect(meta.getAttribute('content')).toContain('viewport-fit=cover');
    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
  });

  it('ends with true;', () => {
    expect(VIEWPORT_FIT_SCRIPT.trim().endsWith('true;')).toBe(true);
  });
});
