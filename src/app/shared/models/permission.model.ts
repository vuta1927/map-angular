export interface IPermission {
    parent: IPermission;
    children: IPermission[];
    name: string;
    description: string;
    category: string;
    displayName: string;
    id: number
}

export class Permission implements IPermission{
    constructor(public id: number, public parent: Permission, public children: Permission[], public name:string, public description: string, public category: string, public displayName: string){}
}