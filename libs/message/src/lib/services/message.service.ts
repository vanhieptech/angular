import { Injectable, OnDestroy } from '@angular/core';
import { MessageBridge, Message } from '../interfaces/message.interface';
import { MessageBridgeFactory } from './message-bridge.factory';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  private bridge: MessageBridge;
  private messageSubject = new Subject<Message>();
  private destroyed = false;

  constructor(private bridgeFactory: MessageBridgeFactory) {
    this.bridge = this.bridgeFactory.createBridge();
    this.bridge.addMessageListener(this.handleMessage.bind(this));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.messageSubject.complete();
  }

  async sendMessage<T>(type: string, payload: T): Promise<void> {
    const message: Message<T> = {
      type,
      timestamp: Date.now(),
      ...(typeof payload === 'object' ? payload : { payload }),
    };

    const serializedMessage = JSON.stringify(message);
    await this.bridge.sendMessage(serializedMessage);
  }

  onMessage<T>(type?: string): Observable<Message<T>> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((message) => !type || message.type === type)) as Observable<
      Message<T>
    >;
  }

  private parseMessage(data: string | Message): Message | null {
    try {
      if (typeof data === 'object' && 'type' in data) {
        return data;
      }

      if (typeof data === 'string') {
        if (data.startsWith('{') || data.startsWith('[')) {
          return JSON.parse(data);
        }
        return {
          type: 'UNKNOWN',
          payload: data,
          timestamp: Date.now(),
        };
      }

      console.warn('Invalid message format:', data);
      return null;
    } catch (error) {
      console.error('Failed to parse message:', error);
      return null;
    }
  }

  private handleMessage(messageData: string | Message): void {
    if (this.destroyed) return;

    const parsedMessage = this.parseMessage(messageData);
    if (parsedMessage) {
      this.messageSubject.next(parsedMessage);
    }
  }
}
