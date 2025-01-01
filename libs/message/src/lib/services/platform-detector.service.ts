import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectorService {
  private isWebViewCached: boolean | null = null;

  isEmbeddedWebView(): boolean {
    // Use cached result if available
    if (this.isWebViewCached !== null) {
      return this.isWebViewCached;
    }

    try {

      // iOS Bridge Check
      const hasIOSBridge = !!(
        (window as any).webkit?.messageHandlers?.postMessageHandler?.postMessage &&
        // Verify it's actually callable
        typeof (window as any).webkit.messageHandlers.postMessageHandler.postMessage === 'function'
      );

      // Android Bridge Check (if needed)
      const hasAndroidBridge = !!(
        (window as any).Android?.postMessage &&
        typeof (window as any).Android.postMessage === 'function'
      );

      // Cache the result
      this.isWebViewCached = hasIOSBridge || hasAndroidBridge;

      // Log detection result
      console.log('[PlatformDetector] WebView detection:', {
        hasIOSBridge,
        hasAndroidBridge,
        isWebView: this.isWebViewCached
      });

      return this.isWebViewCached;

    } catch (error) {
      console.warn('[PlatformDetector] Error checking WebView:', error);
      // Cache negative result to avoid repeated checks
      this.isWebViewCached = false;
      return false;
    }
  }

  // Optional: Method to reset cache (useful for testing)
  resetCache(): void {
    this.isWebViewCached = null;
  }
}
