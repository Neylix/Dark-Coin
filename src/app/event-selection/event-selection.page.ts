import { Component } from '@angular/core';
import { Event } from '../classes/event';
import { AppService } from '../services/app.service';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-event-selection',
  templateUrl: './event-selection.page.html',
  styleUrls: ['./event-selection.page.scss'],
})
export class EventSelectionPage {

  private backEvent: Subscription;
  private alert: HTMLIonAlertElement;

  constructor(
    public appService: AppService,
    private router: Router,
    private loadingController: LoadingController,
    private platform: Platform,
    private alertController: AlertController
  ) {}

  ionViewDidEnter() {
    this.backEvent = this.platform.backButton.subscribeWithPriority(999996, () => {
      this.navBack();
    });
  }

  ionViewDidLeave() {
    this.backEvent.unsubscribe();
  }

  async selectEvent(event: Event) {
    const loading = await this.loadingController.create({
      message: 'Chargement des données',
      spinner: 'dots'
    });
    await loading.present();

    await this.appService.setSelectedEvent(event);
    await this.appService.setSelectedRole(null);
    // S'il n'y a pas de rôles, on passe directement à la main-page
    if (this.appService.getSelectedEvent().roles.length === 0) {
      // await this.navCtrl.navigateForward('main-page');
      this.router.navigate(['/main-page']);
    } else {
      // await this.navCtrl.navigateForward('role-selection');
      this.router.navigate(['/role-selection']);
    }

    await loading.dismiss();
  }

  async navBack() {
    if (!this.alert) {
      this.alert = await this.alertController.create({
        header: 'Se déconnecter ?',
        mode: 'ios',
        buttons: [
          {
            text: 'Oui',
            handler: () => {
              // this.navCtrl.navigateBack('/login', {skipLocationChange: true, replaceUrl: true});
              this.appService.resetJWT();
              this.router.navigate(['/login']);
            }
          },
          {
            text: 'Non',
            role: 'cancel',
            handler: () => {
              this.alert = null;
            }
          }
        ]
      });

      this.alert.present();
    }
  }
}
