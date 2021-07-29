import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NfcService } from '../services/nfc.service';
import { AppService } from '../services/app.service';
import { Subscription } from 'rxjs';
import { ModalController, Platform } from '@ionic/angular';
import { NfcMode } from '../classes/nfcMode';
import { Haptics } from '@capacitor/haptics';

@Component({
  selector: 'app-waiting-scan',
  templateUrl: './waiting-scan.component.html',
  styleUrls: ['./waiting-scan.component.scss']
})
export class WaitingScanComponent implements OnInit {
  public modalController: ModalController;
  public mode: NfcMode;
  public value: number;
  public remainingError: string;
  private backEvent: Subscription;

  public iconName: string = null;
  public iconColor: string = null;
  public buttonText = 'Annuler';
  public buttonColor = 'danger';
  public buttonDisabled = false;
  public contentText = 'Veuillez scanner une puce';
  public headerText: string;
  public spinner = true;
  public retry = false;

  private erreurSubscription: Subscription;
  private successSubscription: Subscription;

  constructor(
    private nfcService: NfcService,
    private appService: AppService,
    private cdr: ChangeDetectorRef,
    private platform: Platform
  ) {
  }

  ngOnInit() {

    switch (this.mode) {
      case NfcMode.adding: {
        this.headerText = 'Ajout de ' + this.value + ' €';
        break;
      }
      case NfcMode.refund: {
        this.headerText = 'Remboursement';
        break;
      }
      case NfcMode.payment: {
        this.headerText = 'Paiement de ' + this.value + ' €';
        break;
      }
      case NfcMode.remaining: {
        this.initRemaining();
        break;
      }
    }

    if (this.mode !== NfcMode.remaining) {
      this.nfcService.setMode(this.mode, this.appService.getSelectedEvent().uniqueId, this.value);

      this.erreurSubscription = this.nfcService.nfcError.subscribe(err => {
        this.spinner = false;
        this.iconColor = 'danger';
        this.iconName = 'close-circle-outline';
        this.contentText = err.error;
        let i = 0;
        const int = setInterval(() => {
          // this.vibration.vibrate(150);
          Haptics.vibrate();
          if (i === 2) {
            clearInterval(int);
          } else {
            i++;
          }
        }, 200);
        if (this.mode === NfcMode.payment && err.value !== null) {
          this.contentText += ' ' + err.value + '€';
        } else if (err.retry) {
          this.retry = true;
        }
        // refresh DOM
        this.cdr.detectChanges();
      });

      this.successSubscription = this.nfcService.nfcSuccess.subscribe(data => {
        this.scanValidated(data.value);
      });
    }
  }

  initRemaining() {
    this.headerText = 'Solde restant';
    this.buttonText = 'OK';
    this.spinner = false;

    if (this.remainingError) {
      this.iconColor = 'danger';
      this.iconName = 'close-circle-outline';
      this.buttonColor = 'danger';
      this.contentText = this.remainingError;
      let i = 0;
      const int = setInterval(() => {
        // this.vibration.vibrate(150);
        Haptics.vibrate();
        if (i === 2) {
          clearInterval(int);
        } else {
          i++;
        }
      }, 200);
      // refresh DOM
      this.cdr.detectChanges();
    } else {
      this.buttonColor = 'success';
      this.contentText = this.value + ' €';
      // this.vibration.vibrate(150);
      Haptics.vibrate();
      // refresh DOM
      this.cdr.detectChanges();
    }
  }

  closePopup() {
    this.modalController.dismiss();
  }

  ionViewDidEnter() {
    this.backEvent = this.platform.backButton.subscribeWithPriority(999999, async () => {
      // nothing
    });
  }

  ionViewWillLeave() {
    if (this.successSubscription) {
      this.successSubscription.unsubscribe();
    }
    if (this.erreurSubscription) {
      this.erreurSubscription.unsubscribe();
    }
    this.backEvent.unsubscribe();
    this.nfcService.setReading();
  }

  scanValidated(value: number) {
    this.buttonColor = 'success';
    this.iconName = 'checkmark-circle-outline';
    this.iconColor = 'success';
    this.buttonText = 'OK';
    this.spinner = false;
    this.retry = false;
    // this.vibration.vibrate(150);
    Haptics.vibrate();

    switch (this.mode) {
      case NfcMode.adding: {
        this.contentText = 'Nouveau solde : ' + value + '€';
        break;
      }
      case NfcMode.refund: {
        this.contentText = 'Solde à rembourser : ' + value + '€';
        // On désactive le bouton OK pour ne pas cliquer dessus trop tôt
        this.buttonDisabled = true;
        setTimeout(() => {
          this.buttonDisabled = false;
          // refresh DOM
          this.cdr.detectChanges();
        }, 3000);
        break;
      }
      case NfcMode.payment: {
        this.contentText = 'Solde restant : ' + value + '€';
      }
    }

    // refresh DOM
    this.cdr.detectChanges();
  }
}
