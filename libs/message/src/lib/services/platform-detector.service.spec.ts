import { TestBed } from '@angular/core/testing';
import { PlatformDetectorService } from './platform-detector.service';

describe('PlatformDetectorService', () => {
  let service: PlatformDetectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformDetectorService],
    });
    service = TestBed.inject(PlatformDetectorService);
  });

  describe('iOS WebView Detection', () => {
    it('should detect iOS WebView when all conditions are met', () => {
      // Mock iOS environment
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      // Mock WebKit bridge
      (window as any).webkit = {
        messageHandlers: {
          postMessageListener: {},
        },
      };

      expect(service.isIOSWebView()).toBe(true);
    });

    it('should return false for Safari browser', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });

      expect(service.isIOSWebView()).toBe(false);
    });
  });

  describe('Android WebView Detection', () => {
    it('should detect Android WebView with Android interface', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.77 Mobile Safari/537.36',
        configurable: true,
      });

      (window as any).Android = {};

      expect(service.isAndroidWebView()).toBe(true);
    });

    it('should return false for Chrome mobile browser', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36',
        configurable: true,
      });

      expect(service.isAndroidWebView()).toBe(false);
    });
  });
});
