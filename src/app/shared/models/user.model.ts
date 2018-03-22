export interface IUser {
    username: string;
    name: string;
    surname: string;
    fullname: string;
    emailAddress: string;
    lastLoginTime: Date;
    isActive: boolean;
    shouldChangePasswordOnNextLogin: boolean;
    roleNames: string[];
}

export interface IUserEdit {
    id?: number;
    name: string;
    surname: string;
    userName: string;
    emailAddress: string;
    password: string;
    isActive: boolean;
    shouldChangePasswordOnNextLogin: boolean;
}

export interface IUserRole {
    roleId: number;
    roleName: string;
    roleDisplayName: string;
    isAssigned: boolean;
}

export interface IUserForCreateOrEdit {
    assignedRoleCount: number;
    isEditMode: boolean;
    user: IUserEdit;
    roles: IUserRole[];
}

export class CreateOrUpdateUser {
    user: IUserEdit;
    assignedRoleNames: string[];
    sendActivationEmail: boolean;
}