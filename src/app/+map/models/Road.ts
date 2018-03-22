import { GoogleRoadIcon } from './Icon';
interface IRoad {
    id: number;
    color: string;
}
interface ICoordinate{
    lat: number;
    lng: number;
}
interface IMetaData{
    name: string;
    direction: any;
}
interface IIcon{
    icon: string;
    descriptions: string;
}

export class Direction{
    constructor(public display, public value){}
}
export class MetaData{
    constructor(public name?, public direction?){
    }
}
export class Coordinate implements ICoordinate{
    constructor(public lat: number, public lng: number){}
}
export class Road implements IRoad {
    constructor(public id: number, public paths: Coordinate[], public distance: number, public color: string, public name: string, public direction: string, public googleRoadIcons: GoogleRoadIcon[]) {
        this.paths = paths;
        this.distance = distance;
        this.name = name;
        this.direction = direction;
        this.googleRoadIcons = googleRoadIcons;
    }
}

export class ServerRoad implements IRoad{
    constructor(public id: number, public paths: string, public distance: number, public color: string, public name: string, public direction: string, public mapId: number ) {
        this.paths = paths;
        this.distance = distance;
        this.name = name;
        this.direction = direction;
        this.mapId = mapId;
    }
}

export class Icon implements IIcon{
    constructor(public icon: string, public descriptions: string){ }
}