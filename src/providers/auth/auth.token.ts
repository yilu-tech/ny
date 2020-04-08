import { Injectable } from '@angular/core';

@Injectable()
export class AuthToken {

    private _token: {
        access_token: string,
        refresh_token: string,
        expires_in: number,
        token_type: string,
    };

    public constructor() {
        this._restore();
    }

    public exists() {
        return this._token != null;
    }

    public setToken(token: any) {
        this._token = token;
        localStorage.setItem('token', JSON.stringify(token));
    }

    public clear() {
        this._token = null;
        localStorage.removeItem('token');
    }

    public getAccessToken() {
        return this.exists() ? this._token.access_token : null;
    }

    public getRefreshToken() {
        return this.exists() ? this._token.refresh_token : null;
    }

    public getExpiresIn() {
        return this.exists() ? this._token.expires_in : null;
    }

    public getTokenType() {
        return this.exists() ? this._token.token_type : null;
    }

    public isExpire() {
        return this.getExpiresIn() < Date.now() / 1000;
    }

    public getAuthorization() {
        if (this.exists()) {
            return this.getTokenType() + ' ' + this.getAccessToken();
        }
        return null;
    }

    private _restore() {
        try {
            let token = localStorage.getItem('token');
            if (token) {
                this._token = JSON.parse(token);
            }
        } catch (e) {

        }
    }
}
