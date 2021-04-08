import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ReceptionTabsPage } from './reception-tabs.page';

const routes: Routes = [
  {
    path: '',
    component: ReceptionTabsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ReceptionTabsPage],
  entryComponents: []
})
export class ReceptionTabsPageModule {}
