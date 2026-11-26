import { createPreviewCodeDelivery } from './previewCodeDelivery';

const LINK = 'bundestag-wrapped://zugang?code=Aigner';
const MESSAGE = { type: 'preview.code', code: 'aigner' };

describe('preview code delivery', () => {
  it('holds a link that arrives before the web is up and delivers it once after the first web message', () => {
    const receive = jest.fn();
    const delivery = createPreviewCodeDelivery(receive);
    delivery.link(LINK);
    expect(receive).not.toHaveBeenCalled();
    delivery.webAlive();
    expect(receive).toHaveBeenCalledTimes(1);
    expect(receive).toHaveBeenCalledWith(MESSAGE);
    delivery.webAlive();
    expect(receive).toHaveBeenCalledTimes(1);
  });

  it('delivers a link immediately while the web is already up', () => {
    const receive = jest.fn();
    const delivery = createPreviewCodeDelivery(receive);
    delivery.webAlive();
    delivery.link(LINK);
    expect(receive).toHaveBeenCalledTimes(1);
    expect(receive).toHaveBeenCalledWith(MESSAGE);
  });

  it('ignores URLs without a code', () => {
    const receive = jest.fn();
    const delivery = createPreviewCodeDelivery(receive);
    delivery.link('bundestag-wrapped://zugang');
    delivery.webAlive();
    expect(receive).not.toHaveBeenCalled();
  });
});
