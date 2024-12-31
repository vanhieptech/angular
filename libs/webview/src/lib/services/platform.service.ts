import { Injectable } from '@angular/core';
import { PlatformService } from '../interfaces/webview.interface';

@Injectable({
  providedIn: 'root',
})
export class WebViewPlatformService implements PlatformService {
  isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );
  }

  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  isWebView(): boolean {
    const standalone = (window.navigator as any).standalone;
    const userAgent = navigator.userAgent.toLowerCase();

    if (this.isIOS()) {
      return !standalone && !userAgent.includes('safari');
    }

    if (this.isAndroid()) {
      return userAgent.includes('wv') || userAgent.includes('webview');
    }

    return false;
  }
}
