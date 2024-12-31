import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectorService {
  private readonly userAgent = navigator.userAgent.toLowerCase();

  isEmbeddedWebView(): boolean {
    return this.isIOSWebView() || this.isAndroidWebView();
  }

  isIOSWebView(): boolean {
    const isIOS = /ipad|iphone|ipod/.test(this.userAgent);

    if (!isIOS) return false;

    try {
      // Primary check: Verify WebKit bridge exists
      const webkit = (window as any).webkit;
      if (!webkit?.messageHandlers?.postMessageListener) {
        return false;
      }

      // Secondary checks to exclude browsers
      const notStandalone = !(window.navigator as any).standalone;
      const notSafari = !/safari/.test(this.userAgent);

      // Additional check for Safari-specific features
      const isSafariBrowser = 'safari' in window;

      return notStandalone && notSafari && !isSafariBrowser;
    } catch (error) {
      console.warn('Error checking iOS WebView:', error);
      return false;
    }
  }

  isAndroidWebView(): boolean {
    const isAndroid = /android/.test(this.userAgent);

    if (!isAndroid) return false;

    try {
      // Primary check: Android bridge
      if ('Android' in window) {
        return true;
      }

      // Secondary checks for WebView
      const isWebView = /wv|webview/.test(this.userAgent);
      const hasVersionString = /version\/\d/.test(this.userAgent);

      // Exclude Chrome browser
      const isChromeButNotWebView =
        /chrome/.test(this.userAgent) && !/wv|webview/.test(this.userAgent);

      if (isChromeButNotWebView) {
        return false;
      }

      return isWebView && hasVersionString;
    } catch (error) {
      console.warn('Error checking Android WebView:', error);
      return false;
    }
  }
}
