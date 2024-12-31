import { TestBed } from '@angular/core/testing';
import { BrowserMessageBridge } from './browser-message.bridge';
import { Message } from '../interfaces/message.interface';

describe('BrowserMessageBridge', () => {
  let bridge: BrowserMessageBridge;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrowserMessageBridge],
    });
    bridge = TestBed.inject(BrowserMessageBridge);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('sendMessage', () => {
    it('should store message in localStorage and post window message', async () => {
      const testMessage = JSON.stringify({
        type: 'TEST',
        payload: 'test data',
      });
      const postMessageSpy = spyOn(window, 'postMessage');

      await bridge.sendMessage(testMessage);

      expect(localStorage.getItem('browser_messages')).toBe(testMessage);
      expect(postMessageSpy).toHaveBeenCalledWith(
        testMessage,
        window.location.origin
      );
    });

    it('should handle localStorage errors', async () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');
      const testMessage = JSON.stringify({ type: 'TEST' });

      await expect(bridge.sendMessage(testMessage)).rejects.toThrow();
    });
  });

  describe('message listeners', () => {
    it('should handle storage events', (done) => {
      const testMessage: Message = {
        type: 'TEST',
        payload: 'test data',
      };

      bridge.addMessageListener((message) => {
        expect(message).toEqual({
          ...testMessage,
          source: 'browser',
        });
        done();
      });

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'browser_messages',
          newValue: JSON.stringify(testMessage),
        })
      );
    });

    it('should handle window messages from same origin', (done) => {
      const testMessage: Message = {
        type: 'TEST',
        payload: 'test data',
      };

      bridge.addMessageListener((message) => {
        expect(message).toEqual({
          ...testMessage,
          source: 'browser',
        });
        done();
      });

      window.postMessage(testMessage, window.location.origin);
    });

    it('should ignore invalid storage events', () => {
      const listenerSpy = jasmine.createSpy('listener');
      bridge.addMessageListener(listenerSpy);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'browser_messages',
          newValue: 'invalid json',
        })
      );

      expect(listenerSpy).not.toHaveBeenCalled();
    });

    it('should remove message listener', () => {
      const listenerSpy = jasmine.createSpy('listener');
      bridge.addMessageListener(listenerSpy);
      bridge.removeMessageListener(listenerSpy);

      window.postMessage({ type: 'TEST' }, window.location.origin);

      expect(listenerSpy).not.toHaveBeenCalled();
    });

    it('should handle null storage value', () => {
      const listenerSpy = jasmine.createSpy('listener');
      bridge.addMessageListener(listenerSpy);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'browser_messages',
          newValue: null,
        })
      );

      expect(listenerSpy).not.toHaveBeenCalled();
    });
  });
});
