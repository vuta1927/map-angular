import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { RolesService } from '../roles/roles.service';
import CustomStore from 'devextreme/data/custom_store';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DxDataGridComponent } from 'devextreme-angular';
import { TranslateExtService } from '../../shared/services/translate-ext.service';
import { Helpers } from '../../helpers';
import { CreateOrUpdateRoleComponent } from './create-or-update/create-or-update-role.component';
import { Role } from '../../shared/models/role.model';
@Component({
    selector: 'app-roles',
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RolesComponent {
    dataSource: any = {};
    permissionSource: any;

    constructor(private roleService: RolesService, private translate: TranslateExtService, private modalService: NgbModal) {
        this.dataSource.store = new CustomStore({
            load: function (loadOptions: any) {
                return roleService.getRawRoles()
                    .toPromise()
                    .then(response => {
                        return {
                            data: response.result,
                            totalCount: response.result.length
                        }
                    })
                    .catch(error => { throw 'Data Loading Error' });
            }
        });
    }

    onSelectionChanged(e) { // Handler of the "selectionChanged" event
        let data = e.currentSelectedRowKeys[0];
        console.log(data.permissions);
        this.permissionSource = data.permissions;
    }

    addNewRole(){
        this.openCreateOrUpdateModal();
    }

    roleEditClick($event, data) {
        console.log("edit", data.data.roleName);
        this.openCreateOrUpdateModal(data.data);
    }

    roleDeleteClick($event, data) {
        console.log("delete", data.data.roleName);
    }

    openCreateOrUpdateModal(role?: Role) {
        const config = {
            keyboard: false,
            beforeDismiss: () => false
        }
        Helpers.setLoading(true);
        const modalRef = this.modalService.open(CreateOrUpdateRoleComponent, config);
        modalRef.componentInstance.role = role;
        Helpers.setLoading(false);

    }
}