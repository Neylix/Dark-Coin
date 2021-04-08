import { Component, OnInit } from '@angular/core';
import { ScanPopupService } from '../services/scanPopup.service';
import { AppService } from '../services/app.service';
import { TransfertStatistics } from '../classes/transfertStatistics';
import { NfcService } from '../services/nfc.service';
import { Subscription } from 'rxjs';
import { NfcMode } from '../classes/nfcMode';

@Component({
  selector: 'app-reception-tabs',
  templateUrl: './reception-tabs.page.html',
  styleUrls: ['./reception-tabs.page.scss'],
})
export class ReceptionTabsPage implements OnInit {
  public addedValue: number;
  public inputValue: number;
  public tabValue: number[] = [5, 10, 15, 20, 25, 30];
  private successSubscription: Subscription;
  public nfcMode = NfcMode;

  constructor(
    private scanPopupService: ScanPopupService,
    private appService: AppService,
    private nfcService: NfcService
  ) {
  }

  ngOnInit() {
    this.addedValue = 0.00;
  }

  addValue(value: number) {
    this.addedValue += value;
  }

  resetValue(mode: number) {
    if (mode === 1) {
      this.addedValue = 0.00;
      this.inputValue = null;
    } else if (this.inputValue === null || this.inputValue < 0) {
      this.inputValue = null;
      this.addedValue = 0.00;
    } else {
      this.addedValue = +this.addedValue.toFixed(2);
      this.inputValue = this.addedValue;
    }
  }

  async showWaitingScan(mode: NfcMode) {
    this.addedValue = +this.addedValue.toFixed(2);

    if ((this.addedValue != null && this.addedValue > 0) || mode === NfcMode.refund) {
      const popup = await this.scanPopupService.showWaitingScan(mode, this.addedValue);

      this.successSubscription = this.nfcService.nfcSuccess.subscribe(data => {

        if (!(mode === NfcMode.refund && data.value === 0)) {
          let added = 0;
          let refund = 0;
          mode === NfcMode.refund ? refund = data.value : added = data.value;

          const transfertStatistics: TransfertStatistics = {
            eventId: this.appService.getSelectedEvent().uniqueId,
            addedValue: added,
            refundValue: refund,
            date: Date.now(),
            chipId: data.chipId,
            roleId: this.appService.getSelectedRole() ? this.appService.getSelectedRole().uniqueId : null
          };

          this.appService.addTransfertStatistics(transfertStatistics);
        }

        this.resetValue(1);
      });

      popup.onWillDismiss().then(() => {
        this.successSubscription.unsubscribe();
      });
    }
  }
}
