import { Injectable, OnDestroy } from '@angular/core';
import { MessageBridge, Message, LogMessage } from '../interfaces/message.interface';
import { MessageBridgeFactory } from './message-bridge.factory';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  private bridge: MessageBridge;
  private messageSubject = new Subject<Message>();
  private logSubject = new Subject<LogMessage>();
  private destroyed = false;

  constructor(private bridgeFactory: MessageBridgeFactory) {
    this.bridge = this.bridgeFactory.createBridge();
    this.bridge.addMessageListener(this.handleMessage.bind(this));
    this.initializeLogging();
  }

  private initializeLogging() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    console.log = (...args) => {
      this.log('info', '📝', args);
      originalConsole.log.apply(console, args);
    };

    console.warn = (...args) => {
      this.log('warning', '⚠️', args);
      originalConsole.warn.apply(console, args);
    };

    console.error = (...args) => {
      this.log('error', '❌', args);
      originalConsole.error.apply(console, args);
    };

    console.info = (...args) => {
      this.log('info', 'ℹ️', args);
      originalConsole.info.apply(console, args);
    };
  }

  private log(level: 'info' | 'warning' | 'error', icon: string, args: any[]) {
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    this.logSubject.next({
      level,
      icon,
      message,
      timestamp: new Date().toISOString()
    });
  }

  getLogs(): Observable<LogMessage> {
    return this.logSubject.asObservable();
  }

  async sendMessage<T>(type: string, payload: T): Promise<void> {
    try {
      const message: Message<T> = {
        type,
        payload,
        timestamp: Date.now(),
        source: 'webview'
      };

      this.log('info', '📤', [`Sending message: ${JSON.stringify(message)}`]);
      const serializedMessage = JSON.stringify(message);
      await this.bridge.sendMessage(serializedMessage);
      this.log('info', '✅', ['Message sent successfully']);
    } catch (error) {
      this.log('error', '❌', [`Failed to send message: ${error}`]);
      throw error;
    }
  }

  onMessage<T>(type?: string): Observable<Message<T>> {
    return this.messageSubject.asObservable()
      .pipe(filter((message) => !type || message.type === type)) as Observable<Message<T>>
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.messageSubject.complete();
    this.logSubject.complete();
  }

  private handleMessage(messageData: string | Message): void {
    if (this.destroyed) return;

    try {
      const message = this.parseMessage(messageData);
      if (message) {
        this.log('info', '📥', [`Received message: ${JSON.stringify(message)}`]);
        this.messageSubject.next(message);
      }
    } catch (error) {
      this.log('error', '❌', [`Failed to handle message: ${error}`]);
    }
  }

  private parseMessage(data: string | Message): Message | null {
    try {
      if (typeof data === 'object' && 'type' in data) {
        return data;
      }

      if (typeof data === 'string') {
        return JSON.parse(data);
      }

      this.log('warning', '⚠️', ['Invalid message format:', data]);
      return null;
    } catch (error) {
      this.log('error', '❌', ['Failed to parse message:', error]);
      return null;
    }
  }
}
