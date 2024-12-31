import { Injectable } from '@angular/core';
import { WebViewBridge, WebViewMessage } from '../interfaces/webview.interface';

@Injectable()
export class BrowserWebViewBridge implements WebViewBridge {
  private readonly STORAGE_KEY = 'webview_messages';
  private listeners: Array<(message: WebViewMessage) => void> = [];

  constructor() {
    // Listen for messages from other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY) {
        try {
          const message = JSON.parse(event.newValue || '');
          this.handleNativeMessage(message);
        } catch (error) {
          console.error('Failed to parse message from storage:', error);
        }
      }
    });

    // Listen for messages in the same window
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

      // Store message in localStorage for cross-tab communication
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(messageWithTimestamp)
      );

      // Dispatch message event for same-window communication
      window.postMessage(messageWithTimestamp, window.location.origin);
    } catch (error) {
      console.error('Failed to send browser message:', error);
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
