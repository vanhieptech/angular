import { TestBed } from '@angular/core/testing';
import { PlatformDetectorService } from './platform-detector.service';

describe('PlatformDetectorService', () => {
  let service: PlatformDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformDetectorService]
    });
    service = TestBed.inject(PlatformDetectorService);
  });

  afterEach(() => {
    service.resetCache();
    (window as any).webkit = undefined;
    (window as any).Android = undefined;
  });

  describe('WebView Detection', () => {
    it('should detect iOS WebView with complete bridge', () => {
      const postMessageMock = jest.fn();
      (window as any).webkit = {
        messageHandlers: {
          postMessageHandler: {
            postMessage: postMessageMock
          }
        }
      };

      expect(service.isEmbeddedWebView()).toBe(true);
      expect(service.isEmbeddedWebView()).toBe(true); // Verify caching
    });

    it('should detect Android WebView with complete bridge', () => {
      const postMessageMock = jest.fn();
      (window as any).Android = {
        postMessage: postMessageMock
      };

      expect(service.isEmbeddedWebView()).toBe(true);
      expect(service.isEmbeddedWebView()).toBe(true); // Verify caching
    });

    it('should handle missing webkit bridge', () => {
      expect(service.isEmbeddedWebView()).toBe(false);
    });

    it('should handle missing Android bridge', () => {
      (window as any).Android = undefined;
      expect(service.isEmbeddedWebView()).toBe(false);
    });

    it('should handle incomplete iOS bridge structure', () => {
      (window as any).webkit = {};
      expect(service.isEmbeddedWebView()).toBe(false);

      (window as any).webkit = { messageHandlers: {} };
      expect(service.isEmbeddedWebView()).toBe(false);

      (window as any).webkit = { messageHandlers: { postMessageHandler: {} } };
      expect(service.isEmbeddedWebView()).toBe(false);
    });

    it('should handle non-function postMessage in iOS bridge', () => {
      (window as any).webkit = {
        messageHandlers: {
          postMessageHandler: {
            postMessage: 'not a function'
          }
        }
      };
      expect(service.isEmbeddedWebView()).toBe(false);
    });

    it('should handle non-function postMessage in Android bridge', () => {
      (window as any).Android = {
        postMessage: 'not a function'
      };
      expect(service.isEmbeddedWebView()).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should use cached result for subsequent calls', () => {
      (window as any).webkit = {
        messageHandlers: {
          postMessageHandler: {
            postMessage: jest.fn()
          }
        }
      };

      expect(service.isEmbeddedWebView()).toBe(true);
      (window as any).webkit = undefined;
      expect(service.isEmbeddedWebView()).toBe(true);
    });

    it('should reset cache correctly', () => {
      (window as any).webkit = {
        messageHandlers: {
          postMessageHandler: {
            postMessage: jest.fn()
          }
        }
      };

      expect(service.isEmbeddedWebView()).toBe(true);
      service.resetCache();
      (window as any).webkit = undefined;
      expect(service.isEmbeddedWebView()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values in bridge objects', () => {
      (window as any).webkit = null;
      (window as any).Android = null;
      expect(service.isEmbeddedWebView()).toBe(false);
    });

    it('should handle undefined message handlers', () => {
      (window as any).webkit = {
        messageHandlers: undefined
      };
      expect(service.isEmbeddedWebView()).toBe(false);
    });
  });
});
