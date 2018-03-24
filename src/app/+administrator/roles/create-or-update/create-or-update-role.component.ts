import { Component, Input, OnInit } from "@angular/core";
import { RolesService } from '../roles.service';
import { FormGroup, FormBuilder, Validators, ValidationErrors, AbstractControl } from "@angular/forms";
import { FormService } from "../../../shared/services/form.service";
import { matchOtherValidator } from "../../../shared/validators/validators";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { NGX_ERRORS_SERVICE_CHILD_PROVIDERS, NgxErrorsService } from "../../../shared/utils/form-errors/ngx-errors.service";
import { Observable } from "rxjs/Observable";
import * as _ from 'lodash';
import { Role } from "../../../shared/models/role.model";

declare let mApp: any;
@Component({
    selector: 'create-or-update-role',
    templateUrl: './create-or-update-role.component.html',
    providers: [NGX_ERRORS_SERVICE_CHILD_PROVIDERS]
})
export class CreateOrUpdateRoleComponent implements OnInit{
    form: FormGroup;
    role: Role;
    title: string;
    isEditMode: boolean;
    constructor(public activeModal: NgbActiveModal, private formBuilder: FormBuilder, public formService: FormService, private ngxErrorsService: NgxErrorsService){ }

    ngOnInit(){
        if(this.role){
            this.isEditMode = true;
            this.title = "Edit Role: " + this.role.roleName;
        }else{
            this.isEditMode = false;
            this.title = "Add Role";
        }
        this.createForm();
    }

    createForm(){
        this.form = this.formBuilder.group({
            id:[
                this.role.id
            ],
            roleName: [
                this.role.roleName,
                [Validators.required, Validators.maxLength(20)]
            ],
            descriptions: [this.role.descriptions]
        });
    }

    save(){
        if (this.form.invalid){
            this.formService.validateAllFormFields(this.form);
            return;
        }

        let role = <Role>this.form.value;
        console.log(role);
        this.activeModal.close()
    }
}