import { MessageModule } from '@angular-monorepo/message';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, MessageModule.forRoot()],
  bootstrap: [AppComponent],
})
export class AppModule {}
