import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  MessageService,
  PlatformDetectorService,
  LogMessage
} from '@angular-monorepo/message';
import { Subscription, EMPTY } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
    <div class="container">
      <!-- Platform Status -->
      <div class="status-bar" [class.webview]="isWebView">
        Running in: {{ isWebView ? 'WebView' : 'Browser' }}
      </div>

      <!-- Action Section -->
      <div class="action-section">
        <button *ngIf="isWebView" (click)="sendMessage()" class="message-button">
          Send Test Message
        </button>
        <div *ngIf="!isWebView" class="browser-message">
          ⚠️ This feature requires the mobile app WebView
        </div>
      </div>

      <!-- Message Display -->
      <div *ngIf="lastMessage" class="message-display">
        <div class="message-header">Last Message Received:</div>
        <pre>{{ lastMessage | json }}</pre>
      </div>

      <!-- Log Display -->
      <div class="log-container">
        <div class="log-header">
          <span>Debug Console</span>
          <div class="log-controls">
            <button class="control-button" (click)="toggleAutoScroll()">
              {{ autoScroll ? '🔒 Auto-scroll ON' : '🔓 Auto-scroll OFF' }}
            </button>
            <button class="clear-button" (click)="clearLogs()">
              🗑️ Clear Logs
            </button>
          </div>
        </div>
        <div class="log-content" #logContent>
          <div *ngFor="let log of logs"
               class="log-entry"
               [class.error]="log.level === 'error'"
               [class.warning]="log.level === 'warning'"
               [class.success]="log.level === 'info'">
            [{{ log.timestamp | date:'HH:mm:ss' }}] {{ log.icon }} {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .status-bar {
      padding: 8px 16px;
      background-color: #dc3545;
      color: white;
      border-radius: 4px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: bold;
    }

    .status-bar.webview {
      background-color: #28a745;
    }

    .action-section {
      margin-bottom: 20px;
    }

    .message-button {
      padding: 12px 24px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    }

    .message-button:hover {
      background-color: #0056b3;
    }

    .browser-message {
      padding: 16px;
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 4px;
      color: #856404;
    }

    .message-display {
      margin: 20px 0;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #dee2e6;
    }

    .message-header {
      font-weight: bold;
      margin-bottom: 8px;
      color: #495057;
    }

    .message-display pre {
      margin: 0;
      white-space: pre-wrap;
      word-wrap: break-word;
      background-color: #e9ecef;
      padding: 12px;
      border-radius: 4px;
      font-family: monospace;
    }

    .log-container {
      border: 1px solid #dee2e6;
      border-radius: 4px;
      overflow: hidden;
      background-color: #1e1e1e;
    }

    .log-header {
      padding: 12px 16px;
      background-color: #343a40;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
    }

    .log-controls {
      display: flex;
      gap: 8px;
    }

    .control-button, .clear-button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .control-button {
      background-color: #6c757d;
      color: white;
    }

    .clear-button {
      background-color: #dc3545;
      color: white;
    }

    .log-content {
      max-height: 400px;
      overflow-y: auto;
      padding: 16px;
    }

    .log-entry {
      font-family: 'Consolas', monospace;
      color: #00ff00;
      margin: 4px 0;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.4;
    }

    .log-entry.error {
      color: #ff4444;
    }

    .log-entry.warning {
      color: #ffd700;
    }

    .log-entry.success {
      color: #00ff00;
    }
  `],
  standalone: true,
})
export class AppComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  lastMessage: any = null;
  isWebView: boolean;
  logs: LogMessage[] = [];
  autoScroll = true;

  constructor(
    private messageService: MessageService,
    private platformDetector: PlatformDetectorService
  ) {
    this.isWebView = this.platformDetector.isEmbeddedWebView();
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    if (this.autoScroll) {
      setTimeout(() => {
        const logContent = document.querySelector('.log-content');
        if (logContent) {
          logContent.scrollTop = logContent.scrollHeight;
        }
      });
    }
  }

  clearLogs() {
    this.logs = [];
    // Add a clear log message
    this.logs.push({
      level: 'info',
      icon: '✨',
      message: 'Logs cleared',
      timestamp: new Date().toISOString()
    });
  }

  sendMessage(): void {
    if (!this.isWebView) return;

    this.subscription.add(
      this.messageService.sendMessage('TEST_MESSAGE', {
        text: 'Hello from Angular!',
        timestamp: Date.now()
      }).pipe(
        tap(() => console.info('✅ Message sent successfully')),
        catchError(error => {
          console.error('❌ Failed to send message:', error);
          return EMPTY;
        })
      ).subscribe()
    );
  }

  ngOnInit() {
    // Subscribe to message service logs
    this.subscription.add(
      this.messageService.getLogs().subscribe({
        next: (log) => {
          this.logs.push(log);
          // Keep only last 1000 logs
          if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
          }
          if (this.autoScroll) {
            this.scrollToBottom();
          }
        }
      })
    );

    // Subscribe to messages
    if (this.isWebView) {
      this.subscription.add(
        this.messageService.onMessage().subscribe({
          next: (message) => {
            this.lastMessage = message;
          }
        })
      );
    }

    // Log initialization
    console.info('🚀 Application initialized');
    console.info(`📱 Running in ${this.isWebView ? 'WebView' : 'Browser'} mode`);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    console.info('👋 Application shutting down');
  }
}
