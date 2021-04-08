import { Component } from '@angular/core';
import { AppService } from '../services/app.service';
import { Platform } from '@ionic/angular';
import { Role } from '../classes/role';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  templateUrl: './role-selection.page.html',
  styleUrls: ['./role-selection.page.scss'],
})
export class RoleSelectionPage {

  private backEvent: Subscription;

  constructor(
    public appService: AppService,
    private router: Router,
    private platform: Platform
  ) {
  }

  ionViewDidEnter() {
    this.backEvent = this.platform.backButton.subscribeWithPriority(999997, async () => {
      await this.navBack();
    });
  }

  async selectRole(role: Role) {
    await this.appService.setSelectedRole(role);
    // await this.navCtrl.navigateForward('main-page');
    this.router.navigate(['/main-page']);
  }

  async navBack() {
    // await this.navCtrl.navigateBack('event-selection', {skipLocationChange: true, replaceUrl: true});
    this.router.navigate(['/event-selection']);
  }

  ionViewDidLeave() {
    this.backEvent.unsubscribe();
  }
}
