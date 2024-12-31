import { Injectable } from '@angular/core';
import { WebViewBridge } from '../interfaces/webview.interface';
import { WebViewPlatformService } from './platform.service';
import { IOSWebViewBridge } from '../bridges/ios-webview.bridge';
import { AndroidWebViewBridge } from '../bridges/android-webview.bridge';
import { BrowserWebViewBridge } from '../bridges/browser-webview.bridge';

@Injectable({
  providedIn: 'root',
})
export class WebViewBridgeFactory {
  constructor(private platformService: WebViewPlatformService) {}

  createBridge(): WebViewBridge {
    if (this.platformService.isWebView()) {
      if (this.platformService.isIOS()) {
        return new IOSWebViewBridge();
      }

      if (this.platformService.isAndroid()) {
        return new AndroidWebViewBridge();
      }
    }

    // Default to browser bridge for web/tab communication
    return new BrowserWebViewBridge();
  }
}
