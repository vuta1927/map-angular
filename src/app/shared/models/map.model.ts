export interface IMap{
    id: number;
    type: number;
    name: string;
    roads: any[];
    editPermission: boolean;
    addPermission: boolean;
    deletePermission: boolean;
}

export interface IMapForCreateUpdate{
    id: number;
    type: number;
    name: string;
    descriptions: string;
}

export interface IRoleMap {
    name: string;
    isAssigned: boolean
}

export class MapView implements IMapForCreateUpdate{
    constructor(public id: number, public type: number, public name: string, public descriptions: string, public typeName: string, public roles: IRoleMap[]){}
}

export class MapEdit implements IMapForCreateUpdate{
    constructor(public id: number, public type: number, public name: string, public descriptions: string, public rolesAssigned: string[]){}
}

export class MapUpdate implements IMapForCreateUpdate{
    constructor(public id: number, public type: number, public name: string, public descriptions: string, public rolesAssigned: string[]){}
}