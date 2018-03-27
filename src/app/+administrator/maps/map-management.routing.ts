
import { RouterModule, Routes } from '@angular/router';
import { MapManagementComponent } from './map-management.component';
import { SharedModule } from '../../shared/shared.module';
import { DefaultComponent } from '../../shared/components/pages/default/default.component';
export const routes: Routes = [
    {
        path: '',
        component: DefaultComponent,
        children:[{
            path: '',
            component: MapManagementComponent
        }]
    }
];