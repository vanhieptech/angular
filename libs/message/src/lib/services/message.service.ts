import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, from, throwError } from 'rxjs';
import { catchError, filter, map, takeUntil, timeout } from 'rxjs/operators';
import { LogMessage, Message } from '../interfaces/message.interface';
import { PlatformDetectorService } from './platform-detector.service';

@Injectable({
  providedIn: 'root',
})
export class MessageService implements OnDestroy {
  private messageSubject = new Subject<Message>();
  private logSubject = new Subject<LogMessage>();
  private destroySubject = new Subject<void>();
  private destroyed = false;
  private readonly MESSAGE_TIMEOUT = 5000; // 5 seconds timeout

  constructor(private platformDetector: PlatformDetectorService) {
    // Listen for messages from native apps
    window.addEventListener('message', this.handleMessage);
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

  // Send message using RxJS
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
        this.log('info', '📤', [`Sending message: ${JSON.stringify(message)}`]);

        // Use the overridden postMessage function
        window.postMessage(message, window.location.origin);

        this.log('info', '✅', ['Message sent successfully']);
        resolve();
      } catch (error) {
        this.log('error', '❌', [`Failed to send message: ${error}`]);
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

  // Get messages with type filtering and error handling
  onMessage<T>(type?: string): Observable<Message<T>> {
    return this.messageSubject.asObservable().pipe(
      filter(message => !type || message.type === type),
      map(message => {
        // Validate message structure
        if (!message.type || !Object.prototype.hasOwnProperty.call(message, 'payload')) {
          throw new Error('Invalid message format');
        }
        return message as Message<T>;
      }),
      catchError(error => {
        this.log('error', '❌', [`Message processing error: ${error}`]);
        return throwError(() => error);
      }),
      takeUntil(this.destroySubject)
    );
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroySubject.next();
    this.destroySubject.complete();
    this.messageSubject.complete();
    this.logSubject.complete();
    window.removeEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    if (this.destroyed) return;

    try {
      const message = event.data;
      // Only process messages that have a type and aren't echoes
      if (message?.type && (!message.source || message.source !== 'webview')) {
        this.log('info', '📥', [`Received message: ${JSON.stringify(message)}`]);
        this.messageSubject.next(message);
      }
    } catch (error) {
      this.log('error', '❌', [`Failed to handle message: ${error}`]);
    }
  };
}
