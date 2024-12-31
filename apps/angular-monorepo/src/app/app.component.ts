import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from '@angular-monorepo/message';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  template: `
    <div>
      <button (click)="sendMessage()">Send Message</button>
      <div *ngIf="lastMessage">
        Last received message: {{ lastMessage | json }}
      </div>
    </div>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private subscription = new Subscription();
  lastMessage: any = null;

  constructor(private messageService: MessageService) {}

  ngOnInit() {
    this.subscription.add(
      this.messageService.onMessage().subscribe((message) => {
        console.log('Received message:', message);
        this.lastMessage = message;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async sendMessage() {
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
