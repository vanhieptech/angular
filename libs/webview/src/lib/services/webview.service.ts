import { Injectable, OnDestroy } from '@angular/core';
import { WebViewBridge, WebViewMessage } from '../interfaces/webview.interface';
import { WebViewBridgeFactory } from './webview.factory';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class WebViewService implements OnDestroy {
  private bridge: WebViewBridge | null;
  private messageSubject = new Subject<WebViewMessage>();
  private destroyed = false;

  constructor(private bridgeFactory: WebViewBridgeFactory) {
    this.bridge = this.bridgeFactory.createBridge();

    if (this.bridge) {
      this.bridge.addMessageListener(this.handleMessage.bind(this));
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.messageSubject.complete();
  }

  async sendMessage<T>(type: string, payload: T): Promise<void> {
    if (!this.bridge) {
      throw new Error('WebView bridge is not available');
    }

    const message: WebViewMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    await this.bridge.sendMessage(message);
  }

  onMessage<T>(type?: string): Observable<WebViewMessage<T>> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((message) => !type || message.type === type)) as Observable<
      WebViewMessage<T>
    >;
  }

  private handleMessage(message: WebViewMessage): void {
    if (!this.destroyed) {
      this.messageSubject.next(message);
    }
  }
}
