import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, from, throwError } from 'rxjs';
import { catchError, filter, map, takeUntil, timeout } from 'rxjs/operators';
import { Message } from '../interfaces/message.interface';
import { PlatformDetectorService } from './platform-detector.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  private messageSubject = new Subject<Message>();
  private destroySubject = new Subject<void>();
  private destroyed = false;
  private readonly MESSAGE_TIMEOUT = 3000;

  constructor(private platformDetector: PlatformDetectorService) {
    window.addEventListener('message', this.handleMessage);
  }

  sendMessage<T>(type: string, payload: T): Observable<void> {
    if (!this.platformDetector.isEmbeddedWebView()) {
      return throwError(() => new Error('Not in WebView environment'));
    }

    const message: Message<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source: 'webview'
    };

    return from(new Promise<void>((resolve, reject) => {
      try {
        window.postMessage(message, window.location.origin);
        resolve();
      } catch (error) {
        reject(error);
      }
    })).pipe(
      timeout(this.MESSAGE_TIMEOUT),
      catchError(error => {
        const errorMessage = error.name === 'TimeoutError'
          ? 'Message sending timed out'
          : error.message;
        return throwError(() => new Error(errorMessage));
      }),
      takeUntil(this.destroySubject)
    );
  }

  onMessage<T>(type?: string): Observable<Message<T>> {
    return this.messageSubject.asObservable().pipe(
      filter(message => !type || message.type === type),
      map(message => {
        if (!message.type || !Object.prototype.hasOwnProperty.call(message, 'payload')) {
          throw new Error('Invalid message format');
        }
        return message as Message<T>;
      }),
      catchError(error => throwError(() => error)),
      takeUntil(this.destroySubject)
    );
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroySubject.next();
    this.destroySubject.complete();
    this.messageSubject.complete();
    window.removeEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    if (this.destroyed) return;

    try {
      const message = event.data;
      if (message?.type && (!message.source || message.source !== 'webview')) {
        this.messageSubject.next(message);
      }
    } catch (error) {
      // Silent error handling
    }
  };
}
