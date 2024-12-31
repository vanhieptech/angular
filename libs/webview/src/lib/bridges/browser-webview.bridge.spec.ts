import { TestBed } from '@angular/core/testing';
import { BrowserWebViewBridge } from './browser-webview.bridge';
import { WebViewMessage } from '../interfaces/webview.interface';

describe('BrowserWebViewBridge', () => {
  let bridge: BrowserWebViewBridge;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BrowserWebViewBridge],
    });
    bridge = TestBed.inject(BrowserWebViewBridge);
  });

  it('should handle cross-tab communication', (done) => {
    const testMessage: WebViewMessage = {
      type: 'TEST',
      payload: { data: 'test' },
    };

    bridge.addMessageListener((message) => {
      expect(message).toEqual(expect.objectContaining(testMessage));
      done();
    });

    // Simulate storage event
    const storageEvent = new StorageEvent('storage', {
      key: 'webview_messages',
      newValue: JSON.stringify(testMessage),
    });
    window.dispatchEvent(storageEvent);
  });

  it('should handle same-window communication', (done) => {
    const testMessage: WebViewMessage = {
      type: 'TEST',
      payload: { data: 'test' },
    };

    bridge.addMessageListener((message) => {
      expect(message).toEqual(expect.objectContaining(testMessage));
      done();
    });

    // Simulate postMessage
    window.postMessage(testMessage, window.location.origin);
  });
});
