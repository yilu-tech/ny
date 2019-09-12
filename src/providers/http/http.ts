import { Injectable, InjectionToken, Inject, Optional } from '@angular/core';
import { HttpKernel, HttpMiddleware } from './http.kernel';
import { HttpRequest } from './http.request';

export const HTTP_MIDDLEWARE = new InjectionToken<HttpMiddleware[]>('http.middleware');

@Injectable()
export class Http {

    constructor(private httpKernel: HttpKernel, @Optional() @Inject(HTTP_MIDDLEWARE) private middleware: HttpMiddleware[]) {

    }

    public static middleware(...argv) {
        return [
            Http,
            { provide: HTTP_MIDDLEWARE, useValue: argv }
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
        return this.httpKernel.next(new HttpRequest(method, url, options), this.middleware);
    }
}
