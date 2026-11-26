import { isPreviewCodeLink, previewCodeFromUrl, previewCodeMessage } from './previewCodeLink';

describe('preview code deep link', () => {
  it.each([
    ['bundestag-wrapped://zugang?code=XYZ', 'xyz'],
    ['bundestag-wrapped://zugang/?code=Ai-gner_1', 'ai-gner_1'],
    ['/zugang?code=abc', 'abc'],
    ['bundestag-wrapped://zugang?x=1&code=%20Aigner%20', 'aigner'],
  ])('reads %s', (url, code) => {
    expect(previewCodeFromUrl(url)).toBe(code);
    expect(previewCodeMessage(url)).toEqual({ type: 'preview.code', code });
  });

  it.each([
    'bundestag-wrapped://zugang', 'bundestag-wrapped://zugang?code=', 'bundestag-wrapped://zugang?code=%%%',
    'bundestag-wrapped://abgeordnete?code=xyz', 'https://bundestag-wrapped.de/zugang?code=xyz', '', null, undefined,
  ])('carries no code: %s', url => {
    expect(previewCodeFromUrl(url)).toBeNull();
    expect(previewCodeMessage(url)).toBeNull();
  });

  it('recognises the link even without a code, so the router can swallow it', () => {
    expect(isPreviewCodeLink('bundestag-wrapped://zugang')).toBe(true);
    expect(isPreviewCodeLink('/zugang?code=a')).toBe(true);
    expect(isPreviewCodeLink('/abgeordnete')).toBe(false);
  });
});
