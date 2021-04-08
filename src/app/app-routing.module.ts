import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'event-selection',
    loadChildren: () => import('./event-selection/event-selection.module').then(m => m.EventSelectionPageModule)
  },
  {
    path: 'main-page',
    loadChildren: () => import('./main-page/main-page.module').then(m => m.MainPagePageModule)
  },
  {
    path: 'role-selection',
    loadChildren: () => import('./role-selection/role-selection.module').then(m => m.RoleSelectionPageModule)
  },
  {path: '', redirectTo: 'login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
