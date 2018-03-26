import { Component, AfterViewInit, OnInit } from '@angular/core';
import {MapGuard, AdminGuard, UserGuard, RoleGuard} from '../../../guards/auth.guard';
import { SecurityService } from '../../../services/security.service';
declare let mLayout: any;
@Component({
    selector: "app-aside-nav",
    templateUrl: "./aside-nav.component.html"
})
export class AsideNavComponent implements AfterViewInit {
    accessAdmin: boolean;
    viewMap: boolean;
    viewUser: boolean;
    viewRole: boolean;

    constructor(private mapGuard: MapGuard, private adminGuard: AdminGuard, private userGuard: UserGuard, private roleGuard: RoleGuard){
        
    }
    
    ngOnInit() {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        
        this.accessAdmin = this.adminGuard.canActivate(null, null);
        this.viewMap = this.mapGuard.canActivate(null, null);
        this.viewUser = this.userGuard.canActivate(null, null);
        this.viewRole = this.roleGuard.canActivate(null, null);

    }
    ngAfterViewInit() {
        mLayout.initAside();
    }
}