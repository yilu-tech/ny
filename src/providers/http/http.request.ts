import { HttpHeaders } from '@angular/common/http';

export class HttpRequest {
    private _url: string;

    private _method: string;

    private _headers: { [key: string]: string | string[] } = {};

    private _params: { [key: string]: string } = {};

    private _body: any | FormData;

    private _responseType: 'arraybuffer' | 'blob' | 'json' | 'text' = 'json';

    constructor(method?: string, url?: string, options?: any) {
        this.setMethod(method).setUrl(url);
        if (options) {
            this.setOptions(options);
        }
    }

    public getUrl(): string {
        return this._url;
    }

    public setUrl(url: string) {
        this._url = url;
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
            [key: string]: string;
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

    public setParams(params: { [key: string]: string }) {
        this._params = params;
        return this;
    }

    public hasParams(key: string): boolean {
        return key in this._params;
    }

    public addParams(key: string, value: string) {
        this._params[key] = value;
        return this;
    }

    public removeParams(key: string) {
        if (this.hasParams(key)) {
            delete this._params[key];
        }
        return this;
    }

    public getQueryString() {
        let string = '';
        for (let key in this._params) {
            string += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(this._params[key]);
        }
        return string.substring(1);
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
