import { NgModule, ModuleWithProviders } from '@angular/core';
import { WebViewService } from './services/webview.service';
import { WebViewBridgeFactory } from './services/webview.factory';
import { WebViewPlatformService } from './services/platform.service';

@NgModule({})
export class WebViewModule {
  static forRoot(): ModuleWithProviders<WebViewModule> {
    return {
      ngModule: WebViewModule,
      providers: [WebViewService, WebViewBridgeFactory, WebViewPlatformService],
    };
  }
}
