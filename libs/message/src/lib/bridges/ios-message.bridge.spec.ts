import { TestBed } from '@angular/core/testing';
import { IOSMessageBridge } from './ios-message.bridge';
import { Message } from '../interfaces/message.interface';

describe('IOSMessageBridge', () => {
  let bridge: IOSMessageBridge;
  let postMessageSpy: jest.Mock;

  beforeEach(() => {
    postMessageSpy = jest.fn();
    TestBed.configureTestingModule({
      providers: [IOSMessageBridge],
    });
    bridge = TestBed.inject(IOSMessageBridge);
  });

  afterEach(() => {
    delete (window as any).webkit;
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message through webkit bridge', async () => {
      (window as any).webkit = {
        messageHandlers: {
          postMessageListener: postMessageSpy,
        },
      };

      const message = { type: 'TEST', payload: 'test data' };
      await bridge.sendMessage(JSON.stringify(message));

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining('TEST')
      );
    });

    it('should throw error when webkit bridge is not available', async () => {
      const message = { type: 'TEST', payload: 'test data' };

      await expect(
        bridge.sendMessage(JSON.stringify(message))
      ).rejects.toThrow();
    });
  });

  describe('message listeners', () => {
    it('should handle native messages', (done) => {
      const testMessage: Message = {
        type: 'TEST',
        payload: 'test data',
        source: 'native',
      };

      bridge.addMessageListener((message) => {
        expect(message).toEqual(testMessage);
        done();
      });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: testMessage,
        })
      );
    });

    it('should ignore non-native messages', () => {
      const listenerSpy = jasmine.createSpy('listener');
      bridge.addMessageListener(listenerSpy);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { source: 'browser', type: 'TEST' },
        })
      );

      expect(listenerSpy).not.toHaveBeenCalled();
    });

    it('should remove message listener', () => {
      const listenerSpy = jasmine.createSpy('listener');
      bridge.addMessageListener(listenerSpy);
      bridge.removeMessageListener(listenerSpy);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { source: 'native', type: 'TEST' },
        })
      );

      expect(listenerSpy).not.toHaveBeenCalled();
    });
  });
});
