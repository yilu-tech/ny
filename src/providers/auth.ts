import { Injectable } from '@angular/core';
import { AuthHandler, Token } from './handlers/auth.handler';
import { Api } from './api';
import { CONFIG } from './config';
import { Cache } from './cache';
import { GlobalEvents } from './events';

@Injectable()
export class Auth {

    private _user: any;
    private pending: Promise<boolean>;

    constructor(private api: Api, private authHandler: AuthHandler, private cache: Cache, private events: GlobalEvents) {
        if (this.authHandler.hasToken()) {
            this.restoreUser();
        }
    }

    public user() {
        return this._user;
    }

    public shop() {
        return this._user ? this._user.current_shop : null;
    }

    public shops() {
        return this._user ? this._user.shops : [];
    }

    public permissions() {
        return this._user ? this._user.permissions : [];
    }

    public setPermissions(permissions: Array<any>) {
        if (this._user) {
            this._user.permissions = permissions;
            this.events.publish('permission:update', permissions);
        }
        return this;
    }

    public check(): boolean | Promise<boolean> {
        if (!this.authHandler.hasToken()) {
            return false;
        }
        return this._user ? true : this.pending || false;
    }

    public login(params: any) {
        let body = {
            'grant_type': 'password',
            'client_id': CONFIG.clientId,
            'client_secret': CONFIG.clientSecret,
            'username': params.username,
            'password': params.password,
            'scope': '*',
        };
        return this.api.post(CONFIG.tokenApi, body).then((token: Token) => {
            this.authHandler.saveToken(token);
            return this.restoreUser();
        });
    }

    public loginOut(): void {
        this.authHandler.clearToken();
        this._user = null;
        this.events.publish('user:destroy');
    }

    public restoreUser() {
        return this.pending = this.api.get(CONFIG.userApi).then((user) => {
            this._user = user;
            this.cache.set('user', user);

            this.events.publish('user:init', user);

            this.pending = null;
            return true;
        }).catch((error) => false);
    }
}
