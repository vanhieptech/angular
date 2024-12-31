import { NgModule, ModuleWithProviders } from '@angular/core';
import { MessageService } from './services/message.service';
import { MessageBridgeFactory } from './services/message-bridge.factory';
import { PlatformDetectorService } from './services/platform-detector.service';
import { IOSMessageBridge } from './bridges/ios-message.bridge';
import { AndroidMessageBridge } from './bridges/android-message.bridge';
import { BrowserMessageBridge } from './bridges/browser-message.bridge';

@NgModule({})
export class MessageModule {
  static forRoot(): ModuleWithProviders<MessageModule> {
    return {
      ngModule: MessageModule,
      providers: [
        MessageService,
        MessageBridgeFactory,
        PlatformDetectorService,
        IOSMessageBridge,
        AndroidMessageBridge,
        BrowserMessageBridge,
      ],
    };
  }
}
