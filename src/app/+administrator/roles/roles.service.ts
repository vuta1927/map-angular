import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConfigurationService } from "../../shared/services/configuration.service";
import { Observable } from "rxjs/Observable";
import { IAppCoreResponse } from "../../shared/models/appcore-response.model";
import { IRole } from "../../shared/models/role.model";

@Injectable()
export class RolesService {
    constructor(private http: HttpClient, private configurationService: ConfigurationService) {}

    public getRoles(): Observable<IAppCoreResponse<IRole[]>> {
        let url = this.configurationService.serverSettings.identityUrl;

        return this.http.get<IAppCoreResponse<IRole[]>>(url + 'api/role/getall');
    }
}