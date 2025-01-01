import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MessageService } from './message.service';
import { PlatformDetectorService } from './platform-detector.service';
import { Message } from '../interfaces/message.interface';
import { firstValueFrom } from 'rxjs';

describe('MessageService', () => {
  let service: MessageService;
  let platformDetector: Partial<jest.Mocked<PlatformDetectorService>>;
  let mockPostMessage: jest.Mock;

  beforeEach(() => {
    // Mock platform detector
    platformDetector = {
      isEmbeddedWebView: jest.fn().mockReturnValue(true),
      resetCache: jest.fn(),
    };

    // Mock window.postMessage
    mockPostMessage = jest.fn();
    window.postMessage = mockPostMessage;

    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: PlatformDetectorService, useValue: platformDetector },
      ],
    });

    service = TestBed.inject(MessageService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  describe('sendMessage', () => {
    it('should send message successfully in WebView', fakeAsync(() => {
      const message = { type: 'TEST', payload: 'data' };
      const subscription = service.sendMessage(message.type, message.payload).subscribe();

      tick();

      expect(mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: message.type,
          payload: message.payload,
          source: 'webview',
          timestamp: expect.any(Number),
        }),
        window.location.origin
      );

      subscription.unsubscribe();
    }));

    it('should throw error when not in WebView', fakeAsync(() => {
      platformDetector.isEmbeddedWebView?.mockReturnValue(false);

      let errorMessage = '';
      service.sendMessage('TEST', 'data').subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      tick();
      expect(errorMessage).toBe('Not in WebView environment');
    }));

    it('should handle postMessage errors', fakeAsync(() => {
      mockPostMessage.mockImplementation(() => {
        throw new Error('PostMessage failed');
      });

      let errorMessage = '';
      service.sendMessage('TEST', 'data').subscribe({
        error: (error) => {
          errorMessage = error.message;
        },
      });

      tick();
      expect(errorMessage).toBe('PostMessage failed');
    }));

  });

  describe('onMessage', () => {
    it('should receive messages with correct type', async () => {
      const testMessage: Message = {
        type: 'TEST',
        payload: 'data',
        timestamp: Date.now(),
        source: 'ios',
      };

      const messagePromise = firstValueFrom(service.onMessage('TEST'));

      window.dispatchEvent(
        new MessageEvent('message', { data: testMessage })
      );

      const receivedMessage = await messagePromise;
      expect(receivedMessage).toMatchObject(testMessage);
    });

    it('should filter messages by type', async () => {
      const messageHandler = jest.fn();
      const subscription = service.onMessage('SPECIFIC_TYPE').subscribe(messageHandler);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'OTHER_TYPE', payload: 'data' },
        })
      );

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'SPECIFIC_TYPE', payload: 'data' },
        })
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(messageHandler).toHaveBeenCalledTimes(1);
      subscription.unsubscribe();
    });



    it('should ignore messages from webview source', async () => {
      const messageHandler = jest.fn();
      const subscription = service.onMessage().subscribe(messageHandler);

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'TEST', payload: 'data', source: 'webview' },
        })
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(messageHandler).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      service.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'message',
        expect.any(Function)
      );
    });

    it('should not process messages after destruction', () => {
      const messageHandler = jest.fn();
      const subscription = service.onMessage().subscribe(messageHandler);

      service.ngOnDestroy();

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'TEST', payload: 'data' },
        })
      );

      expect(messageHandler).not.toHaveBeenCalled();
      subscription.unsubscribe();
    });

    it('should complete subjects on destroy', () => {
      const messageSubjectSpy = jest.spyOn(service['messageSubject'], 'complete');
      const destroySubjectSpy = jest.spyOn(service['destroySubject'], 'complete');

      service.ngOnDestroy();

      expect(messageSubjectSpy).toHaveBeenCalled();
      expect(destroySubjectSpy).toHaveBeenCalled();
    });
  });
});
