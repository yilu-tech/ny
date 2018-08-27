import { Injectable } from '@angular/core';
import { Cache } from '../cache';

export type Token = {
    token_type: string;
    expires_in: string;
    access_token: string;
    refresh_token: string;
}

@Injectable()
export class AuthHandler {

    private token: Token = null;

    constructor(private cache: Cache) {
        this.token = this.cache.get('token');
    }

    public hasToken() {
        return !!this.token;
    }

    public clearToken() {
        this.token = null;
        this.cache.forget('token');
    }

    public saveToken(token: Token) {
        this.token = token;

        this.cache.forever('token', token);
    }

    public getToken(): Token {
        return this.token;
    }

    public getAuthorization(): string {
        if (this.token) {
            return this.token.token_type + ' ' + this.token.access_token;
        }
        return '';
    }
}
