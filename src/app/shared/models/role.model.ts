import { IUser } from './user.model';
import { RoleClaim } from './roleClaim.model';
import { Permission } from './permission.model';
export interface IRole {
    roleName: string;
    normalizedRoleName: string;
    permissions: Permission[];
    creatorUser: IUser;
    lastModifierUser: IUser;
    deleterUser: IUser;
    isDeleted: boolean;
    deleterUserId: number;
    deletionTime: Date;
    lastModificationTime: Date;
    lastModifierUserId: number;
    creationTime: Date;
    creatorUserId: number;
    descriptions: string;
    id: number
}

export class Role implements IRole{
    constructor(public id: number, public roleName: string, public normalizedRoleName: string, public permissions: Permission[],public lastModifierUser: IUser, public deleterUser: IUser, public isDeleted: boolean, public deleterUserId: number, public deletionTime: Date, public lastModificationTime: Date, public lastModifierUserId: number, public creationTime:Date, public creatorUserId:number, public creatorUser: IUser, public descriptions: string){

    }
}