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
    console.log('[PlatformDetector] iOS check:', {
      isIOS,
      userAgent: this.userAgent,
    });

    if (!isIOS) return false;

    try {
      // Primary check: Verify WebKit bridge exists
      const webkit = (window as any).webkit;
      const hasWebKitBridge = !!webkit?.messageHandlers?.postMessageHandler;
      console.log('[PlatformDetector] WebKit bridge check:', {
        hasWebKitBridge,
      });

      if (!hasWebKitBridge) {
        return false;
      }

      // Secondary checks to exclude browsers
      const notStandalone = !(window.navigator as any).standalone;
      const notSafari = !/safari/.test(this.userAgent);
      const isSafariBrowser = 'safari' in window;

      console.log('[PlatformDetector] iOS additional checks:', {
        notStandalone,
        notSafari,
        isSafariBrowser,
      });

      return notStandalone && notSafari && !isSafariBrowser;
    } catch (error) {
      console.warn('Error checking iOS WebView:', error);
      return false;
    }
  }

  isAndroidWebView(): boolean {
    const isAndroid = /android/.test(this.userAgent);
    console.log('[PlatformDetector] Android check:', {
      isAndroid,
      userAgent: this.userAgent,
    });

    if (!isAndroid) return false;

    try {
      // Primary check: Android bridge
      const hasAndroidBridge = 'Android' in window;
      console.log('[PlatformDetector] Android bridge check:', {
        hasAndroidBridge,
      });

      if (hasAndroidBridge) {
        return true;
      }

      // Secondary checks for WebView
      const isWebView = /wv|webview/.test(this.userAgent);
      const hasVersionString = /version\/\d/.test(this.userAgent);
      const isChromeButNotWebView =
        /chrome/.test(this.userAgent) && !/wv|webview/.test(this.userAgent);

      console.log('[PlatformDetector] Android additional checks:', {
        isWebView,
        hasVersionString,
        isChromeButNotWebView,
      });

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
