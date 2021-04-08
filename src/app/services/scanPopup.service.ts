import { Injectable } from '@angular/core';
import { WaitingScanComponent } from '../waiting-scan/waiting-scan.component';
import { ModalController } from '@ionic/angular';
import { NfcMode } from '../classes/nfcMode';

@Injectable({
  providedIn: 'root'
})
export class ScanPopupService {

  private modalDeployed = false;
  private modal = null;

  constructor(
    private modalController: ModalController
  ) {
  }

  async showWaitingScan(mode: NfcMode, value: number): Promise<HTMLIonModalElement> {
    if (!this.modalDeployed) {
      this.modalDeployed = true;

      this.modal = await this.modalController.create({
        component: WaitingScanComponent,
        componentProps: {
          mode,
          value,
          modalController: this.modalController
        },
        backdropDismiss: false
      });

      this.modal.onWillDismiss().then(() => {
        this.modalDeployed = false;
        this.modal = null;
      });

      await this.modal.present();

      return this.modal;
    }
  }

  async showErrorScan(mode: NfcMode, error: string): Promise<HTMLIonModalElement> {
    if (!this.modalDeployed) {
      this.modalDeployed = true;

      this.modal = await this.modalController.create({
        component: WaitingScanComponent,
        componentProps: {
          mode,
          remainingError: error,
          modalController: this.modalController
        },
        backdropDismiss: false
      });

      this.modal.onWillDismiss().then(() => {
        this.modalDeployed = false;
        this.modal = null;
      });

      await this.modal.present();

      return this.modal;
    }
  }

  closePopup() {
    if (this.modal) {
      this.modal.dismiss();
    }
  }
}
