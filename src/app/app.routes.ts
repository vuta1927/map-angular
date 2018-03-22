import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';
import { AuthGuard, MapGuard } from './shared/guards/auth.guard';
import { ThemeComponent } from './shared/components/theme.component';

export const ROUTES: Routes = [
  {
    path: '',
    component: ThemeComponent,
    data: { pageTitle: 'Home' },
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: 'app/+dashboard/dashboard.module#DashboardModule',
        data: { pageTitle: 'Dashboard' }
      },
      {
        path: 'administrator',
        loadChildren: 'app/+administrator/administrator.module#AdministratorModule',
        data: { pageTitle: 'Administrator' }
      },
      {
        path: 'map',
        canActivate: [MapGuard],
        loadChildren: 'app/+map/map.module#MapModule',
        data: { pageTitle: 'Map' }
      },
      {
        path: '404',
        loadChildren: 'app/shared/components/pages/default/not-found/not-found.module#NotFoundModule'
      }
    ]
  },

  {
    path: 'account',
    loadChildren: 'app/+account/account.module#AccountModule'
  },

  // {
  //   path: 'map',
  //   component: ThemeComponent,
  //   data: { pageTitle: 'Map' },
  //   canActivate: [AuthGuard, MapGuard],
  //   children:[
  //     {
  //       path: '',
  //       loadChildren: 'app/+map/map.module#MapModule',
  //     }
  //   ]
  // },

  { 
    path: '**',
    redirectTo: '404',
    pathMatch: 'full'
  }
];
