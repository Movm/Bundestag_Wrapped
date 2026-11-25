import * as WebBrowser from 'expo-web-browser';
import { createWebMessageHandler } from './onWebMessage';
import { shareFromWeb } from './shareFromWeb';

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({})) }));
jest.mock('./shareFromWeb', () => ({ shareFromWeb: jest.fn(async () => true) }));

describe('web message handler', () => {
  it('answers a share with share.result', async () => {
    const receive = jest.fn();
    await createWebMessageHandler(receive)({ type: 'share', id: 7, url: 'https://x.test' });
    expect(shareFromWeb).toHaveBeenCalled();
    expect(receive).toHaveBeenCalledWith({ type: 'share.result', id: 7, ok: true });
  });

  it('opens urls in the in-app browser', async () => {
    await createWebMessageHandler(jest.fn())({ type: 'openUrl', url: 'https://x.test/a' });
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://x.test/a');
  });

  it('ignores unknown message types', async () => {
    const receive = jest.fn();
    await expect(createWebMessageHandler(receive)({ type: 'from-the-future' } as never)).resolves.toBeUndefined();
    expect(receive).not.toHaveBeenCalled();
  });
});
