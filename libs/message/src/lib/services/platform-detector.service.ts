import { Injectable } from '@angular/core';
import { PlatformDetector } from '../interfaces/message.interface';

@Injectable({
  providedIn: 'root',
})
export class PlatformDetectorService implements PlatformDetector {
  isEmbeddedWebView(): boolean {
    return this.isIOSWebView() || this.isAndroidWebView();
  }

  isIOSWebView(): boolean {
    // Check for WKWebView
    const hasWebKit =
      'webkit' in window && 'messageHandlers' in (window as any).webkit;

    // Additional iOS WebView checks
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const notStandalone = !(window.navigator as any).standalone;
    const notSafari = !navigator.userAgent.includes('Safari');

    return isIOS && hasWebKit && notStandalone && notSafari;
  }

  isAndroidWebView(): boolean {
    // Check for Android WebView bridge
    const hasAndroidBridge = 'Android' in window;

    // Additional Android WebView checks
    const isAndroid = /Android/.test(navigator.userAgent);
    const isWebView = /wv|WebView/.test(navigator.userAgent);

    return isAndroid && (hasAndroidBridge || isWebView);
  }
}
