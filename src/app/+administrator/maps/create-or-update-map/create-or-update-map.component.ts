import { Component, Input, OnInit } from "@angular/core";
import { MapManagementService } from '../map-management.service';
import { FormGroup, FormBuilder, Validators, ValidationErrors, AbstractControl, FormControl } from "@angular/forms";
import { FormService } from "../../../shared/services/form.service";
import { matchOtherValidator } from "../../../shared/validators/validators";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NGX_ERRORS_SERVICE_CHILD_PROVIDERS, NgxErrorsService } from "../../../shared/utils/form-errors/ngx-errors.service";
import { Observable } from "rxjs/Observable";
import * as _ from 'lodash';
import { MapEdit, MapView, MapUpdate } from "../../../shared/models/map.model";
import { SecurityService } from '../../../shared/services/security.service';
import { RolesService } from '../../roles/roles.service';
@Component({
    selector: 'create-or-update-map',
    templateUrl: './create-or-update-map.component.html',
    providers: [NGX_ERRORS_SERVICE_CHILD_PROVIDERS]
})
export class CreateOrUpdateMapComponent implements OnInit {
    form: FormGroup;
    map: any;
    mapTypes: any;
    title: string;
    messageHeader: string;
    message: string;
    isEditMode: boolean;
    isDisable: boolean;
    assignedRoleNames: string[];
    constructor(public activeModal: NgbActiveModal, private formBuilder: FormBuilder, public formService: FormService, private ngxErrorsService: NgxErrorsService, private securityService: SecurityService, private mapService: MapManagementService, private roleService: RolesService) { 
        
    }

    ngOnInit() {
        if(!this.map){
            this.map = new MapView(-1, 100, '', '', '', []);
        }

        this.assignedRoleNames = this.map.roles.filter(r => r.isAssigned).map(r => { return r.roleName; });
        this.createForm();

        this.mapService.getMapTypes().toPromise().then(Response=>{
            if(Response.result){
                this.mapTypes = Response.result;
            }else{
                this.isDisable = true;
            }
        });

        if (this.map.id) {
            this.isEditMode = true;
            this.title = "Edit Map: " + this.map.name;
        } else {
            this.isEditMode = false;
            this.title = "Add Map";
        }
        var mother = this;
        this.roleService.getRawRoles().toPromise().then(Response=>{
            if(Response.result){
                Response.result.forEach(role => {
                    role["isAssigned"] = false;
                    role["roleDisplayName"] = role.roleName;
                    mother.map.roles.push(role);
                });
            }else{
                mother.isDisable = true;
            }
        });
    }

    private createForm() {
        this.form = this.formBuilder.group({
            id: new FormControl(this.map.id),
            name: new FormControl(this.map.name, [Validators.required]),
            type: new FormControl(this.map.type.value),
            descriptions: new FormControl(this.map.descriptions)
        });
    }

    private roleSelectedChange(data) {
        if (data.target.checked === true) {
            this.assignedRoleNames.push(data.target.value);
        } else {
            _.remove(this.assignedRoleNames, function(n) {
                return n === data.target.value;
            });
        }
    }

    save() {
        if (this.form.invalid) {
            this.formService.validateAllFormFields(this.form);
            return;
        }
        console.log(this.form.value);
        if (this.isEditMode) {
            let map = <MapEdit>this.form.value;
            map.rolesAssigned = this.assignedRoleNames;
            this.mapService.updateMap(map).toPromise()
            .then(Response =>{
                if(Response.result){
                    this.activeModal.close();
                }else{
                    this.messageHeader = "Map Exist";
                    this.message = "Map is exist, please try another name!";
                    $('#errorMessage').css("display", "block");
                }
            });
        }else{
            let map = <MapUpdate>this.form.value;
            map.rolesAssigned = this.assignedRoleNames;
            this.mapService.addMap(map).toPromise().then(Response=>{
                if(Response.result){
                    this.activeModal.close();
                }else{
                    this.messageHeader = "Map Exist";
                    this.message = "Map is exist, please try another name!";
                    $('#errorMessage').css("display", "block");
                }
            });
        }
    }
}