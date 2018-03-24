import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { routes } from './roles.routing';
import { RolesComponent } from './roles.component';

import { DxDataGridModule, DxMenuModule } from 'devextreme-angular';
import { CreateOrUpdateRoleComponent } from './create-or-update/create-or-update-role.component';
@NgModule({
    imports: [SharedModule, RouterModule.forChild(routes), DxDataGridModule, DxMenuModule],
    declarations: [RolesComponent, CreateOrUpdateRoleComponent],
    entryComponents: [CreateOrUpdateRoleComponent]
})
export class RolesModule {}