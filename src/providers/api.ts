import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { AuthHandler } from './handlers/auth.handler';
import { GlobalEvents } from './events';
import { Cache } from './cache';
import { CONFIG } from './config';

@Injectable()
export class Api {

    private readonly _requestHandlers: Array<Function>;
    private readonly _responseHandlers: Array<Function>;
    private readonly _errorHandlers: Array<Function>;

    constructor(public httpClient: HttpClient, private authHandler: AuthHandler, private events: GlobalEvents, private cache: Cache) {

        this._requestHandlers = [
            this._validateCacheHandler.bind(this),
            this._setUrlHandler,
            this._addTokenHandler.bind(this),
        ];

        this._responseHandlers = [
            this._responseHandler.bind(this),
            this._addCacheHandler.bind(this)
        ];

        this._errorHandlers = [
            this._errorHandler.bind(this)
        ];
    }

    public get(url: string, params: any = {}, options: any = {}): Promise<any> {

        options.params = params;

        return this.request('GET', url, options);
    }

    public post(url: string, body: any = {}, options: any = {}): Promise<any> {

        options.body = body;

        return this.request('POST', url, options);
    }

    public put(url: string, body: any = {}, options: any = {}): Promise<any> {

        options.body = body;

        return this.request('PUT', url, options);
    }

    public patch(url: string, body: any = {}, options: any = {}): Promise<any> {

        options.body = body;

        return this.request('PATCH', url, options);
    }

    public delete(url: string, params: any = {}, options: any = {}): Promise<any> {

        options.params = params;

        return this.request('DELETE', url, options);
    }

    public request(method: string, url: string, options: any = {}): Promise<any> {
        let request = {method: method.toUpperCase(), url, uri: url, options};

        let _ = this._handleRequest(request);
        if (_) {
            return typeof _ === 'boolean' ? Promise.resolve(null) : _;
        }

        this.events.publish('http.request:start', request.uri);

        return this.httpClient.request(method, request.url, request.options).toPromise()
            .then((response) => this._responseHandlers.reduce((res, handler) => handler(res, request), response))
            .catch((response) => Promise.reject(this._errorHandlers.reduce((err, handler) => handler(err, request), response)));
    }

    private _handleRequest(request): boolean | Promise<any> {
        for (let handler of this._requestHandlers) {
            let _: any = handler(request);

            if (request.options.abort) {
                return _ || true;
            }
        }
        return false;
    }

    public addHandler(handler: () => void, type: string = 'request') {
        if (type === 'request') {
            this._requestHandlers.push(handler);
        } else if (type === 'response') {
            this._responseHandlers.push(handler);
        } else if (type === 'error') {
            this._errorHandlers.push(handler);
        }
    }

    public removeHandler(handler: Function, type: string = 'request') {
        let handlers = [];
        if (type === 'request') {
            handlers = this._requestHandlers;
        } else if (type === 'response') {
            handlers = this._responseHandlers;
        } else if (type === 'error') {
            handlers = this._errorHandlers;
        }
        let index = handlers.indexOf(handler);
        if (index >= 0) {
            handlers.splice(index, 1);
        }
    }

    private _responseHandler(response: any, request) {
        this.events.publish('http.request:end', response, request);
        if ('status' in response) {
            if (response.status === 1) {
                return response.data || response.pagination;
            }
            return Promise.reject(response);
        }
        return response;
    }

    private _validateCacheHandler(request: any) {
        if (request.options.inCache) {
            let key = request.method + ':' + request.uri;
            if (this.cache.exists(key) && !this.cache.isChange(key)) {
                request.options.abort = true;
                return this.cache.getAsync(key);
            }
        }
    }

    private _addCacheHandler(response: any, request) {
        if (request.options.inCache) {
            this.cache.set(request.method + ':' + request.uri, response, request.options.name);
        }
        return response;
    }

    private _errorHandler(response: HttpErrorResponse | Object, request) {
        if (response instanceof HttpErrorResponse) {
            this.events.publish('http.error:' + response.status, response, request);
        } else {
            this.events.publish('http.error:0', response);
        }
        return response;
    }

    private _setUrlHandler(request: any): void {
        if (!request.url.match(/([\w-]+\.)*[\w]+\.[\w]+/)) {
            request.url = CONFIG.baseUrl + '/' + request.url;
        }
    }

    private _addTokenHandler(request: any): void {
        let headers = request.options.headers || {};
        request.options.headers = new HttpHeaders({
            ...headers,
            Accept: 'application/json',
            authorization: this.authHandler.getAuthorization(),
        });
    }
}
