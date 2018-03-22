export interface IRole {
    id: number;
    name: string;
    displayName: string;
    description: string;
    isDefault: boolean;
    permission: string[];
}