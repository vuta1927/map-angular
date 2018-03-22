import {GMap} from './Map';
export interface Iicon{
    id: number;
    descriptions: string;
    url: string;
}

export class GoogleRoadIcon implements Iicon{
    constructor(public id: number, public descriptions: string, public url: string, public googleRoadId: number, public lat: number, public lng: number, public location: string){
        this.googleRoadId = googleRoadId;
        this.lat = lat;
        this.lng = lng;
        this.location = location;
    }
}

export class CommentIcon implements Iicon{
    constructor(public id: number, public descriptions: string, public url: string, public mapId:number){
        this.mapId = mapId;
    }
}