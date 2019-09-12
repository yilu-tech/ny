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
        return !this._token;
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
        return this.exists() ? null : this._token.access_token;
    }

    public getRefreshToken() {
        return this.exists() ? null : this._token.refresh_token;
    }

    public getExpiresIn() {
        return this.exists() ? null : this._token.expires_in;
    }

    public getTokenType() {
        return this.exists() ? null : this._token.token_type;
    }

    public isExpire() {
        return this.getExpiresIn() < Date.now() / 1000;
    }

    public getAuthorization() {
        if (this.exists()) {
            return null;
        }
        return this.getTokenType() + ' ' + this.getAccessToken();
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
