import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebViewService } from '@angular-monorepo/webview';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
    <div>
      <button (click)="sendMessage()">Send Message to Native App</button>
      <div *ngIf="lastMessage">
        Last received message: {{ lastMessage | json }}
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription();
  lastMessage: any = null;

  constructor(private webViewService: WebViewService) {}

  ngOnInit() {
    // Listen for all messages
    this.subscription.add(
      this.webViewService.onMessage().subscribe(
        (message) => {
          console.log('Received message:', message);
          this.lastMessage = message;
        },
        (error) => console.error('WebView message error:', error)
      )
    );

    // Listen for specific message type
    this.subscription.add(
      this.webViewService
        .onMessage('SPECIFIC_TYPE')
        .subscribe((message) =>
          console.log('Received specific message:', message)
        )
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async sendMessage() {
    try {
      await this.webViewService.sendMessage('TEST_MESSAGE', {
        text: 'Hello from web!',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }
}
