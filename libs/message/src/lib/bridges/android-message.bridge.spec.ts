import { TestBed } from '@angular/core/testing';
import { AndroidMessageBridge } from './android-message.bridge';
import { Message } from '../interfaces/message.interface';

describe('AndroidMessageBridge', () => {
  let bridge: AndroidMessageBridge;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AndroidMessageBridge],
    });
    bridge = TestBed.inject(AndroidMessageBridge);
  });

  afterEach(() => {
    // Clean up window mock
    delete (window as any).Android;
  });

  describe('sendMessage', () => {
    it('should send message through Android bridge', async () => {
      const receiveMessageSpy = jasmine.createSpy('receiveMessage');
      (window as any).Android = {
        receiveMessage: receiveMessageSpy,
      };

      const message = { type: 'TEST', payload: 'test data' };
      await bridge.sendMessage(JSON.stringify(message));

      expect(receiveMessageSpy).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should throw error when Android bridge is not available', async () => {
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
