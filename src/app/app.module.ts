import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppService } from './services/app.service';
import { BackendService } from './services/backend.service';
import { NFC, Ndef } from '@ionic-native/nfc/ngx';
import { AES256 } from '@ionic-native/aes-256/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { WaitingScanComponent } from './waiting-scan/waiting-scan.component';
import { ScanPopupService } from './services/scanPopup.service';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';

@NgModule({
  declarations: [
    AppComponent,
    WaitingScanComponent
  ],
  entryComponents: [WaitingScanComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    AppService,
    BackendService,
    ScanPopupService,
    AndroidPermissions,
    WaitingScanComponent,
    NFC,
    Ndef,
    AES256,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {}
