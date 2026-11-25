import { redirectSystemPath } from '../../app/+native-intent';

describe('native intent', () => {
  it('keeps the home route for the preview-code link and leaves other paths alone', () => {
    expect(redirectSystemPath({ path: 'bundestag-wrapped://zugang?code=x', initial: true })).toBe('/');
    expect(redirectSystemPath({ path: '/zugang?code=x', initial: false })).toBe('/');
    expect(redirectSystemPath({ path: '/abgeordnete', initial: false })).toBe('/abgeordnete');
  });
});
