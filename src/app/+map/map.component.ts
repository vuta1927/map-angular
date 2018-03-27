import { Component, OnInit } from '@angular/core';
import { forEach } from '@angular/router/src/utils/collection';
import { DataService } from '../shared/services/data.service';
import { Response } from '@angular/http/src/static_response';
import { Constants } from '../constants';
import { GmapService } from './services/gmap.service';
import { Road } from './models/Road';
declare let google: any;
@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.css'],
    providers: [GmapService]
})
export class MapComponent implements OnInit {
    gmaps: Array<any> = [];
    others: Array<any> = [];

    constructor(private dataService: DataService, private gmapService: GmapService) {
    }
    public ngOnInit() {
        this.dataService.get("http://localhost:51636/api/maps/GetMapsByRole").subscribe((res: Response) => {
            // console.log(res);
            let results = res['result'];
            for(var result of results){
                if(result['type'] == Constants.mapType.Google){
                    this.gmaps.push(result);
                }else{
                    this.others.push(result);
                }
            }
            
            if (this.gmaps.length > 0) {
                this.gmapService.initGoogleMap(this.gmaps);
            } else {
                console.log("error! no data!");
            }
        }, error => console.log(error));
    }   
}