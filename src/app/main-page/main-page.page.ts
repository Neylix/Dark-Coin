import { Component, OnInit, ViewChild } from '@angular/core';
import { Platform, AlertController, IonTabs } from '@ionic/angular';
import { AppService } from '../services/app.service';
import { Subscription } from 'rxjs';
import { NfcService } from '../services/nfc.service';
import { ScanPopupService } from '../services/scanPopup.service';
import { Router } from '@angular/router';
import { NfcMode } from '../classes/nfcMode';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.page.html',
  styleUrls: ['./main-page.page.scss'],
})
export class MainPagePage implements OnInit {

  private backEvent: Subscription;
  private dataRead: Subscription;
  private dataReadError: Subscription;
  private plateformResume: Subscription;
  @ViewChild(IonTabs) tab: IonTabs;

  constructor(
    public router: Router,
    public appService: AppService,
    private platform: Platform,
    private nfcService: NfcService,
    private scanPopupService: ScanPopupService,
    private alertController: AlertController
  ) {
  }

  async ngOnInit() {

    // await this.checkNFC();

    this.dataRead = this.nfcService.dataRead.subscribe(async valueRemaining => {
      await this.scanPopupService.showWaitingScan(NfcMode.remaining, valueRemaining);
    });

    this.dataReadError = this.nfcService.dataReadError.subscribe(async erreur => {
      await this.scanPopupService.showErrorScan(NfcMode.remaining, erreur);
    });

    this.plateformResume = this.platform.resume.subscribe({
      next: async () => {
        await this.checkNFC();
      }
    });
  }

  async ionViewDidEnter() {
    this.backEvent = this.platform.backButton.subscribeWithPriority(999998, async () => {
      await this.navBack();
    });
    await this.checkNFC();
  }

  async ionViewWillEnter() {
    // l'onglet par défaut est l'onglet rechargement, si le rôle est paiement on choisi cet onglet
    // Si un rôle est choisi, les onglets sont désactivés dans le HTLM
    if (this.appService.getSelectedRole() && this.appService.getSelectedRole().fonction === 'paiement') {
      await this.tab.select('payment');
    }
  }

  async checkNFC() {
    await this.nfcService.init()
      .then()
      .catch(async () => {

        const alertNFC = await this.alertController.create({
          header: 'Vous devez activer le NFC',
          mode: 'ios',
          backdropDismiss: false,
          buttons: [

            {
              text: 'Fermer',
              role: 'cancel',
              handler: () => {
                this.navBack();
              }
            },
            {
              text: 'Paramètres',
              handler: async () => {
                await this.nfcService.showSettings();
              }
            }
          ]
        });

        alertNFC.present();

      });
  }

  async navBack() {
    if (this.appService.getSelectedRole()) {
      this.router.navigate(['/role-selection']);
    } else {
      this.router.navigate(['/event-selection']);
    }
  }

  ionViewWillLeave() {
    this.nfcService.ngOnDestroy();
    this.backEvent.unsubscribe();
    this.dataRead.unsubscribe();
    this.dataReadError.unsubscribe();
    this.scanPopupService.closePopup();
    this.plateformResume.unsubscribe();
  }
}
