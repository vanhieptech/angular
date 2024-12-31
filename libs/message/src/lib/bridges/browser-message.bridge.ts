import { Injectable } from '@angular/core';
import { MessageBridge, Message } from '../interfaces/message.interface';

@Injectable()
export class BrowserMessageBridge implements MessageBridge {
  private readonly STORAGE_KEY = 'browser_messages';
  private listeners: Array<(message: Message) => void> = [];

  constructor() {
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY) {
        try {
          const message = JSON.parse(event.newValue || '');
          this.handleMessage({ ...message, source: 'browser' });
        } catch (error) {
          console.error('Failed to parse message from storage:', error);
        }
      }
    });

    window.addEventListener('message', (event) => {
      if (event.origin === window.location.origin) {
        this.handleMessage({ ...event.data, source: 'browser' });
      }
    });
  }

  async sendMessage(serializedMessage: string): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, serializedMessage);
      window.postMessage(serializedMessage, window.location.origin);
    } catch (error) {
      console.error('Failed to send browser message:', error);
      throw error;
    }
  }

  addMessageListener<T>(callback: (message: Message<T>) => void): void {
    this.listeners.push(callback as (message: Message) => void);
  }

  removeMessageListener<T>(callback: (message: Message<T>) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  private handleMessage(message: Message): void {
    this.listeners.forEach((listener) => listener(message));
  }
}
