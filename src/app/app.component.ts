import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private androidPermissions: AndroidPermissions
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      StatusBar.setStyle({style: Style.Dark});

      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.NFC).then(
        result => console.log('Has permission?', result.hasPermission),
        () => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.NFC)
      );

      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);
    });
  }
}
