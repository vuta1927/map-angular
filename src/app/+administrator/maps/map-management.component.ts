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
                        // let data = mother.convertDataToMapView(response.result);
                        return {
                            data: response.result,
                            totalCount: response.result.length
                        }
                    })
                    .catch(error => { throw 'Data Loading Error' });
            }
        });
    }

    convertDataToMapView(maps: any) {
        var newMaps = new Array<MapView>();
        maps.forEach(map => {
            newMaps.push(new MapView(map.id, map.mapTypeId, map.name, map.descriptions, map.mapType.name, map.roles));
        });
        console.log(newMaps);
        return newMaps;
    }

    mapEditClick($event, data) {
        this.openCreateOrUpdateModal(data.data.id);
    }
    
    addNewMap() {
        this.openCreateOrUpdateModal();
    }

    refreshGrid() {
        this.dataGrid.forEach(grid => {
            grid.instance.refresh();
        });
    }

    onSelectionChanged(e){

    }

    openCreateOrUpdateModal(id?: number) {
        const config = {
            keyboard: false,
            beforeDismiss: () => false
        }

        this.mapSerivce.getMaps(id).toPromise().then(Response => {
            if (Response.result) {
                const modalRef = this.modalService.open(CreateOrUpdateMapComponent, config);
                modalRef.componentInstance.map = Response.result[0];
                var mother = this;
                modalRef.result.then(function () {
                    mother.refreshGrid();
                })
            } else {
                alert("ERROR! Cant get map info!");
                return
            }
        });


    }
}