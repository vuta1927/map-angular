import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConfigurationService } from "../../shared/services/configuration.service";
import { Observable } from "rxjs/Observable";
import { IAppCoreResponse } from "../../shared/models/appcore-response.model";
import  { IMap, MapEdit } from '../../shared/models/map.model';
@Injectable()
export class MapManagementService {
    constructor(private http: HttpClient, private configurationService: ConfigurationService) {}
    public getMaps(id?:number): Observable<IAppCoreResponse<IMap[]>> {
        let url = this.configurationService.serverSettings.identityUrl + '/api/maps/getmaps/' + (id ? id : -1).toString();
        // console.log(url);
        return this.http.get<IAppCoreResponse<IMap[]>>(url);
    }

    public updateMap(map: MapEdit): Observable<IAppCoreResponse<IMap[]>> {
        let url = this.configurationService.serverSettings.identityUrl + '/api/maps/putmap/'+map.id;

        return this.http.put<IAppCoreResponse<IMap[]>>(url, map);
    }

    public addMap(map: MapEdit): Observable<IAppCoreResponse<IMap[]>> {
        let url = this.configurationService.serverSettings.identityUrl + '/api/maps/postmap';

        return this.http.post<IAppCoreResponse<IMap[]>>(url, map);
    }

    public deleteMaps(map: MapEdit): Observable<IAppCoreResponse<IMap[]>> {
        let url = this.configurationService.serverSettings.identityUrl + '/api/maps/deletemap/'+map.id;

        return this.http.delete<IAppCoreResponse<IMap[]>>(url);
    }

    public getMapTypes(): Observable<IAppCoreResponse<any[]>> {
        let url = this.configurationService.serverSettings.identityUrl + '/api/maptypes';

        return this.http.get<IAppCoreResponse<any[]>>(url);
    }
}