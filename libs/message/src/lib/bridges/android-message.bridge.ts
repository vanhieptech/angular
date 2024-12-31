import { Injectable } from '@angular/core';
import { MessageBridge, Message } from '../interfaces/message.interface';

@Injectable()
export class AndroidMessageBridge implements MessageBridge {
  private listeners: Array<(message: Message) => void> = [];

  constructor() {
    window.addEventListener('message', (event) => {
      if (event.data?.source === 'native') {
        this.handleMessage(event.data);
      }
    });
  }

  async sendMessage(serializedMessage: string): Promise<void> {
    try {
      (window as any).Android?.receiveMessage?.(serializedMessage);
    } catch (error) {
      console.error('Failed to send message to Android WebView:', error);
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
