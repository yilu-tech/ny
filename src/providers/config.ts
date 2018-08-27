export type Config = {
    baseUrl?: string,
    tokenApi?: string,
    userApi?: string,
    clientId?:number,
    clientSecret?:string
}

export const CONFIG: Config = {};

export const registerConfig = (config) => {
    Object.assign(CONFIG, config);
};
