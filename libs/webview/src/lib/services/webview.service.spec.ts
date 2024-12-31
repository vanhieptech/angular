import { TestBed } from '@angular/core/testing';
import { WebViewService } from './webview.service';
import { WebViewBridgeFactory } from './webview.factory';
import { WebViewPlatformService } from './platform.service';
import { WebViewMessage } from '../interfaces/webview.interface';

describe('WebViewService', () => {
  let service: WebViewService;
  let platformService: WebViewPlatformService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebViewService, WebViewBridgeFactory, WebViewPlatformService],
    });

    service = TestBed.inject(WebViewService);
    platformService = TestBed.inject(WebViewPlatformService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should handle messages correctly', (done) => {
    const testMessage = { type: 'TEST', payload: { data: 'test' } };

    service.onMessage().subscribe((message) => {
      expect(message).toEqual(testMessage);
      done();
    });

    // Simulate receiving a message
    window.dispatchEvent(new MessageEvent('message', { data: testMessage }));
  });

  it('should use browser bridge for web communication', async () => {
    const testMessage = { type: 'TEST', payload: { data: 'test' } };

    // Subscribe to messages
    const receivedMessages: WebViewMessage[] = [];
    service.onMessage().subscribe((message) => {
      receivedMessages.push(message);
    });

    // Send message
    await service.sendMessage(testMessage.type, testMessage.payload);

    // Verify message was stored in localStorage
    const storedMessage = localStorage.getItem('webview_messages');
    expect(storedMessage).toBeTruthy();
    expect(JSON.parse(storedMessage!)).toEqual(
      expect.objectContaining(testMessage)
    );
  });

  it('should handle messages from other tabs', (done) => {
    const testMessage = { type: 'TEST', payload: { data: 'test' } };

    service.onMessage().subscribe((message) => {
      expect(message).toEqual(testMessage);
      done();
    });

    // Simulate message from another tab
    const storageEvent = new StorageEvent('storage', {
      key: 'webview_messages',
      newValue: JSON.stringify(testMessage),
    });
    window.dispatchEvent(storageEvent);
  });
});
