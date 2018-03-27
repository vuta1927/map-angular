import { Component, Input, OnInit } from "@angular/core";
import { MapManagementService } from '../map-management.service';
import { FormGroup, FormBuilder, Validators, ValidationErrors, AbstractControl, FormControl } from "@angular/forms";
import { FormService } from "../../../shared/services/form.service";
import { matchOtherValidator } from "../../../shared/validators/validators";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NGX_ERRORS_SERVICE_CHILD_PROVIDERS, NgxErrorsService } from "../../../shared/utils/form-errors/ngx-errors.service";
import { Observable } from "rxjs/Observable";
import * as _ from 'lodash';
import { MapEdit, MapView } from "../../../shared/models/map.model";
import { SecurityService } from '../../../shared/services/security.service';
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
    constructor(public activeModal: NgbActiveModal, private formBuilder: FormBuilder, public formService: FormService, private ngxErrorsService: NgxErrorsService, private securityService: SecurityService, private mapService: MapManagementService) { 
        
    }

    ngOnInit() {
        this.mapService.getMapTypes().toPromise().then(Response=>{
            if(Response.result){
                this.mapTypes = Response.result;
            }else{
                this.isDisable = true;
            }
        });
        if (this.map) {
            this.isEditMode = true;
            this.title = "Edit Map: " + this.map.name;
        } else {
            this.map = new MapView(-1, 100, '', '', '', null);
            this.isEditMode = false;
            this.title = "Add Map";
        }
        this.createForm();
    }

    createForm() {
        this.form = this.formBuilder.group({
            id: new FormControl(this.map.id),
            name: new FormControl(this.map.name, [Validators.required]),
            type: new FormControl(this.map.type),
            descriptions: new FormControl(this.map.descriptions)
        });
    }

    save() {
        if (this.form.invalid) {
            this.formService.validateAllFormFields(this.form);
            return;
        }
        console.log(this.form.value);
        if (this.isEditMode) {
            let map = <MapView>this.form.value;
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
            let map = <MapView>this.form.value;
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