import { shareFromWeb } from './shareFromWeb';

jest.mock('react-native', () => ({ Share: { share: jest.fn(), dismissedAction: 'dismissedAction' } }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { cache: 'cache' } }));

const { Share } = jest.requireMock('react-native');

describe('shareFromWeb', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs the error and resolves false when the native share throws', async () => {
    const error = new Error('boom');
    Share.share.mockRejectedValueOnce(error);
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(shareFromWeb({ type: 'share', id: 1, text: 'hi' })).resolves.toBe(false);
    expect(log).toHaveBeenCalledWith('[wrapped-share] share failed', error);
  });
});
