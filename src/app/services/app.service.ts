import { Injectable } from '@angular/core';
import { Event } from '../classes/event';
import { Role } from '../classes/role';
import { ItemStatistics } from '../classes/itemStatistics';
import { TransfertStatistics } from '../classes/transfertStatistics';
import { BackendService } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private events: Event[] = [];
  private selectedEvent: Event;
  private selectedRole: Role;

  constructor(
    private backend: BackendService
  ) { }

  getEvents(): Event[] {
    return this.events;
  }

  async setSelectedEvent(event: Event) {
    this.selectedEvent = event;

    await this.backend.getEventDatas(event.uniqueId).then(datas => {
      this.selectedEvent.items = datas.items;
      this.selectedEvent.roles = datas.roles;
    });
  }

  async setSelectedRole(role: Role) {
    this.selectedRole = role;
  }

  getSelectedEvent(): Event {
    if (!this.selectedEvent) {
      this.selectedEvent = {
        "beginingDate": null,
        "endingDate": null,
        "uniqueId": 1,
        "companyId": 1,
        "name": "Test",
        "items": [
          {
              "uniqueId": 3,
              "eventId": 1,
              "name": "Sandwich",
              "price": 4
          },
          {
              "uniqueId": 7,
              "eventId": 1,
              "name": "Onion Rings",
              "price": 3.5
          },
          {
              "uniqueId": 8,
              "eventId": 1,
              "name": "Un bon gros Kebab",
              "price": 5
          },
          {
              "uniqueId": 10,
              "eventId": 1,
              "name": "Maintenant on sait ce que c'est ce produit",
              "price": 6569
          },
          {
              "uniqueId": 144,
              "eventId": 1,
              "name": "Un article très chère mais moins que le précédent",
              "price": 200
          },
          {
              "uniqueId": 174,
              "eventId": 1,
              "name": "lol",
              "price": 4
          }
      ],
      "roles": [
          {
              "uniqueId": 2,
              "event": null,
              "name": "Accueil",
              "fonction": "rechargement",
              "items": []
          },
          {
              "uniqueId": 1,
              "event": null,
              "name": "Bar",
              "fonction": "paiement",
              "items": []
          },
          {
              "uniqueId": 3,
              "event": null,
              "name": "Merch",
              "fonction": "paiement",
              "items": []
          }
      ]
    }
    }
    return this.selectedEvent;
  }

  getSelectedRole(): Role {
    return this.selectedRole;
  }

  resetJWT() {
    this.backend.resetJWT();
  }

  addItemStatistics(itemStatistics: ItemStatistics[]) {
    this.backend.addItemStatistics(itemStatistics);
  }

  addTransfertStatistics(transfertStatistics: TransfertStatistics) {
    this.backend.addTransfertStatistics(transfertStatistics);
  }

  async login(username: string, password: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // On récupère l'utilisateur
      this.backend.login(username, password).then(async data => {
        // On charge la liste des événements
        await this.backend.getCompanyEvents(data.companyId).then(async events => {
          this.events = events;
        });
        resolve(true);
      }).catch(error => {
        reject({type: 'user', text: error.error});
      });
    });
  }
}
