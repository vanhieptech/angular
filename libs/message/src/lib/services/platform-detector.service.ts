import { Injectable } from '@angular/core';
import { PlatformDetector } from '../interfaces/message.interface';

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectorService implements PlatformDetector {
  private readonly userAgent = navigator.userAgent.toLowerCase();
  private readonly platform = navigator.platform;

  isEmbeddedWebView(): boolean {
    return this.isIOSWebView() || this.isAndroidWebView();
  }

  isIOSWebView(): boolean {
    const isIOS = /ipad|iphone|ipod/.test(this.userAgent);

    if (!isIOS) return false;

    // Check for WebKit and specific message handler
    const webkit = (window as any).webkit;
    const hasWebKit = 'webkit' in window && 'messageHandlers' in webkit;
    const hasPostMessageListener =
      hasWebKit && 'postMessageListener' in webkit.messageHandlers;

    const notStandalone = !(window.navigator as any).standalone;
    const notSafari = !/safari/.test(this.userAgent);
    const hasAppleDevice = /apple/i.test(this.platform);

    // Must have WebKit, postMessageListener, and meet other iOS WebView criteria
    return (
      hasWebKit &&
      hasPostMessageListener &&
      notStandalone &&
      notSafari &&
      hasAppleDevice
    );
  }

  isAndroidWebView(): boolean {
    const isAndroid = /android/.test(this.userAgent);

    if (!isAndroid) return false;

    // Comprehensive Android WebView checks
    const hasAndroidBridge = 'Android' in window;
    const isWebView = /wv|webview/.test(this.userAgent);
    const hasVersionString = /version\/\d/.test(this.userAgent);
    const noChrome =
      !/chrome/.test(this.userAgent) ||
      (/chrome/.test(this.userAgent) && /android/.test(this.userAgent));

    return hasAndroidBridge || (isWebView && hasVersionString && noChrome);
  }

  isBrowser(): boolean {
    return !this.isEmbeddedWebView();
  }
}
