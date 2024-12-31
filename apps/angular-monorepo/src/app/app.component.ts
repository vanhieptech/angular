import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  MessageService,
  PlatformDetectorService,
} from '@angular-monorepo/message';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
    <div>
      <!-- Show button only in WebView -->
      <button *ngIf="isWebView" (click)="sendMessage()" class="message-button">
        Send Message
      </button>

      <!-- Show alternative message in browser -->
      <div *ngIf="!isWebView" class="browser-message">
        This feature is only available in the mobile app
      </div>

      <div *ngIf="lastMessage" class="message-display">
        Last received message: {{ lastMessage | json }}
      </div>
    </div>
  `,
  styles: [
    `
      .message-button {
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .browser-message {
        padding: 10px;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        color: #6c757d;
      }

      .message-display {
        margin-top: 20px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
      }
    `,
  ],
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

  ngOnInit() {
    // Only subscribe to messages if in WebView
    if (this.isWebView) {
      this.subscription.add(
        this.messageService.onMessage().subscribe({
          next: (message) => {
            console.log('Received message:', message);
            this.lastMessage = message;
          },
          error: (error) => {
            console.error('Message subscription error:', error);
          },
        })
      );
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async sendMessage() {
    if (!this.isWebView) return;

    try {
      await this.messageService.sendMessage('TEST_MESSAGE', {
        text: 'Hello!',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
}
