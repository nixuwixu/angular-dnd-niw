import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { JsonService } from './json-service';

import { AppComponent } from "./app.component";

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    DragDropModule,
    HttpClientModule
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  providers: [JsonService]
})
export class AppModule {}
