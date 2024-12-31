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

  it('should handle cross-tab communication', (done) => {
    const testMessage: Message = {
      type: 'TEST',
      payload: { data: 'test' },
      source: 'browser',
    };

    bridge.addMessageListener((message) => {
      expect(message).toEqual(expect.objectContaining(testMessage));
      done();
    });

    const storageEvent = new StorageEvent('storage', {
      key: 'browser_messages',
      newValue: JSON.stringify(testMessage),
    });
    window.dispatchEvent(storageEvent);
  });

  it('should handle same-window communication', (done) => {
    const testMessage: Message = {
      type: 'TEST',
      payload: { data: 'test' },
      source: 'browser',
    };

    bridge.addMessageListener((message) => {
      expect(message).toEqual(expect.objectContaining(testMessage));
      done();
    });

    window.postMessage(testMessage, window.location.origin);
  });
});
