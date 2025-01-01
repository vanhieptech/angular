import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MessageService } from './message.service';
import { PlatformDetectorService } from './platform-detector.service';
import { Message, LogMessage } from '../interfaces/message.interface';
import { firstValueFrom } from 'rxjs';

describe('MessageService', () => {
  let service: MessageService;
  let platformDetector: any;
  let originalConsole: any;
  let mockPostMessage: jest.Mock;

  beforeEach(() => {
    // Store original console methods
    originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

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
    // Restore console methods
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;

    // Clean up service
    service.ngOnDestroy();
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize console logging', () => {
      const logSpy = jest.spyOn(service['logSubject'], 'next');

      console.log('test log');
      console.warn('test warning');
      console.error('test error');
      console.info('test info');

      expect(logSpy).toHaveBeenCalledTimes(4);
    });
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
        }),
        window.location.origin
      );

      subscription.unsubscribe();
    }));

    it('should throw error when not in WebView', fakeAsync(() => {
      platformDetector.isEmbeddedWebView.mockReturnValue(false);

      service.sendMessage('TEST', 'data').subscribe({
        error: (error) => {
          expect(error.message).toBe('Not in WebView environment');
        },
      });

      tick();
    }));

    it('should handle postMessage errors', fakeAsync(() => {
      mockPostMessage.mockImplementation(() => {
        throw new Error('PostMessage failed');
      });

      service.sendMessage('TEST', 'data').subscribe({
        error: (error) => {
          expect(error.message).toBe('PostMessage failed');
        },
      });

      tick();
    }));

    it('should timeout after 5 seconds', fakeAsync(() => {
      mockPostMessage.mockImplementation(() => {
        // Simulate long operation
      });

      const subscription = service.sendMessage('TEST', 'data').subscribe({
        error: (error) => {
          expect(error.message).toBe('Message sending timed out');
        },
      });

      tick(6000); // Wait longer than timeout
      subscription.unsubscribe();
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

      // Simulate message reception
      window.dispatchEvent(
        new MessageEvent('message', { data: testMessage })
      );

      const receivedMessage = await messagePromise;
      expect(receivedMessage).toMatchObject(testMessage);
    });

    it('should filter messages by type', async () => {
      const messageHandler = jest.fn();
      const subscription = service.onMessage('SPECIFIC_TYPE').subscribe(messageHandler);

      // Simulate different message types
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

    it('should handle invalid message format', async () => {
      const errorHandler = jest.fn();
      const subscription = service.onMessage().subscribe({
        error: errorHandler,
      });

      window.dispatchEvent(
        new MessageEvent('message', {
          data: { invalid: 'format' },
        })
      );

      await new Promise(resolve => setTimeout(resolve, 0));
      subscription.unsubscribe();
    });
  });

  describe('Logging', () => {
    it('should emit log messages', (done) => {
      service.getLogs().subscribe((log: LogMessage) => {
        expect(log).toMatchObject({
          level: 'info',
          icon: '📝',
          message: expect.any(String),
          timestamp: expect.any(String),
        });
        done();
      });

      console.log('Test log message');
    });

    it('should handle object logging', (done) => {
      const testObject = { test: 'value' };

      service.getLogs().subscribe((log: LogMessage) => {
        expect(log.message).toContain(JSON.stringify(testObject));
        done();
      });

      console.log(testObject);
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
  });
});
