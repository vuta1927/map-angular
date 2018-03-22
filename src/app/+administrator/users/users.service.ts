import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { IUser, IUserForCreateOrEdit } from '../../shared/models/user.model';
import { ConfigurationService } from '../../shared/services/configuration.service';
import { IAppCoreResponse } from '../../shared/models/appcore-response.model';

@Injectable()
export class UsersService {

    constructor(private http: HttpClient, private configurationService: ConfigurationService) {}

    public getUsers(params: any): Observable<IAppCoreResponse<IUser[]>> {
        let url = this.configurationService.serverSettings.identityUrl + 'api/user/getall';

        return this.http.get<IAppCoreResponse<IUser[]>>(url + params);
    }

    public getById(id: number): Observable<IAppCoreResponse<IUser>>  {
        let url = this.configurationService.serverSettings.identityUrl + 'api/user/' + id;
        return this.http.get<IAppCoreResponse<IUser>>(url);
    }

    public getUserForCreatOrEdit(id?: number): Observable<IAppCoreResponse<IUserForCreateOrEdit>> {
        let url = this.configurationService.serverSettings.identityUrl + 'api/user/getUserForCreateOrEdit/' + (id ? id : '').toString();
        return this.http.get<IAppCoreResponse<IUserForCreateOrEdit>>(url);
    }

    public getByUsername(username: string): Observable<IAppCoreResponse<IUser>> {
        let url = this.configurationService.serverSettings.identityUrl + 'api/user/withusername/' + username;
        return this.http.get<IAppCoreResponse<IUser>>(url);
    }

    public getByEmail(email: string): Observable<IAppCoreResponse<IUser>> {
        let url = this.configurationService.serverSettings.identityUrl + 'api/user/withemail/' + email;
        return this.http.get<IAppCoreResponse<IUser>>(url);
    }
}