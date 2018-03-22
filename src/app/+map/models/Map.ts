import { Road } from "./Road";
import { GoogleRoadIcon, CommentIcon } from './Icon';
export interface IMap{
    id: number;
    type: number;
    roads: Road[];
    editPermission: boolean;
    addPermission: boolean;
    deletePermission: boolean;
}

export class GMap implements IMap{
    constructor(public id: number, public type: number, public roads: Road[], public commentIcons: CommentIcon[], public controller: any, public editPermission: boolean,public addPermission: boolean, public deletePermission: boolean){
        this.controller = controller;
    }
}