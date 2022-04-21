import { Component, OnInit } from '@angular/core';
import { ScanPopupService } from '../services/scanPopup.service';
import { AppService } from '../services/app.service';
import { Item } from '../classes/item';
import { ItemStatistics } from '../classes/itemStatistics';
import { NfcService } from '../services/nfc.service';
import { Subscription } from 'rxjs';
import { NfcMode } from '../classes/nfcMode';
import { AlertController, AlertInput } from '@ionic/angular';

interface ItemData {
  item: Item;
  quantity: number;
  updated: boolean;
  updatedPrice: number;
}
@Component({
  selector: 'app-payment-tabs',
  templateUrl: './payment-tabs.page.html',
  styleUrls: ['./payment-tabs.page.scss'],
})
export class PaymentTabsPage implements OnInit {

  public paymentValue: number;
  public items: ItemData[] = [];
  private successSubscription: Subscription;
  public nfcMode = NfcMode;
  private alert: HTMLIonAlertElement;

  constructor(
    private scanPopupService: ScanPopupService,
    public appService: AppService,
    private nfcService: NfcService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.paymentValue = 0.00;
    if (this.appService.getSelectedRole() && this.appService.getSelectedRole().items.length !== 0) {
      for (const item of this.appService.getSelectedRole().items) {
        this.items.push({
          item,
          quantity: 0,
          updated: false,
          updatedPrice: 0
        });
      }
    } else {
      for (const item of this.appService.getSelectedEvent().items) {
        this.items.push({
          item,
          quantity: 0,
          updated: false,
          updatedPrice: 0
        });
      }
    }
  }

  addItem(addedItem: ItemData) {
    addedItem.quantity++;
    this.paymentValue += 
      addedItem.updated ? addedItem.updatedPrice : addedItem.item.price;
    
    this.paymentValue = +this.paymentValue.toFixed(2)
  }

  removeItem(removedItem: ItemData) {
    if (removedItem.quantity > 0) {
      removedItem.quantity--;
      this.paymentValue -= 
        removedItem.updated ? removedItem.updatedPrice : removedItem.item.price;;

      this.paymentValue = +this.paymentValue.toFixed(2)
    }
  }

  resetValue() {
    for (const item of this.items) {
      item.quantity = 0;
      item.updated = false;
      item.updatedPrice = 0;
    }
    this.paymentValue = 0.00;
  }

  async showWaitingScan(mode: NfcMode) {
    if (this.paymentValue !== 0) {
      const popup = await this.scanPopupService.showWaitingScan(mode, this.paymentValue);

      this.successSubscription = this.nfcService.nfcSuccess.subscribe(data => {
        let roleId = null;
        if (this.appService.getSelectedRole()) {
          roleId = this.appService.getSelectedRole().uniqueId;
        }
        const date = Date.now();
        const itemStatistics: ItemStatistics[] = [];
        for (const itemData of this.items) {
          if (itemData.quantity !== 0) {

            const itemStat: ItemStatistics = {
              itemId: itemData.item.uniqueId,
              quantity: itemData.quantity,
              updated: itemData.updated,
              updatedPrice: itemData.updatedPrice,
              date,
              roleId,
              chipId: data.chipId
            };

            itemStatistics.push(itemStat);
          }
        }
        this.appService.addItemStatistics(itemStatistics);
        this.resetValue();
      });

      popup.onWillDismiss().then(() => {
        this.successSubscription.unsubscribe();
      });
    }
  }

  async updateItemPrice(item: ItemData) {
    if (!this.alert) {
      this.alert = await this.alertController.create({
        header: 'Modifiez l\'article',
        subHeader: item.item.name,
        backdropDismiss: false,
        inputs: [
          {
            name: 'newPrice',
            value: item.item.price,
            placeholder: 'Prix',
            attributes: {
              type: 'number'
            }
          }
        ],
        buttons: [
          {
            text: 'Valider',
            handler: ({newPrice}) => {
              if (item.item.price !== newPrice) {
                if (item.quantity !== 0) {
                  this.paymentValue -= item.quantity * (
                    item.updated ? item.updatedPrice : item.item.price
                  )
                  this.paymentValue = +this.paymentValue.toFixed(2)
                  item.quantity = 0
                }
                item.updated = true
                item.updatedPrice = +newPrice
              }
              this.alert = null
            }
          },
          {
            text: 'Annuler',
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
