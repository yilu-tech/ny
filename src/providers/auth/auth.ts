import { Injectable } from '@angular/core';
import { AuthToken } from './auth.token';
import { CONFIG } from '../config';
import { Http } from '../http/http';

@Injectable()
export class Auth {

    private _user: any;

    private _pending: Promise<boolean>;

    constructor(private authToken: AuthToken, private http: Http) {
        if (!this.authToken.exists()) {
            this.restoreUser();
        }
    }

    public id() {
        return this._user ? this._user.id : null;
    }

    public user() {
        return this._user;
    }

    public login(username: string, password: string, scope = '*') {
        let body = {
            grant_type: 'password',
            client_id: CONFIG.clientId,
            client_secret: CONFIG.clientSecret,
            username,
            password,
            scope,
        };
        return this.http.post(CONFIG.tokenApi, body).then((token) => {
            this.authToken.setToken(token);
            return this.restoreUser();
        });
    }

    public check(): boolean | Promise<boolean> {
        if (this.authToken.exists()) {
            return false;
        }
        return this._user ? true : this._pending || false;
    }

    public loginOut(): void {
        this._user = null;
        this.authToken.clear();
    }

    public restoreUser() {
        return this._pending = this.http.get(CONFIG.userApi).then((user) => {
            this._user = user;
            this._pending = null;
            return true;
        }).catch((error) => false);
    }
}
