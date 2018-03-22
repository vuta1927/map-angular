import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { RolesService } from '../roles/roles.service';
import CustomStore from 'devextreme/data/custom_store';

import 'rxjs/add/operator/toPromise';

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
    constructor() {
        
    }
}