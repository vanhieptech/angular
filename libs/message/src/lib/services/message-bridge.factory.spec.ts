import { TestBed } from '@angular/core/testing';
import { MessageBridgeFactory } from './message-bridge.factory';
import { PlatformDetectorService } from './platform-detector.service';
import { IOSMessageBridge } from '../bridges/ios-message.bridge';
import { AndroidMessageBridge } from '../bridges/android-message.bridge';
import { BrowserMessageBridge } from '../bridges/browser-message.bridge';

describe('MessageBridgeFactory', () => {
  let factory: MessageBridgeFactory;
  let platformDetector: jest.Mocked<any>;

  beforeEach(() => {
    platformDetector = {
      isIOSWebView: jest.fn(),
      isAndroidWebView: jest.fn(),
      isEmbeddedWebView: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MessageBridgeFactory,
        { provide: PlatformDetectorService, useValue: platformDetector },
      ],
    });

    factory = TestBed.inject(MessageBridgeFactory);
  });

  it('should create iOS bridge when on iOS WebView', () => {
    platformDetector.isIOSWebView.mockReturnValue(true);
    platformDetector.isAndroidWebView.mockReturnValue(false);

    const bridge = factory.createBridge();
    expect(bridge).toBeInstanceOf(IOSMessageBridge);
  });

  it('should create Android bridge when on Android WebView', () => {
    platformDetector.isIOSWebView.mockReturnValue(false);
    platformDetector.isAndroidWebView.mockReturnValue(true);

    const bridge = factory.createBridge();
    expect(bridge).toBeInstanceOf(AndroidMessageBridge);
  });

  it('should create browser bridge by default', () => {
    platformDetector.isIOSWebView.mockReturnValue(false);
    platformDetector.isAndroidWebView.mockReturnValue(false);

    const bridge = factory.createBridge();
    expect(bridge).toBeInstanceOf(BrowserMessageBridge);
  });

  it('should prioritize iOS over Android when both are detected', () => {
    platformDetector.isIOSWebView.mockReturnValue(true);
    platformDetector.isAndroidWebView.mockReturnValue(true);

    const bridge = factory.createBridge();
    expect(bridge).toBeInstanceOf(IOSMessageBridge);
  });

  it('should handle platform detection errors gracefully', () => {
    platformDetector.isIOSWebView.mockImplementation(() => {
      throw new Error('Detection failed');
    });
    platformDetector.isAndroidWebView.mockReturnValue(false);

    const bridge = factory.createBridge();
    expect(bridge).toBeInstanceOf(BrowserMessageBridge);
  });
});
