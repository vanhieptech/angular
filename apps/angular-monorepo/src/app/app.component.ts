import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService, PlatformDetectorService } from '@angular-monorepo/message';
import { Subscription, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="status-bar" [class.webview]="isWebView">
        Running in: {{ isWebView ? 'WebView' : 'Browser' }}
      </div>

      <div class="action-section">
        <button *ngIf="isWebView" (click)="sendMessage()" class="message-button">
          Send Test Message
        </button>
        <div *ngIf="!isWebView" class="browser-message">
          ⚠️ This feature requires the mobile app WebView
        </div>
      </div>

      <div *ngIf="lastMessage" class="message-display">
        <div class="message-header">Last Message Received:</div>
        <pre>{{ lastMessage | json }}</pre>
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

  constructor(
    private messageService: MessageService,
    private platformDetector: PlatformDetectorService
  ) {
    this.isWebView = this.platformDetector.isEmbeddedWebView();
  }

  sendMessage(): void {
    if (!this.isWebView) return;

    this.subscription.add(
      this.messageService.sendMessage('TEST_MESSAGE', {
        text: 'Hello from Angular!',
        timestamp: Date.now()
      }).pipe(
        catchError(() => EMPTY)
      ).subscribe()
    );
  }

  ngOnInit() {
    if (this.isWebView) {
      this.subscription.add(
        this.messageService.onMessage().subscribe({
          next: (message) => {
            this.lastMessage = message;
          }
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
