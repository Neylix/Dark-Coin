import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {MainPagePage} from './main-page.page';

const routes: Routes = [
  {
    path: '',
    component: MainPagePage,
    children: [
      {
        path: 'reception',
        loadChildren: () => import('../reception-tabs/reception-tabs.module').then(m => m.ReceptionTabsPageModule)
      },
      {
        path: 'payment',
        children: [
          {
            path: '',
            loadChildren: () => import('../payment-tabs/payment-tabs.module').then(m => m.PaymentTabsPageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: 'reception',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class TabsRoutingModule {
}
