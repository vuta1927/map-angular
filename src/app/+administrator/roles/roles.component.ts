import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { RolesService } from '../roles/roles.service';
import CustomStore from 'devextreme/data/custom_store';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { DxDataGridComponent } from 'devextreme-angular';
import { TranslateExtService } from '../../shared/services/translate-ext.service';
import { Helpers } from '../../helpers';
@Component({
    selector: 'app-roles',
    templateUrl: './roles.component.html',
    styleUrls: ['./roles.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RolesComponent {
    dataSource: any = {};
    permissionSource: any;

    constructor(private roleService: RolesService, private translate: TranslateExtService) {
        this.dataSource.store = new CustomStore({
            load: function (loadOptions: any) {
                var params = '?';

                params += 'skip=' + loadOptions.skip || 0;
                params += '&take=' + loadOptions.take || 12;

                if (loadOptions.sort) {
                    params += '&orderby=' + loadOptions.sort[0].selector;
                    if (loadOptions.sort[0].desc) {
                        params += ' desc';
                    }
                }
                return roleService.getRawRoles(params)
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

    roleEditClick($event, data) {
        console.log("edit", data.data.roleName);
    }

    roleDeleteClick($event, data) {
        console.log("delete", data.data.roleName);
    }
}