import { Component, ViewEncapsulation, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { MapManagementService } from './map-management.service';
import CustomStore from 'devextreme/data/custom_store';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DxDataGridComponent } from 'devextreme-angular';
import { CreateOrUpdateMapComponent } from './create-or-update-map/create-or-update-map.component';
import { Helpers } from '../../helpers';
import { MapEdit, MapView } from '../../shared/models/map.model';
@Component({
    selector: 'map-management-roles',
    templateUrl: './map-management.component.html',
    styleUrls: ['./map-management.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class MapManagementComponent {
    
    @ViewChildren(DxDataGridComponent) dataGrid: QueryList<DxDataGridComponent>;
    dataSource: any = {};
    permissionSource: any;
    selectedRole: any;
    
    constructor(private modalService: NgbModal, private mapSerivce: MapManagementService) {
        var mother = this;
        this.dataSource.store = new CustomStore({
            load: function (loadOptions: any) {
                return mapSerivce.getMaps()
                    .toPromise()
                    .then(response => {
                        let data = mother.convertDataToMapView(response.result);
                        return {
                            data: data,
                            totalCount: data.length
                        }
                    })
                    .catch(error => { throw 'Data Loading Error' });
            }
        });
    }

    convertDataToMapView(maps:any){
        var newMaps = new Array<MapView>();
        maps.forEach(map => {
            console.log(map);
            newMaps.push(new MapView(map.id, map.mapTypeId, map.name, map.descriptions, map.mapType.name));
        });
        return newMaps;
    }

    mapEditClick($event, data){
        this.openCreateOrUpdateModal(data.data);
    }
    addNewMap(){
        this.openCreateOrUpdateModal();
    }
    refreshGrid(){
        this.dataGrid.forEach(grid => {
            grid.instance.refresh();
        });
    }
    openCreateOrUpdateModal(map?: MapEdit) {
        const config = {
            keyboard: false,
            beforeDismiss: () => false
        }
        const modalRef = this.modalService.open(CreateOrUpdateMapComponent, config);
        modalRef.componentInstance.map = map;
        var mother = this;
        modalRef.result.then(function () {
            mother.refreshGrid();
        })
    }
}