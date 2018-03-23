import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { routes } from './roles.routing';
import { RolesComponent } from './roles.component';

import { DxDataGridModule, DxMenuModule } from 'devextreme-angular';
@NgModule({
    imports: [SharedModule, RouterModule.forChild(routes), DxDataGridModule, DxMenuModule],
    declarations: [RolesComponent],
    entryComponents: []
})
export class RolesModule {}