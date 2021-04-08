import { EventEmitter, Injectable, OnDestroy, Output } from '@angular/core';
import { Ndef, NdefEvent, NFC } from '@ionic-native/nfc/ngx';
import { AES256 } from '@ionic-native/aes-256/ngx';
import { Subscription } from 'rxjs';
import { AppService } from './app.service';
import { environment } from '../../environments/environment';
import { NfcMode } from '../classes/nfcMode';

/**
 * Interface pour les données qui doivent être sur la puce
 */
interface Data {
  eventId?: number;
  amount?: number;
  chipId?: string;
}

interface ReturnData {
  error: string;
  value: number;
  retry: boolean;
  chipId: string;
}

@Injectable({
  providedIn: 'root'
})
export class NfcService implements OnDestroy {

  @Output()
  dataRead: EventEmitter<number> = new EventEmitter();

  @Output()
  dataReadError: EventEmitter<string> = new EventEmitter();

  @Output()
  nfcSuccess: EventEmitter<ReturnData> = new EventEmitter();

  @Output()
  nfcError: EventEmitter<ReturnData> = new EventEmitter();

  private ndefListener: Subscription;
  private tagDiscoveredListener: Subscription;

  private traitmentData: Data = {};
  private recoverData: Data = null;

  private mode: NfcMode;

  private recoverError = false;

  constructor(
    private nfc: NFC,
    private ndef: Ndef,
    private aes256: AES256,
    private appService: AppService
  ) {
  }

  async init(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.nfc.enabled().then(() => {
        if (!this.tagDiscoveredListener || this.tagDiscoveredListener.closed) {
          // Premier scan d'une puce vide
          this.tagDiscoveredListener = this.nfc.addTagDiscoveredListener(() => {
            console.log('TagDiscover');
          }, () => {
            console.log('Erreur tagDiscover');
          }).subscribe({
            next: this.setTagDiscoverListener.bind(this)
          });
        }

        if (!this.ndefListener || this.ndefListener.closed) {
          this.ndefListener = this.nfc.addNdefListener(() => {
            // Au premier passage
            this.mode = NfcMode.remaining;
          }, (err) => {
            // Message d'erreur
            console.log('Erreur écoute du tag : ' + err.toString());
          }).subscribe({
            next: this.setNdefListener.bind(this)
          });
        }

        resolve(true);
      }).catch(() => reject(false));
    });
  }

  async setNdefListener(event: NdefEvent) {
    if (this.recoverError) {
      await this.recover(event);
    } else {
      let actualValue: Data = null;
      if (this.mode !== NfcMode.remaining) {
        await this.readData(event).then(data => {
          actualValue = data;
          this.recoverData = actualValue;
        }).catch(() => {
          actualValue = null;
          this.recoverData = null;
        });
      }

      switch (this.mode) {
        case NfcMode.remaining:
          await this.read(event);
          break;
        case NfcMode.adding:
          await this.add(event, actualValue);
          break;
        case NfcMode.payment:
          await this.pay(event, actualValue);
          break;
        case NfcMode.refund:
          await this.clear(event, actualValue);
          break;
      }
    }

    if (!this.recoverError) {
      this.setReading();
    }
  }

  async setTagDiscoverListener(event: any) {
    if (this.recoverError) {
      await this.recover(event);
    } else {
      this.recoverData = null;
      await this.nfc.erase().then(async () => {
        // On écrase les valeurs de la puce avec l'id de la soirée et une somme de 0
        switch (this.mode) {
          case NfcMode.remaining:
            this.dataReadError.emit('La puce n\'est pas initialisée');
            break;
          case NfcMode.adding:
            await this.add(event, null);
            break;
          case NfcMode.payment:
            await this.pay(event, null);
            break;
          case NfcMode.refund:
            await this.clear(event, null);
            break;
        }
      }).catch(async () => {
        this.recoverData = null;
        this.recoverError = true;

        if (this.mode === NfcMode.remaining) {
          this.dataReadError.emit('Erreur lors de la lecture');
        } else {
          const ret: ReturnData = {
            error: 'Erreur lors de l\'écriture',
            value: null,
            retry: true,
            chipId: null
          };
          this.nfcError.emit(ret);
        }
      });
    }

    if (!this.recoverError) {
      this.setReading();
    }
  }

  async showSettings() {
    await this.nfc.showSettings();
  }

  /**
   * Enlève le listener à la fin pour pas qu'il ne persiste une fois le service plus utilisé
   */
  ngOnDestroy(): void {
    if (this.ndefListener) {
      this.ndefListener.unsubscribe();
    }

    if (this.tagDiscoveredListener) {
      this.tagDiscoveredListener.unsubscribe();
    }
  }

  async read(event: NdefEvent) {
    // On retourne juste les valeurs sur la puce
    await this.readData(event).then(data => {
      // On vérifie que la puce est bien sur le même event que celui actuel
      if (data.eventId === this.appService.getSelectedEvent().uniqueId) {
        this.dataRead.emit(data.amount);
      } else {
        this.dataReadError.emit('La puce n\'est pas pour le même événement');
      }
    }).catch(err => {
      this.dataReadError.emit(err);
    });
  }

  async add(event: NdefEvent, actualValue: Data) {
    // On ajoute une valeur sur la puce
    const writingData: Data = this.traitmentData;

    if (actualValue && actualValue.eventId === this.traitmentData.eventId) {
        // on ajoute les valeurs
        writingData.amount += actualValue.amount;
        writingData.amount = +writingData.amount.toFixed(2);
    }

    // On écrit sur la puce
    await this.writeData(event, writingData).then(data => {
      const ret: ReturnData = {
        error: null,
        value: data.amount,
        retry: false,
        chipId: data.chipId
      };
      this.nfcSuccess.emit(ret);
    }).catch(er => {
      this.recoverError = true;

      const ret: ReturnData = {
        error: er,
        value: null,
        retry: true,
        chipId: null
      };
      this.nfcError.emit(ret);
    });
  }

  async pay(event: NdefEvent, actualValue: Data) {
    // On retire une valeurs sur la puce
    let error: string = null;
    let value: number = null;
    if (actualValue) {
      // On a une valeur sur la puce, on vérifie que c'est bien le même event
      if (actualValue.eventId === this.traitmentData.eventId) {
        // on vérifie qu'il y a une quantité supérieur à celle demandée
        if (this.traitmentData.amount > actualValue.amount) {
          // Si la somme demandée est supérieur à la somme de la puce, on envoie un message d'erreur
          error = 'Solde insufisant :';
          value = actualValue.amount;
        } else {
          // Sinon on soustrait la valeur sur la puce
          const writingData: Data = this.traitmentData;
          writingData.amount = actualValue.amount - this.traitmentData.amount;
          writingData.amount = +writingData.amount.toFixed(2);
          // On écrit la nouvelle valeur sur la puce
          await this.writeData(event, writingData).then(data => {
            const ret: ReturnData = {
              error: null,
              value: data.amount,
              retry: false,
              chipId: data.chipId
            };
            this.nfcSuccess.emit(ret);
          }).catch(err => {
            this.recoverError = true;
            const ret: ReturnData = {
              error: err,
              value: null,
              retry: true,
              chipId: null
            };
            this.nfcError.emit(ret);
          });
        }
      } else {
        // Si les events sont différents, on envoie un message d'erreur
        error = 'La puce n\'est pas pour le même événement';
      }
    } else {
      // Si la puce ne contient rien on envoie un message d'erreur
      error = 'La puce n\'est pas initialisé';
    }

    if (error) {
      const ret: ReturnData = {
        error,
        value,
        retry: false,
        chipId: null
      };
      this.nfcError.emit(ret);
    }
  }

  async clear(event: NdefEvent, actualValue: Data) {
    if (actualValue) {
      if (actualValue.eventId === this.traitmentData.eventId) {
        // On écrase les valeurs de la puce avec l'id de la soirée et une somme de 0
        await this.writeData(event, this.traitmentData).then(data => {
          const ret: ReturnData = {
            error: null,
            value: actualValue.amount,
            retry: false,
            chipId: data.chipId
          };
          this.nfcSuccess.emit(ret);
        }).catch(err => {
          this.recoverError = true;
          const ret: ReturnData = {
            error: err,
            value: null,
            retry: true,
            chipId: null
          };
          this.nfcError.emit(ret);
        });
      } else {
        // Si les events sont différents, on envoie un message d'erreur
        const ret: ReturnData = {
          error: 'La puce n\'est pas pour le même événement',
          value: null,
          retry: false,
          chipId: null
        };
        this.nfcError.emit(ret);
      }
    }
  }

  async recover(event: NdefEvent) {
    this.recoverError = false;
    await this.nfc.erase().then(async () => {
      switch (this.mode) {
        case NfcMode.adding:
          await this.add(event, this.recoverData);
          break;
        case NfcMode.payment:
          await this.pay(event, this.recoverData);
          break;
        case NfcMode.refund:
          await this.clear(event, this.recoverData);
          break;
      }
    }).catch(async () => {
      const ret: ReturnData = {
        error: 'Erreur lors de l\'écriture',
        value: null,
        retry: true,
        chipId: null
      };
      this.nfcError.emit(ret);
    });
  }

  /**
   * Return the data of a NFC tag
   * Object
   */
  readData(event: NdefEvent): Promise<Data> {
    return new Promise<Data>(async (resolve, reject) => {
      // Lecture
      // Récupération de l'id de la puce
      const chipId = this.nfc.bytesToHexString(event.tag.id);
      if (event.tag.ndefMessage) {
        const dataPayload = event.tag.ndefMessage[0].payload;
        const dataString = this.nfc.bytesToString(dataPayload).substr(3).toString();

        await this.aes256.decrypt(environment.secureKey, environment.secureIV, dataString).then(res => {
          try {
            const tempData = JSON.parse(atob(res));
            if (tempData.chipId != null && tempData.chipId === chipId) {
              // L'id de la puce correspond, on peut lire la suite
              if (tempData.eventId != null && tempData.amount != null) {
                // Les deux valeurs ne sont pas null
                const data: Data = {
                  chipId,
                  eventId: +tempData.eventId,
                  amount: +tempData.amount
                };
                resolve(data);
              } else {
                reject('Il manque des informations sur la puce');
              }
            } else {
              reject('Le code de la puce ne correspond pas');
            }
          } catch (err) {
            reject('Le format des données n\'est pas valide JSON');
          }
        }).catch(() => {
          reject('Le format des données n\'est pas valide AES');
        });
      } else {
        reject('La puce est endommagée');
      }
    });
  }

  /**
   * Write data into a NFC tag. <br/>
   * L'id de la puce est mis automatiquement lors de l'écriture
   */
  async writeData(event: NdefEvent, data: Data): Promise<Data> {
    return new Promise<Data>(async (resolve, reject) => {
      // Ecriture
      data.chipId = this.nfc.bytesToHexString(event.tag.id);
      let payload = JSON.stringify(data);
      payload = btoa(payload);
      await this.aes256.encrypt(environment.secureKey, environment.secureIV, payload).then((payloadAES) => {
        const payloadFinal = this.ndef.textRecord(payloadAES);
        this.nfc.write([payloadFinal]).then(() => {
          resolve(data);
          // Message pour dire que c'est écrit
        }).catch(() => {
          // Message pour dire qu'il y a une erreur à l'écriture
          reject('Erreur lors de l\'écriture');
        });
      }).catch(() => {
        reject('Le format des données n\'est pas valide AES');
      });
    });
  }

  setReading() {
    this.recoverError = false;
    this.recoverData = null;
    this.mode = NfcMode.remaining;
  }

  setMode(mode: NfcMode, eventId: number, amount: number) {
    this.traitmentData.amount = amount;
    this.traitmentData.eventId = eventId;
    this.mode = mode;
  }
}
