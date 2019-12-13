import { HttpHeaders } from '@angular/common/http';
import { urlParser, buildUrl, buildQueryStr, queryStrParser, UrlInfo } from './url.resolver';

export class HttpRequest {
    private _urlInfo: UrlInfo;

    private _method: string;

    private _headers: { [key: string]: string | string[] } = {};

    private _params: { [key: string]: string | string[] } = {};

    private _body: any | FormData;

    private _responseType: 'arraybuffer' | 'blob' | 'json' | 'text' = 'json';

    constructor(method?: string, url?: string, options?: any) {
        if (method) {
            this.setMethod(method);
        }
        if (url) {
            this.setUrl(url);
        }
        if (options) {
            if (options.params) {
                Object.assign(options.params, this.getParams())
            }
            this.setOptions(options);
        }
    }

    public getUrl(): string {
        return buildUrl(
            this._urlInfo.scheme,
            this._urlInfo.userInfo,
            this._urlInfo.domain,
            this._urlInfo.port,
            this._urlInfo.path,
            null,
            this._urlInfo.fragment,
        );
    }

    public getUrlInfo() {
        return this._urlInfo;
    }

    public setUrl(url: string) {
        this._urlInfo = urlParser(url);
        if (this._urlInfo.query) {
            this.setParams(queryStrParser(this._urlInfo.query));
        }
        return this;
    }

    public getMethod() {
        return this._method;
    }

    public setMethod(method: string) {
        this._method = method.toUpperCase();
        return this;
    }

    public getResponseType() {
        return this._responseType;
    }

    public setResponseType(type: 'arraybuffer' | 'blob' | 'json' | 'text' = 'json') {
        this._responseType = type;
        return this;
    }

    public getOptions() {
        return {
            headers: this.getHeaders(),
            params: this.getParams(),
            body: this.getBody(),
            responseType: this.getResponseType()
        };
    }

    public setOptions(options: {
        body?: any;
        headers?: {
            [key: string]: string | string[];
        };
        params?: {
            [key: string]: string | string[];
        };
        responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    }) {
        if ('body' in options) {
            this.setBody(options.body);
        }

        if ('headers' in options) {
            this.setHeaders(options.headers);
        }

        if ('params' in options) {
            this.setParams(options.params);
        }

        if ('responseType' in options) {
            this.setResponseType(options.responseType);
        }
    }

    public getHeaders(): HttpHeaders {
        return new HttpHeaders(this._headers);
    }

    public setHeaders(headers: { [key: string]: string | string[] }) {
        this._headers = headers;
        return this;
    }

    public hasHeader(key: string): boolean {
        return key in this._headers;
    }

    public addHeader(key: string, value: string | string[]) {
        if (Array.isArray(value)) {
            value = value.join(';');
        }
        this._headers[key] = value;
        return this;
    }

    public removeHeader(key: string) {
        if (this.hasHeader(key)) {
            delete this._headers[key];
        }
        return this;
    }

    public getParams() {
        return this._params;
    }

    public setParams(params: { [key: string]: string | string[] }) {
        this._params = params;
        return this;
    }

    public has(key: string) {
        return this.hasParams(key) || this.hasBody(key);
    }

    public hasParams(key: string): boolean {
        return key in this._params;
    }

    public addParams(key: string, value: string | string[]) {
        this._params[key] = value;
        return this;
    }

    public appendParams(key: string, value: string) {
        if (!this.hasParams(key)) {
            return this.addParams(key, value);
        }
        if (Array.isArray(this._params[key])) {
            (<Array<string>>this._params[key]).push(value);
        } else {
            this.addParams(key, [<string>this._params[key], value]);
        }
        return this;
    }

    public removeParams(key: string) {
        if (this.hasParams(key)) {
            delete this._params[key];
        }
        return this;
    }

    public getQueryString() {
        return buildQueryStr(this._params);
    }

    public isFormBody(): boolean {
        return this._body instanceof FormData;
    }

    public getBody(key?: string) {
        if (!key) {
            return this._body;
        }
        if (this.isFormBody()) {
            return this._body.get(key);
        }
        return key.split('.').reduce((value, key) => value ? value[key] : null, this._body);
    }

    public setBody(body: any | FormData) {
        this._body = body;
        return this;
    }

    public hasBody(key: string) {
        if (this.isFormBody()) {
            return this._body.has(key);
        }
        const parts = key.split('.');

        let prev = this.getBody();

        for (let part of parts) {
            if (part in prev) {
                prev = prev[part];
            } else {
                return false;
            }
        }
        return true;
    }

    public addBody(key: string, value: string | any) {
        if (this.isFormBody()) {
            if (this.hasBody(key)) {
                this._body.set(key, value);
            } else {
                this._body.append(key, value);
            }
        } else {
            this._body[key] = value;
        }
        return this;
    }

    public removeBody(key: string) {
        if (this.isFormBody()) {
            this._body.delete(key);
        } else if (key in this._body) {
            delete this._body[key];
        }
        return this;
    }
}
