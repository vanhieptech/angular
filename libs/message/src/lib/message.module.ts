import { ModuleWithProviders, NgModule } from '@angular/core';
import { MessageService } from './services/message.service';
import { PlatformDetectorService } from './services/platform-detector.service';

@NgModule({})
export class MessageModule {
  static forRoot(): ModuleWithProviders<MessageModule> {
    return {
      ngModule: MessageModule,
      providers: [
        MessageService,
        PlatformDetectorService,
      ],
    };
  }
}
