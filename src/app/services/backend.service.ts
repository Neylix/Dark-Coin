import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Event } from '../classes/event';
import { ItemStatistics } from '../classes/itemStatistics';
import { TransfertStatistics } from '../classes/transfertStatistics';
import '@capacitor-community/Http';
import { HttpHeaders } from '@capacitor-community/Http';
import { Plugins } from '@capacitor/core';

const { Http } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private headers: HttpHeaders;

  constructor() {}

  init() {}

  resetJWT() {
    Http.clearCookies({
      url: environment.apiEndpoint
    });
  }

  login(username: string, password: string): Promise<{ companyId: number, token: string}> {
    return new Promise<{ companyId: number, token: string}>((resolve, reject) => {

      this.headers = {
        'Content-Type': 'application/json'
      };

      const data = {
        username,
        password
      };

      const uri = environment.apiEndpoint + '/login';

      Http.request({
        method: 'POST',
        url : uri,
        headers : this.headers,
        data
      })
      .then(async res => {
        if (res.status === 200 && res.data.xsrfToken) {
          // On enregistre le token xsrf dans le header
          this.headers['x-xsrf-token'] = res.data.xsrfToken;

          resolve(res.data);
        } else {
          reject({ error: 'Utilisateur ou mot de passe incorrect !' });
        }
      })
      .catch(error => {
        console.log(error);
        reject({ error: 'Erreur de connexion au serveur' });
      });
    });
  }

  getCompanyEvents(companyId: number): Promise<Event[]> {
    return new Promise<Event[]>((resolve, reject) => {

      const uri = environment.apiEndpoint + '/company/events';

      Http.request({
        method: 'GET',
        url : uri,
        headers : this.headers
      })
      .then(res => res.status === 200 ? resolve(res.data) : reject(res.data))
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  getEventDatas(eventId: number): Promise<any> {
    return new Promise<any>((resolve, reject) => {

      const uri = environment.apiEndpoint + '/event/' + eventId + '/datas';

      Http.request({
        method: 'GET',
        url : uri,
        headers : this.headers
      })
      .then(res => res.status === 200 ? resolve(res.data) : reject(res.data))
      .catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  addItemStatistics(itemStatistics: ItemStatistics[]) {
    const data = {
      itemStats: itemStatistics
    };

    const uri = environment.apiEndpoint + '/itemStats';

    Http.request({
      method: 'POST',
      url : uri,
      headers : this.headers,
      data
    })
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.log(err);
    });
  }

  addTransfertStatistics(transfertStatistics: TransfertStatistics) {

    const uri = environment.apiEndpoint + '/transfertStats';

    Http.request({
      method: 'POST',
      url : uri,
      headers : this.headers,
      data: transfertStatistics
    })
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.log(err);
    });
  }
}
