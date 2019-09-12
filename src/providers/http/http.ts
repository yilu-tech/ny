import { Injectable } from '@angular/core';
import { HttpKernel } from './http.kernel';
import { HttpRequest } from './http.request';

@Injectable()
export class Http {

    private _middleware: any[];

    constructor(private httpKernel: HttpKernel) {
    }

    public static middleware(...argv) {
        return {
            provide: Http,
            useFactory: (httpKernel: HttpKernel) => Object.assign(new Http(httpKernel), {_middleware: argv}),
            deps: [HttpKernel]
        };
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
        return this.httpKernel.next(new HttpRequest(method, url, options), this._middleware);
    }
}
