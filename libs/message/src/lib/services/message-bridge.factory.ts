import { Injectable } from '@angular/core';
import { MessageBridge } from '../interfaces/message.interface';
import { PlatformDetectorService } from './platform-detector.service';
import { IOSMessageBridge } from '../bridges/ios-message.bridge';
import { AndroidMessageBridge } from '../bridges/android-message.bridge';
import { BrowserMessageBridge } from '../bridges/browser-message.bridge';

@Injectable({
  providedIn: 'root',
})
export class MessageBridgeFactory {
  constructor(private platformDetector: PlatformDetectorService) {}

  createBridge(): MessageBridge {
    if (this.platformDetector.isIOSWebView()) {
      return new IOSMessageBridge();
    }

    if (this.platformDetector.isAndroidWebView()) {
      return new AndroidMessageBridge();
    }

    // Default to browser messaging for non-WebView environments
    return new BrowserMessageBridge();
  }
}
