import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConfigurationService } from "../../shared/services/configuration.service";
import { Observable } from "rxjs/Observable";
import { IAppCoreResponse } from "../../shared/models/appcore-response.model";
import { Role, IRole } from "../../shared/models/role.model";

@Injectable()
export class RolesService {
    constructor(private http: HttpClient, private configurationService: ConfigurationService) {}

    public getRoles(){
        let url = this.configurationService.serverSettings.identityUrl;
        this.http.get(url + '/api/roles').subscribe((res:Response)=>{
            let result = res['result'];
            let roles = new Array<Role>();
            result.forEach(r => {
                let role = new Role(r.id, r.roleName, r.normalizedRoleName, r.roleClaims, r.lastModifierUser, r.deleteUser, r.isDeleted, r.deleterUserId, r.deletionTime, r.lastModificationTime, r.lastModifierUserId, r.creationTime, r.creatorUserId, r.creatorUser, r.descriptions);
                roles.push(role);    
            });
            return roles;
        }, error => {console.log(error); return null;});
    }

    public getRawRoles(): Observable<IAppCoreResponse<IRole[]>> {
        let url = this.configurationService.serverSettings.identityUrl + '/api/roles';

        return this.http.get<IAppCoreResponse<IRole[]>>(url);
    }
}