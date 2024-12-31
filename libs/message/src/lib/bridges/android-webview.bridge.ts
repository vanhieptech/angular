import { Injectable } from '@angular/core';
import { WebViewBridge, WebViewMessage } from '../interfaces/webview.interface';

@Injectable()
export class AndroidWebViewBridge implements WebViewBridge {
  private listeners: Array<(message: WebViewMessage) => void> = [];

  constructor() {
    window.addEventListener('message', (event) => {
      this.handleNativeMessage(event.data);
    });
  }

  async sendMessage<T>(message: WebViewMessage<T>): Promise<void> {
    try {
      const messageWithTimestamp = {
        ...message,
        timestamp: Date.now(),
      };

      (window as any).Android?.receiveMessage?.(
        JSON.stringify(messageWithTimestamp)
      );
    } catch (error) {
      console.error('Failed to send message to Android WebView:', error);
      throw error;
    }
  }

  addMessageListener<T>(callback: (message: WebViewMessage<T>) => void): void {
    this.listeners.push(callback as (message: WebViewMessage) => void);
  }

  removeMessageListener<T>(
    callback: (message: WebViewMessage<T>) => void
  ): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  private handleNativeMessage(message: WebViewMessage): void {
    this.listeners.forEach((listener) => listener(message));
  }
}
