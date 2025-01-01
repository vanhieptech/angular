import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectorService {
  private isWebViewCached: boolean | null = null;

  isEmbeddedWebView(): boolean {
    if (this.isWebViewCached !== null) {
      return this.isWebViewCached;
    }

    try {
      const hasIOSBridge = !!(
        (window as any).webkit?.messageHandlers?.postMessageHandler?.postMessage &&
        typeof (window as any).webkit.messageHandlers.postMessageHandler.postMessage === 'function'
      );

      const hasAndroidBridge = !!(
        (window as any).Android?.postMessage &&
        typeof (window as any).Android.postMessage === 'function'
      );

      this.isWebViewCached = hasIOSBridge || hasAndroidBridge;
      return this.isWebViewCached;

    } catch (error) {
      this.isWebViewCached = false;
      return false;
    }
  }

  resetCache(): void {
    this.isWebViewCached = null;
  }
}
