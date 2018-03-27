import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { routes } from './map-management.routing';
import { MapManagementComponent } from './map-management.component';
import { CreateOrUpdateMapComponent } from './create-or-update-map/create-or-update-map.component';
import { DxDataGridModule, DxMenuModule, DxCheckBoxModule } from 'devextreme-angular';
@NgModule({
    imports: [SharedModule, RouterModule.forChild(routes), DxDataGridModule, DxMenuModule,DxCheckBoxModule],
    declarations: [MapManagementComponent, CreateOrUpdateMapComponent],
    entryComponents: [CreateOrUpdateMapComponent]
})
export class MapManagementModule {}