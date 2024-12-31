import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { WebViewModule } from '@angular-monorepo/webview';
import { AppComponent } from './app.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, WebViewModule.forRoot()],
  bootstrap: [AppComponent],
})
export class AppModule {}
